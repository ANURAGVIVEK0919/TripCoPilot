import { v } from "convex/values";
import { mutation, query, action, internalMutation } from "./_generated/server";
import { api, internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============ PACKING LIST MANAGEMENT ============

// Create a new packing list
export const createPackingList = mutation({
    args: {
        tripId: v.string(),
        name: v.string(),
        template: v.optional(v.union(
            v.literal('beach'),
            v.literal('skiing'),
            v.literal('business'),
            v.literal('backpacking'),
            v.literal('city'),
            v.literal('camping'),
            v.literal('custom')
        )),
        isAIGenerated: v.boolean(),
        generatedPrompt: v.optional(v.string()),
        createdBy: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const listId = await ctx.db.insert('PackingLists', {
            tripId: args.tripId,
            name: args.name,
            template: args.template,
            isAIGenerated: args.isAIGenerated,
            generatedPrompt: args.generatedPrompt,
            createdBy: args.createdBy,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return listId;
    },
});

// Get packing lists for a trip
export const getPackingListsByTrip = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        const lists = await ctx.db
            .query('PackingLists')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();
        return lists;
    },
});

// Get single packing list with items
export const getPackingListWithItems = query({
    args: { listId: v.id('PackingLists') },
    handler: async (ctx, args) => {
        const list = await ctx.db.get(args.listId);
        if (!list) return null;

        const items = await ctx.db
            .query('PackingItems')
            .withIndex('by_list', (q) => q.eq('packingListId', args.listId))
            .collect();

        return { ...list, items };
    },
});

// Update packing list
export const updatePackingList = mutation({
    args: {
        listId: v.id('PackingLists'),
        name: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.listId, {
            name: args.name,
            updatedAt: Date.now(),
        });
    },
});

// Delete packing list and all its items
export const deletePackingList = mutation({
    args: { listId: v.id('PackingLists') },
    handler: async (ctx, args) => {
        // Delete all items first
        const items = await ctx.db
            .query('PackingItems')
            .withIndex('by_list', (q) => q.eq('packingListId', args.listId))
            .collect();

        for (const item of items) {
            await ctx.db.delete(item._id);
        }

        // Delete the list
        await ctx.db.delete(args.listId);
    },
});

// ============ PACKING ITEMS MANAGEMENT ============

