import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// ============ TIP MANAGEMENT ============

// Create a new insider tip
export const createTip = mutation({
    args: {
        destination: v.string(),
        category: v.union(
            v.literal('food'),
            v.literal('activities'),
            v.literal('transport'),
            v.literal('hidden_gems'),
            v.literal('safety'),
            v.literal('budget'),
            v.literal('cultural'),
            v.literal('seasonal')
        ),
        title: v.string(),
        content: v.string(),
        images: v.optional(v.array(v.string())),
        specificLocation: v.optional(v.string()),
        priceRange: v.optional(v.union(
            v.literal('free'),
            v.literal('budget'),
            v.literal('moderate'),
            v.literal('expensive')
        )),
        bestTime: v.optional(v.string()),
        tags: v.array(v.string()),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if user is verified local for this destination
        const verifiedLocal = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_user_destination', (q) =>
                q.eq('userId', args.userId).eq('destination', args.destination)
            )
            .first();

        const tipId = await ctx.db.insert('InsiderTips', {
            destination: args.destination,
            category: args.category,
            title: args.title,
            content: args.content,
            images: args.images,
            specificLocation: args.specificLocation,
            priceRange: args.priceRange,
            bestTime: args.bestTime,
            tags: args.tags,
            userId: args.userId,
            userName: args.userName,
            userImage: args.userImage,
            isVerifiedLocal: !!verifiedLocal,
            helpfulVotes: [],
            notHelpfulVotes: [],
            bookmarkCount: 0,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Update verified local tip count if applicable
        if (verifiedLocal) {
            await ctx.db.patch(verifiedLocal._id, {
                tipCount: verifiedLocal.tipCount + 1,
            });
        }

        return tipId;
    },
});

// Get all tips (with optional filters)
export const getAllTips = query({
    args: {
        destination: v.optional(v.string()),
        category: v.optional(v.string()),
        sortBy: v.optional(v.union(v.literal('recent'), v.literal('helpful'), v.literal('bookmarked'))),
    },
    handler: async (ctx, args) => {
        let tips;

        // Apply destination filter
        if (args.destination) {
            tips = await ctx.db
                .query('InsiderTips')
                .withIndex('by_destination', (q) =>
                    q.eq('destination', args.destination!)
                )
                .collect();
        } else {
            tips = await ctx.db.query('InsiderTips').collect();
        }

        // Apply category filter (post-query since we can't use two indexes)
        if (args.category) {
            tips = tips.filter(tip => tip.category === args.category);
        }

        // Sort tips
        if (args.sortBy === 'helpful') {
            tips.sort((a, b) => b.helpfulVotes.length - a.helpfulVotes.length);
        } else if (args.sortBy === 'bookmarked') {
            tips.sort((a, b) => b.bookmarkCount - a.bookmarkCount);
        } else {
            // Default to recent
            tips.sort((a, b) => b.createdAt - a.createdAt);
        }

        return tips;
    },
});

// Get tips by destination and category
export const getTipsByDestinationAndCategory = query({
    args: {
        destination: v.string(),
        category: v.optional(v.union(
            v.literal('food'),
            v.literal('activities'),
            v.literal('transport'),
            v.literal('hidden_gems'),
            v.literal('safety'),
            v.literal('budget'),
            v.literal('cultural'),
            v.literal('seasonal')
        )),
    },
    handler: async (ctx, args) => {
        if (args.category) {
            const tips = await ctx.db
                .query('InsiderTips')
                .withIndex('by_destination_category', (q) =>
                    q.eq('destination', args.destination).eq('category', args.category!)
                )
                .collect();
            return tips.sort((a, b) => b.helpfulVotes.length - a.helpfulVotes.length);
        } else {
            const tips = await ctx.db
                .query('InsiderTips')
                .withIndex('by_destination', (q) =>
                    q.eq('destination', args.destination)
                )
                .collect();
            return tips.sort((a, b) => b.helpfulVotes.length - a.helpfulVotes.length);
        }
    },
});

// Get tip by ID
export const getTipById = query({
    args: { tipId: v.id('InsiderTips') },
    handler: async (ctx, args) => {
        return await ctx.db.get(args.tipId);
    },
});

// Update tip
export const updateTip = mutation({
    args: {
        tipId: v.id('InsiderTips'),
        title: v.string(),
        content: v.string(),
        images: v.optional(v.array(v.string())),
        specificLocation: v.optional(v.string()),
        priceRange: v.optional(v.union(
            v.literal('free'),
            v.literal('budget'),
            v.literal('moderate'),
            v.literal('expensive')
        )),
        bestTime: v.optional(v.string()),
        tags: v.array(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.tipId, {
            title: args.title,
            content: args.content,
            images: args.images,
            specificLocation: args.specificLocation,
            priceRange: args.priceRange,
            bestTime: args.bestTime,
            tags: args.tags,
            updatedAt: Date.now(),
        });
    },
});

// Delete tip
export const deleteTip = mutation({
    args: { tipId: v.id('InsiderTips') },
    handler: async (ctx, args) => {
        const tip = await ctx.db.get(args.tipId);
        if (!tip) throw new Error('Tip not found');

        // Delete all bookmarks for this tip
        const bookmarks = await ctx.db
            .query('TipBookmarks')
            .withIndex('by_tip', (q) => q.eq('tipId', args.tipId))
            .collect();
        
        for (const bookmark of bookmarks) {
            await ctx.db.delete(bookmark._id);
        }

        // Update verified local tip count
        const verifiedLocal = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_user_destination', (q) =>
                q.eq('userId', tip.userId).eq('destination', tip.destination)
            )
            .first();

        if (verifiedLocal && verifiedLocal.tipCount > 0) {
            await ctx.db.patch(verifiedLocal._id, {
                tipCount: verifiedLocal.tipCount - 1,
            });
        }

        // Delete the tip
        await ctx.db.delete(args.tipId);
    },
});

