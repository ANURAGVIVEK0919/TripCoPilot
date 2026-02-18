import { v } from "convex/values";
import { mutation, query, action, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============ CONVERSATION MANAGEMENT ============

// Create new conversation
export const createConversation = mutation({
    args: {
        userId: v.id('UserTable'),
        tripId: v.optional(v.string()),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const conversationId = await ctx.db.insert('ChatConversations', {
            userId: args.userId,
            tripId: args.tripId,
            title: args.title,
            lastMessageAt: now,
            messageCount: 0,
            createdAt: now,
        });
        return conversationId;
    },
});

// Get user's conversations
export const getUserConversations = query({
    args: { 
        userId: v.id('UserTable'),
        tripId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        let conversations;
        
        if (args.tripId) {
            // Get conversations for specific trip
            conversations = await ctx.db
                .query('ChatConversations')
                .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
                .filter((q) => q.eq(q.field('userId'), args.userId))
                .order('desc')
                .collect();
        } else {
            // Get all user conversations
            conversations = await ctx.db
                .query('ChatConversations')
                .withIndex('by_user_and_date', (q) => q.eq('userId', args.userId))
                .order('desc')
                .take(50);
        }
        
        return conversations;
    },
});

// Get conversation with messages
export const getConversationWithMessages = query({
    args: { conversationId: v.id('ChatConversations') },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return null;

        const messages = await ctx.db
            .query('ChatMessages')
            .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
            .collect();

        return { conversation, messages };
    },
});

// Delete conversation
export const deleteConversation = mutation({
    args: { conversationId: v.id('ChatConversations') },
    handler: async (ctx, args) => {
        // Delete all messages first
        const messages = await ctx.db
            .query('ChatMessages')
            .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
            .collect();
        
        for (const message of messages) {
            await ctx.db.delete(message._id);
        }

        // Delete conversation
        await ctx.db.delete(args.conversationId);
    },
});

// ============ MESSAGE MANAGEMENT ============