// Add item to packing list
export const addPackingItem = mutation({
    args: {
        packingListId: v.id('PackingLists'),
        tripId: v.string(),
        category: v.union(
            v.literal('clothing'),
            v.literal('toiletries'),
            v.literal('electronics'),
            v.literal('documents'),
            v.literal('medical'),
            v.literal('accessories'),
            v.literal('entertainment'),
            v.literal('food_snacks'),
            v.literal('other')
        ),
        name: v.string(),
        quantity: v.number(),
        isEssential: v.boolean(),
        weight: v.optional(v.number()),
        notes: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        addedBy: v.id('UserTable'),
        assignedTo: v.optional(v.id('UserTable')),
    },
    handler: async (ctx, args) => {
        const itemId = await ctx.db.insert('PackingItems', {
            packingListId: args.packingListId,
            tripId: args.tripId,
            category: args.category,
            name: args.name,
            quantity: args.quantity,
            isPacked: false,
            isEssential: args.isEssential,
            weight: args.weight,
            notes: args.notes,
            imageUrl: args.imageUrl,
            addedBy: args.addedBy,
            assignedTo: args.assignedTo,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update list timestamp
        await ctx.db.patch(args.packingListId, {
            updatedAt: Date.now(),
        });

        return itemId;
    },
});

// Add multiple items at once (for AI generation/templates)
export const addMultipleItems = mutation({
    args: {
        packingListId: v.id('PackingLists'),
        tripId: v.string(),
        items: v.array(v.object({
            category: v.union(
                v.literal('clothing'),
                v.literal('toiletries'),
                v.literal('electronics'),
                v.literal('documents'),
                v.literal('medical'),
                v.literal('accessories'),
                v.literal('entertainment'),
                v.literal('food_snacks'),
                v.literal('other')
            ),
            name: v.string(),
            quantity: v.number(),
            isEssential: v.boolean(),
            weight: v.optional(v.number()),
        })),
        addedBy: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const itemIds = [];
        
        for (const item of args.items) {
            const itemId = await ctx.db.insert('PackingItems', {
                packingListId: args.packingListId,
                tripId: args.tripId,
                category: item.category,
                name: item.name,
                quantity: item.quantity,
                isPacked: false,
                isEssential: item.isEssential,
                weight: item.weight,
                addedBy: args.addedBy,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            itemIds.push(itemId);
        }

        // Update list timestamp
        await ctx.db.patch(args.packingListId, {
            updatedAt: Date.now(),
        });

        return itemIds;
    },
});

// Update packing item
export const updatePackingItem = mutation({
    args: {
        itemId: v.id('PackingItems'),
        name: v.optional(v.string()),
        quantity: v.optional(v.number()),
        isEssential: v.optional(v.boolean()),
        weight: v.optional(v.number()),
        notes: v.optional(v.string()),
        imageUrl: v.optional(v.string()),
        assignedTo: v.optional(v.id('UserTable')),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error('Item not found');

        const updates: any = { updatedAt: Date.now() };
        if (args.name !== undefined) updates.name = args.name;
        if (args.quantity !== undefined) updates.quantity = args.quantity;
        if (args.isEssential !== undefined) updates.isEssential = args.isEssential;
        if (args.weight !== undefined) updates.weight = args.weight;
        if (args.notes !== undefined) updates.notes = args.notes;
        if (args.imageUrl !== undefined) updates.imageUrl = args.imageUrl;
        if (args.assignedTo !== undefined) updates.assignedTo = args.assignedTo;

        await ctx.db.patch(args.itemId, updates);

        // Update list timestamp
        await ctx.db.patch(item.packingListId, {
            updatedAt: Date.now(),
        });
    },
});

// Toggle item packed status
export const toggleItemPacked = mutation({
    args: {
        itemId: v.id('PackingItems'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error('Item not found');

        const newPackedStatus = !item.isPacked;

        await ctx.db.patch(args.itemId, {
            isPacked: newPackedStatus,
            packedBy: newPackedStatus ? args.userId : undefined,
            packedAt: newPackedStatus ? Date.now() : undefined,
            updatedAt: Date.now(),
        });

        // Update list timestamp
        await ctx.db.patch(item.packingListId, {
            updatedAt: Date.now(),
        });
    },
});

// Delete packing item
export const deletePackingItem = mutation({
    args: { itemId: v.id('PackingItems') },
    handler: async (ctx, args) => {
        const item = await ctx.db.get(args.itemId);
        if (!item) throw new Error('Item not found');

        await ctx.db.delete(args.itemId);

        // Update list timestamp
        await ctx.db.patch(item.packingListId, {
            updatedAt: Date.now(),
        });
    },
});

// Get items by category for a list
export const getItemsByCategory = query({
    args: {
        packingListId: v.id('PackingLists'),
        category: v.union(
            v.literal('clothing'),
            v.literal('toiletries'),
            v.literal('electronics'),
            v.literal('documents'),
            v.literal('medical'),
            v.literal('accessories'),
            v.literal('entertainment'),
            v.literal('food_snacks'),
            v.literal('other')
        ),
    },
    handler: async (ctx, args) => {
        const items = await ctx.db
            .query('PackingItems')
            .withIndex('by_category', (q) =>
                q.eq('packingListId', args.packingListId).eq('category', args.category)
            )
            .collect();
        return items;
    },
});

// Get packing progress statistics
export const getPackingProgress = query({
    args: { listId: v.id('PackingLists') },
    handler: async (ctx, args) => {
        const items = await ctx.db
            .query('PackingItems')
            .withIndex('by_list', (q) => q.eq('packingListId', args.listId))
            .collect();

        const totalItems = items.length;
        const packedItems = items.filter(item => item.isPacked).length;
        const essentialItems = items.filter(item => item.isEssential).length;
        const packedEssential = items.filter(item => item.isEssential && item.isPacked).length;
        const totalWeight = items.reduce((sum, item) => sum + (item.weight || 0), 0);
        const packedWeight = items.filter(item => item.isPacked).reduce((sum, item) => sum + (item.weight || 0), 0);

        // Category breakdown
        const categories = Array.from(new Set(items.map(item => item.category)));
        const categoryProgress = categories.map(category => {
            const categoryItems = items.filter(item => item.category === category);
            const categoryPacked = categoryItems.filter(item => item.isPacked).length;
            return {
                category,
                total: categoryItems.length,
                packed: categoryPacked,
                percentage: categoryItems.length > 0 ? Math.round((categoryPacked / categoryItems.length) * 100) : 0,
            };
        });

        return {
            totalItems,
            packedItems,
            percentage: totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0,
            essentialItems,
            packedEssential,
            essentialPercentage: essentialItems > 0 ? Math.round((packedEssential / essentialItems) * 100) : 0,
            totalWeight,
            packedWeight,
            categoryProgress,
        };
    },
});

// ============ TEMPLATES ============

// Create packing template
export const createTemplate = mutation({
    args: {
        name: v.string(),
        type: v.union(
            v.literal('beach'),
            v.literal('skiing'),
            v.literal('business'),
            v.literal('backpacking'),
            v.literal('city'),
            v.literal('camping'),
            v.literal('custom')
        ),
        description: v.string(),
        items: v.array(v.object({
            category: v.string(),
            name: v.string(),
            quantity: v.number(),
            isEssential: v.boolean(),
        })),
        isPublic: v.boolean(),
        createdBy: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const templateId = await ctx.db.insert('PackingTemplates', {
            name: args.name,
            type: args.type,
            description: args.description,
            items: args.items,
            isPublic: args.isPublic,
            useCount: 0,
            createdBy: args.createdBy,
            createdAt: Date.now(),
        });
        return templateId;
    },
});

// Get templates by type
export const getTemplatesByType = query({
    args: {
        type: v.optional(v.union(
            v.literal('beach'),
            v.literal('skiing'),
            v.literal('business'),
            v.literal('backpacking'),
            v.literal('city'),
            v.literal('camping'),
            v.literal('custom')
        )),
    },
    handler: async (ctx, args) => {
        if (args.type !== undefined) {
            const templates = await ctx.db
                .query('PackingTemplates')
                .withIndex('by_type', (q) => q.eq('type', args.type!))
                .collect();
            return templates.filter(t => t.isPublic).sort((a, b) => b.useCount - a.useCount);
        } else {
            const templates = await ctx.db
                .query('PackingTemplates')
                .withIndex('by_public', (q) => q.eq('isPublic', true))
                .collect();
            return templates.sort((a, b) => b.useCount - a.useCount);
        }
    },
});

// Apply template to packing list
export const applyTemplate = mutation({
    args: {
        packingListId: v.id('PackingLists'),
        tripId: v.string(),
        templateId: v.id('PackingTemplates'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const template = await ctx.db.get(args.templateId);
        if (!template) throw new Error('Template not found');

        // Add all items from template
        for (const item of template.items) {
            await ctx.db.insert('PackingItems', {
                packingListId: args.packingListId,
                tripId: args.tripId,
                category: item.category as any,
                name: item.name,
                quantity: item.quantity,
                isPacked: false,
                isEssential: item.isEssential,
                addedBy: args.userId,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        // Increment template use count
        await ctx.db.patch(args.templateId, {
            useCount: template.useCount + 1,
        });

        // Update list
        await ctx.db.patch(args.packingListId, {
            template: template.type,
            updatedAt: Date.now(),
        });
    },
});

// ============ AI GENERATION ============

// Generate packing list with AI (action - calls external API)
export const generatePackingListAI = action({
    args: {
        tripId: v.string(),
        destination: v.string(),
        duration: v.number(), // days
        activities: v.array(v.string()),
        weather: v.optional(v.string()),
        tripType: v.string(), // beach, skiing, business, etc.
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args): Promise<{ listId: Id<"PackingLists">, itemCount: number }> => {
        // Build prompt for AI
        const prompt = `Generate a comprehensive packing list for a trip with these details:
- Destination: ${args.destination}
- Duration: ${args.duration} days
- Activities: ${args.activities.join(', ')}
- Weather: ${args.weather || 'Not specified'}
- Trip Type: ${args.tripType}

Please provide a JSON array of items with this structure:
{
  "items": [
    {
      "category": "clothing|toiletries|electronics|documents|medical|accessories|entertainment|food_snacks|other",
      "name": "item name",
      "quantity": number,
      "isEssential": boolean,
      "weight": number (in kg, optional)
    }
  ]
}

Make sure to include:
1. Appropriate clothing for the weather and activities
2. Essential documents (passport, tickets, insurance)
3. Toiletries and medical items
4. Electronics and chargers
5. Activity-specific gear
6. Consider the duration and cultural norms of the destination

Return ONLY valid JSON, no additional text.`;

        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
            console.error('GROQ_API_KEY is not configured in Convex environment variables.');
            throw new Error('GROQ_API_KEY is not configured. Please add it to your Convex environment variables.');
        }

        try {
            // Call AI API (using your existing OpenAI/Groq setup)
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${groqApiKey}`,
                },
                body: JSON.stringify({
                    model: 'llama-3.3-70b-versatile',
                    messages: [
                        { role: 'system', content: 'You are a travel packing expert. Generate comprehensive, practical packing lists.' },
                        { role: 'user', content: prompt }
                    ],
                    temperature: 0.7,
                    max_tokens: 2000,
                }),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Groq API error (${response.status}): ${errorText || response.statusText}`);
            }

            const data = await response.json();
            if (!data.choices || data.choices.length === 0 || !data.choices[0]?.message?.content) {
                throw new Error(`Invalid or empty response from Groq API: ${JSON.stringify(data)}`);
            }
            const content = data.choices[0].message.content;

            // Parse JSON response
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('Invalid AI response format: JSON not found in content');

            const parsed = JSON.parse(jsonMatch[0]);
            if (!parsed.items || !Array.isArray(parsed.items)) {
                throw new Error('Invalid AI response structure: parsed items is not an array');
            }
            
            // Create packing list
            const listId: Id<"PackingLists"> = await ctx.runMutation(internal.packingList.createPackingListInternal, {
                tripId: args.tripId,
                name: `AI Generated - ${args.destination}`,
                isAIGenerated: true,
                generatedPrompt: prompt,
                createdBy: args.userId,
            });

            // Add items
            await ctx.runMutation(internal.packingList.addMultipleItemsInternal, {
                packingListId: listId,
                tripId: args.tripId,
                items: parsed.items,
                addedBy: args.userId,
            });

            return { listId, itemCount: parsed.items.length };
        } catch (error) {
            console.error('AI generation error:', error);
            throw new Error(error instanceof Error ? error.message : 'Failed to generate packing list. Please try again.');
        }
    },
});

// ============ REMINDERS ============

// Create packing reminder
export const createReminder = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        reminderType: v.union(
            v.literal('pack_soon'),
            v.literal('last_minute'),
            v.literal('custom')
        ),
        scheduledFor: v.number(),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const reminderId = await ctx.db.insert('PackingReminders', {
            tripId: args.tripId,
            userId: args.userId,
            reminderType: args.reminderType,
            scheduledFor: args.scheduledFor,
            isSent: false,
            message: args.message,
            createdAt: Date.now(),
        });
        return reminderId;
    },
});

// Get pending reminders (for cron job)
export const getPendingReminders = query({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const reminders = await ctx.db.query('PackingReminders').collect();
        
        return reminders.filter(r => 
            !r.isSent && r.scheduledFor <= now
        );
    },
});

// Mark reminder as sent
export const markReminderSent = mutation({
    args: { reminderId: v.id('PackingReminders') },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.reminderId, {
            isSent: true,
            sentAt: Date.now(),
        });
    },
});