// ============ VOTING & ENGAGEMENT ============

// Toggle helpful vote
export const toggleHelpfulVote = mutation({
    args: {
        tipId: v.id('InsiderTips'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const tip = await ctx.db.get(args.tipId);
        if (!tip) throw new Error('Tip not found');

        const hasVotedHelpful = tip.helpfulVotes.includes(args.userId);
        const hasVotedNotHelpful = tip.notHelpfulVotes.includes(args.userId);

        let newHelpfulVotes = [...tip.helpfulVotes];
        let newNotHelpfulVotes = [...tip.notHelpfulVotes];

        if (hasVotedHelpful) {
            // Remove helpful vote
            newHelpfulVotes = newHelpfulVotes.filter(id => id !== args.userId);
        } else {
            // Add helpful vote and remove not helpful if exists
            newHelpfulVotes.push(args.userId);
            if (hasVotedNotHelpful) {
                newNotHelpfulVotes = newNotHelpfulVotes.filter(id => id !== args.userId);
            }
        }

        await ctx.db.patch(args.tipId, {
            helpfulVotes: newHelpfulVotes,
            notHelpfulVotes: newNotHelpfulVotes,
        });

        // Update verified local's helpful score
        const verifiedLocal = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_user_destination', (q) =>
                q.eq('userId', tip.userId).eq('destination', tip.destination)
            )
            .first();

        if (verifiedLocal) {
            const userTips = await ctx.db
                .query('InsiderTips')
                .withIndex('by_user', (q) => q.eq('userId', tip.userId))
                .collect();
            
            const totalHelpful = userTips.reduce((sum, t) => sum + t.helpfulVotes.length, 0);
            
            await ctx.db.patch(verifiedLocal._id, {
                helpfulScore: totalHelpful,
            });

            // Check if user qualifies for community verification (10+ helpful tips)
            if (verifiedLocal.verificationMethod === 'user_claimed' && totalHelpful >= 10) {
                await ctx.db.patch(verifiedLocal._id, {
                    verificationMethod: 'community_verified',
                });
            }
        }
    },
});