// Add message to conversation
export const addMessage = mutation({
    args: {
        conversationId: v.id('ChatConversations'),
        userId: v.id('UserTable'),
        role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
        content: v.string(),
        context: v.optional(v.object({
            tripId: v.optional(v.string()),
            tripName: v.optional(v.string()),
            actionTaken: v.optional(v.string()),
            data: v.optional(v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert('ChatMessages', {
            conversationId: args.conversationId,
            userId: args.userId,
            role: args.role,
            content: args.content,
            context: args.context,
            createdAt: Date.now(),
        });

        // Update conversation
        const conversation = await ctx.db.get(args.conversationId);
        if (conversation) {
            await ctx.db.patch(args.conversationId, {
                lastMessageAt: Date.now(),
                messageCount: conversation.messageCount + 1,
            });
        }

        return messageId;
    },
});

// Get messages for conversation
export const getMessages = query({
    args: { conversationId: v.id('ChatConversations') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('ChatMessages')
            .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
            .collect();
    },
});

// ============ AI CHAT ACTION ============

// Main AI chat action
export const sendChatMessage = action({
    args: {
        conversationId: v.optional(v.id('ChatConversations')),
        userId: v.id('UserTable'),
        message: v.string(),
        tripId: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{ 
        conversationId: Id<"ChatConversations">, 
        response: string,
        actionTaken?: string 
    }> => {
        try {
            // Get user context
            const user = await ctx.runQuery(internal.aiChat.getUserContext, {
                userId: args.userId,
            });

            // Get trip context if tripId provided
            let tripContext = null;
            if (args.tripId) {
                tripContext = await ctx.runQuery(internal.aiChat.getTripContext, {
                    tripId: args.tripId,
                    userId: args.userId,
                });
            }

            // Create or get conversation
            let conversationId = args.conversationId;
            if (!conversationId) {
                // Auto-generate title from first message
                const title = args.message.length > 50 
                    ? args.message.substring(0, 47) + '...' 
                    : args.message;
                
                conversationId = await ctx.runMutation(internal.aiChat.createConversationInternal, {
                    userId: args.userId,
                    tripId: args.tripId,
                    title,
                });
            }

            // Get conversation history
            const history = await ctx.runQuery(internal.aiChat.getConversationHistory, {
                conversationId,
            });

            // Add user message
            await ctx.runMutation(internal.aiChat.addMessageInternal, {
                conversationId,
                userId: args.userId,
                role: 'user',
                content: args.message,
                context: tripContext ? {
                    tripId: args.tripId,
                    tripName: tripContext.tripName,
                } : undefined,
            });

            // Build AI prompt with context
            const systemPrompt = buildSystemPrompt(user, tripContext);
            const conversationHistory = history.map((m: any) => ({
                role: m.role,
                content: m.content,
            }));

            // Call Groq API
            const groqApiKey = process.env.GROQ_API_KEY!;
            if (!groqApiKey) {
                throw new Error('GROQ_API_KEY not configured. Please add it to your Convex environment variables.');
            }

            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${groqApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...conversationHistory,
                        { role: 'user', content: args.message },
                    ],
                    temperature: 0.7,
                    max_tokens: 1000,
                }),
            });

            if (!response.ok) {
                throw new Error(`Groq API error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponse = data.choices[0].message.content;

            // Check if AI suggests an action
            const actionTaken = detectAction(args.message, aiResponse);

            // Add AI response
            await ctx.runMutation(internal.aiChat.addMessageInternal, {
                conversationId,
                userId: args.userId,
                role: 'assistant',
                content: aiResponse,
                context: actionTaken ? {
                    actionTaken,
                } : undefined,
            });

            return { 
                conversationId, 
                response: aiResponse,
                actionTaken,
            };
        } catch (error) {
            console.error('AI chat error:', error);
            throw new Error('Failed to get AI response. Please try again.');
        }
    },
});

// ============ HELPER FUNCTIONS ============

function buildSystemPrompt(user: any, tripContext: any): string {
    let prompt = `You are an expert AI Travel Assistant for ${user.userName || 'the user'}. 

Your role is to help with:
- Trip planning and suggestions
- Budget analysis and recommendations
- Packing advice
- Destination information
- Itinerary optimization
- Expense tracking insights
- Travel tips and safety

Be friendly, concise, and helpful. Use emojis occasionally. Give specific, actionable advice.`;

    if (tripContext) {
        prompt += `\n\nCurrent Trip Context:
- Destination: ${tripContext.tripName}
- Budget: ${tripContext.budget || 'Not set'}
- Duration: ${tripContext.duration || 'Not specified'}
- Group Size: ${tripContext.groupSize || 'Solo'}
- Total Expenses: ${tripContext.totalExpenses || 0} ${tripContext.currency || 'USD'}
- Budget Status: ${tripContext.budgetStatus || 'Unknown'}
- Packing Lists: ${tripContext.packingListCount || 0}
- Items Packed: ${tripContext.packedItemsCount || 0}/${tripContext.totalItems || 0}`;

        if (tripContext.topExpenseCategories) {
            prompt += `\n- Top Spending: ${tripContext.topExpenseCategories.join(', ')}`;
        }
    }

    prompt += `\n\nUser Statistics:
- Total Trips: ${user.totalTrips || 0}
- Total Spent: ${user.totalSpent || 0} USD
- Favorite Destinations: ${user.favoriteDestinations?.join(', ') || 'None yet'}`;

    return prompt;
}

function detectAction(userMessage: string, aiResponse: string): string | undefined {
    const lower = userMessage.toLowerCase();
    
    if (lower.includes('pack') && (lower.includes('list') || lower.includes('what should'))) {
        return 'packing_suggestion';
    }
    if (lower.includes('budget') && (lower.includes('over') || lower.includes('spent'))) {
        return 'budget_analysis';
    }
    if (lower.includes('suggest') || lower.includes('recommend')) {
        return 'recommendation';
    }
    if (lower.includes('weather')) {
        return 'weather_info';
    }
    
    return undefined;
}

// ============ INTERNAL QUERIES & MUTATIONS ============

// Internal: Get user context
export const getUserContext = internalQuery({
    args: { userId: v.id('UserTable') },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        
        // Get user's trips
        const trips = await ctx.db
            .query('TripDetailTable')
            .filter((q) => q.eq(q.field('uid'), args.userId))
            .collect();

        // Calculate total spending
        const expenses = await ctx.db
            .query('TripExpenses')
            .collect();
        
        const userExpenses = expenses.filter(e => 
            trips.some(t => t.tripId === e.tripId)
        );
        
        const totalSpent = userExpenses.reduce((sum, e) => sum + e.amount, 0);

        // Get favorite destinations
        const destinations = trips
            .map(t => t.tripDetail?.destination)
            .filter(Boolean);
        const destinationCounts = destinations.reduce((acc: any, d: string) => {
            acc[d] = (acc[d] || 0) + 1;
            return acc;
        }, {});
        const favoriteDestinations = Object.entries(destinationCounts)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 3)
            .map(([dest]) => dest);

        return {
            userName: user?.name,
            totalTrips: trips.length,
            totalSpent: Math.round(totalSpent),
            favoriteDestinations,
        };
    },
});

// Internal: Get trip context
export const getTripContext = internalQuery({
    args: { 
        tripId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Get trip details
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter((q) => q.eq(q.field('tripId'), args.tripId))
            .first();

        if (!trip) return null;

        const tripDetail = trip.tripDetail;

        // Get expenses
        const expenses = await ctx.db
            .query('TripExpenses')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();

        const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

        // Get budget info
        const budget = await ctx.db
            .query('TripBudget')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .first();

        // Category breakdown
        const categoryTotals = expenses.reduce((acc: any, e) => {
            acc[e.category] = (acc[e.category] || 0) + e.amount;
            return acc;
        }, {});
        
        const topExpenseCategories = Object.entries(categoryTotals)
            .sort(([, a]: any, [, b]: any) => b - a)
            .slice(0, 3)
            .map(([cat]) => cat);

        // Get packing lists
        const packingLists = await ctx.db
            .query('PackingLists')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();

        const packingItems = await ctx.db
            .query('PackingItems')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();

        const packedItems = packingItems.filter(i => i.isPacked);

        // Budget status
        let budgetStatus = 'Unknown';
        if (budget && budget.totalBudget) {
            const percentage = (totalExpenses / budget.totalBudget) * 100;
            if (percentage < 75) budgetStatus = 'On track ✅';
            else if (percentage < 90) budgetStatus = 'Close to limit ⚠️';
            else if (percentage < 100) budgetStatus = 'Almost over budget 🚨';
            else budgetStatus = 'Over budget ❌';
        }

        return {
            tripName: tripDetail?.destination || 'Unknown',
            budget: budget?.totalBudget || null,
            currency: budget?.currency || 'USD',
            duration: tripDetail?.duration || null,
            groupSize: tripDetail?.group_size || 'Solo',
            totalExpenses: Math.round(totalExpenses),
            budgetStatus,
            topExpenseCategories,
            packingListCount: packingLists.length,
            totalItems: packingItems.length,
            packedItemsCount: packedItems.length,
        };
    },
});

// Internal: Get conversation history
export const getConversationHistory = internalQuery({
    args: { conversationId: v.id('ChatConversations') },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('ChatMessages')
            .withIndex('by_conversation', (q) => q.eq('conversationId', args.conversationId))
            .collect();
    },
});

// Internal: Create conversation (called from action)
export const createConversationInternal = internalMutation({
    args: {
        userId: v.id('UserTable'),
        tripId: v.optional(v.string()),
        title: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert('ChatConversations', {
            userId: args.userId,
            tripId: args.tripId,
            title: args.title,
            lastMessageAt: now,
            messageCount: 0,
            createdAt: now,
        });
    },
});

// Internal: Add message (called from action)
export const addMessageInternal = internalMutation({
    args: {
        conversationId: v.id('ChatConversations'),
        userId: v.id('UserTable'),
        role: v.union(v.literal('user'), v.literal('assistant'), v.literal('system')),
        content: v.string(),
        context: v.optional(v.object({
            tripId: v.optional(v.string()),
            tripName: v.optional(v.string()),
            actionTaken: v.optional(v.string()),
            data: v.optional(v.any()),
        })),
    },
    handler: async (ctx, args) => {
        const messageId = await ctx.db.insert('ChatMessages', {
            conversationId: args.conversationId,
            userId: args.userId,
            role: args.role,
            content: args.content,
            context: args.context,
            createdAt: Date.now(),
        });

        // Update conversation
        const conversation = await ctx.db.get(args.conversationId);
        if (conversation) {
            await ctx.db.patch(args.conversationId, {
                lastMessageAt: Date.now(),
                messageCount: conversation.messageCount + 1,
            });
        }

        return messageId;
    },
});