// Get reminders for trip
export const getRemindersByTrip = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        const reminders = await ctx.db
            .query('PackingReminders')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();
        return reminders;
    },
});

// ============ INTERNAL MUTATIONS (for AI action) ============

// Internal: Create packing list (called from action)
export const createPackingListInternal = internalMutation({
    args: {
        tripId: v.string(),
        name: v.string(),
        isAIGenerated: v.boolean(),
        generatedPrompt: v.optional(v.string()),
        createdBy: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const listId = await ctx.db.insert('PackingLists', {
            tripId: args.tripId,
            name: args.name,
            isAIGenerated: args.isAIGenerated,
            generatedPrompt: args.generatedPrompt,
            createdBy: args.createdBy,
            createdAt: now,
            updatedAt: now,
        });
        return listId;
    },
});

// Internal: Add multiple items (called from action)
export const addMultipleItemsInternal = internalMutation({
    args: {
        packingListId: v.id('PackingLists'),
        tripId: v.string(),
        items: v.array(v.object({
            category: v.union(
                v.literal('clothing'),
                v.literal('toiletries'),
                v.literal('electronics'),
                v.literal('documents'),
                v.literal('medical'),
                v.literal('accessories'),
                v.literal('entertainment'),
                v.literal('food_snacks'),
                v.literal('other')
            ),
            name: v.string(),
            quantity: v.optional(v.number()),
            isEssential: v.optional(v.boolean()),
            weight: v.optional(v.number()),
            notes: v.optional(v.string()),
        })),
        addedBy: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const insertPromises = args.items.map(item =>
            ctx.db.insert('PackingItems', {
                packingListId: args.packingListId,
                tripId: args.tripId,
                category: item.category,
                name: item.name,
                quantity: item.quantity ?? 1,
                isPacked: false,
                isEssential: item.isEssential ?? false,
                weight: item.weight,
                notes: item.notes,
                addedBy: args.addedBy,
                createdAt: now,
                updatedAt: now,
            })
        );
        await Promise.all(insertPromises);
        return args.items.length;
    },
});