// Toggle not helpful vote
export const toggleNotHelpfulVote = mutation({
    args: {
        tipId: v.id('InsiderTips'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const tip = await ctx.db.get(args.tipId);
        if (!tip) throw new Error('Tip not found');

        const hasVotedHelpful = tip.helpfulVotes.includes(args.userId);
        const hasVotedNotHelpful = tip.notHelpfulVotes.includes(args.userId);

        let newHelpfulVotes = [...tip.helpfulVotes];
        let newNotHelpfulVotes = [...tip.notHelpfulVotes];

        if (hasVotedNotHelpful) {
            // Remove not helpful vote
            newNotHelpfulVotes = newNotHelpfulVotes.filter(id => id !== args.userId);
        } else {
            // Add not helpful vote and remove helpful if exists
            newNotHelpfulVotes.push(args.userId);
            if (hasVotedHelpful) {
                newHelpfulVotes = newHelpfulVotes.filter(id => id !== args.userId);
            }
        }

        await ctx.db.patch(args.tipId, {
            helpfulVotes: newHelpfulVotes,
            notHelpfulVotes: newNotHelpfulVotes,
        });
    },
});

// ============ BOOKMARKS ============

// Toggle bookmark
export const toggleBookmark = mutation({
    args: {
        tipId: v.id('InsiderTips'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const existingBookmark = await ctx.db
            .query('TipBookmarks')
            .withIndex('by_user_tip', (q) =>
                q.eq('userId', args.userId).eq('tipId', args.tipId)
            )
            .first();

        const tip = await ctx.db.get(args.tipId);
        if (!tip) throw new Error('Tip not found');

        if (existingBookmark) {
            // Remove bookmark
            await ctx.db.delete(existingBookmark._id);
            await ctx.db.patch(args.tipId, {
                bookmarkCount: Math.max(0, tip.bookmarkCount - 1),
            });
        } else {
            // Add bookmark
            await ctx.db.insert('TipBookmarks', {
                userId: args.userId,
                tipId: args.tipId,
                createdAt: Date.now(),
            });
            await ctx.db.patch(args.tipId, {
                bookmarkCount: tip.bookmarkCount + 1,
            });
        }
    },
});

// Get user's bookmarked tips
export const getUserBookmarks = query({
    args: { userId: v.id('UserTable') },
    handler: async (ctx, args) => {
        const bookmarks = await ctx.db
            .query('TipBookmarks')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect();

        const tips = await Promise.all(
            bookmarks.map(async (bookmark) => {
                const tip = await ctx.db.get(bookmark.tipId);
                return tip;
            })
        );

        return tips.filter(tip => tip !== null);
    },
});

// Check if user has bookmarked a tip
export const hasBookmarked = query({
    args: {
        tipId: v.id('InsiderTips'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const bookmark = await ctx.db
            .query('TipBookmarks')
            .withIndex('by_user_tip', (q) =>
                q.eq('userId', args.userId).eq('tipId', args.tipId)
            )
            .first();
        return !!bookmark;
    },
});

// ============ VERIFIED LOCALS ============

// Claim to be a local (self-verification)
export const claimLocalStatus = mutation({
    args: {
        userId: v.id('UserTable'),
        destination: v.string(),
    },
    handler: async (ctx, args) => {
        const existing = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_user_destination', (q) =>
                q.eq('userId', args.userId).eq('destination', args.destination)
            )
            .first();

        if (existing) {
            throw new Error('Already claimed local status for this destination');
        }

        // Count existing tips for this destination
        const tips = await ctx.db
            .query('InsiderTips')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect();

        const destinationTips = tips.filter(tip => tip.destination === args.destination);
        const totalHelpful = destinationTips.reduce((sum, tip) => sum + tip.helpfulVotes.length, 0);

        await ctx.db.insert('VerifiedLocals', {
            userId: args.userId,
            destination: args.destination,
            verificationMethod: 'user_claimed',
            verifiedAt: Date.now(),
            tipCount: destinationTips.length,
            helpfulScore: totalHelpful,
        });

        // Update all existing tips to show verified badge
        for (const tip of destinationTips) {
            await ctx.db.patch(tip._id, {
                isVerifiedLocal: true,
            });
        }
    },
});

// Get verified locals for a destination
export const getVerifiedLocals = query({
    args: { destination: v.string() },
    handler: async (ctx, args) => {
        const locals = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_destination', (q) => q.eq('destination', args.destination))
            .collect();

        // Sort by helpful score
        return locals.sort((a, b) => b.helpfulScore - a.helpfulScore);
    },
});

// Check if user is verified local for destination
export const isVerifiedLocal = query({
    args: {
        userId: v.id('UserTable'),
        destination: v.string(),
    },
    handler: async (ctx, args) => {
        const verifiedLocal = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_user_destination', (q) =>
                q.eq('userId', args.userId).eq('destination', args.destination)
            )
            .first();
        return verifiedLocal;
    },
});

// Get all destinations where user is verified local
export const getUserLocalDestinations = query({
    args: { userId: v.id('UserTable') },
    handler: async (ctx, args) => {
        const locals = await ctx.db
            .query('VerifiedLocals')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .collect();
        return locals;
    },
});

// ============ SEARCH & DISCOVERY ============

// Search tips by query string
export const searchTips = query({
    args: {
        query: v.string(),
        destination: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const searchTerm = args.query.toLowerCase();
        
        let tips = await ctx.db.query('InsiderTips').collect();

        // Filter by destination if provided
        if (args.destination) {
            tips = tips.filter(tip => tip.destination === args.destination);
        }

        // Search in title, content, tags, and location
        tips = tips.filter(tip =>
            tip.title.toLowerCase().includes(searchTerm) ||
            tip.content.toLowerCase().includes(searchTerm) ||
            tip.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            tip.specificLocation?.toLowerCase().includes(searchTerm)
        );

        // Sort by relevance (helpful votes)
        return tips.sort((a, b) => b.helpfulVotes.length - a.helpfulVotes.length);
    },
});

// Get popular destinations (most tips)
export const getPopularDestinations = query({
    handler: async (ctx) => {
        const tips = await ctx.db.query('InsiderTips').collect();
        
        const destinationCounts: { [key: string]: number } = {};
        tips.forEach(tip => {
            destinationCounts[tip.destination] = (destinationCounts[tip.destination] || 0) + 1;
        });

        const destinations = Object.entries(destinationCounts)
            .map(([destination, count]) => ({ destination, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return destinations;
    },
});

// Get trending tips (most helpful votes in last 7 days)
export const getTrendingTips = query({
    args: { limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const tips = await ctx.db.query('InsiderTips').collect();
        
        const recentTips = tips
            .filter(tip => tip.createdAt >= sevenDaysAgo)
            .sort((a, b) => b.helpfulVotes.length - a.helpfulVotes.length)
            .slice(0, args.limit || 10);

        return recentTips;
    },
});
