import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Create a new story
export const createStory = mutation({
    args: {
        title: v.string(),
        content: v.string(),
        imageUrl: v.optional(v.string()),
        images: v.optional(v.array(v.string())),
        destination: v.string(),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
    },
    handler: async (ctx, args) => {
        const storyId = await ctx.db.insert('CommunityStories', {
            title: args.title,
            content: args.content,
            imageUrl: args.imageUrl,
            images: args.images,
            destination: args.destination,
            userId: args.userId,
            userName: args.userName,
            userImage: args.userImage,
            likes: [],
            createdAt: Date.now(),
        });
        return storyId;
    },
});

// Get all stories
export const getAllStories = query({
    handler: async (ctx) => {
        const stories = await ctx.db.query('CommunityStories')
            .order('desc')
            .collect();
        return stories;
    },
});

// Get story by ID
export const getStoryById = query({
    args: { storyId: v.id('CommunityStories') },
    handler: async (ctx, args) => {
        const story = await ctx.db.get(args.storyId);
        return story;
    },
});

// Update story
export const updateStory = mutation({
    args: {
        storyId: v.id('CommunityStories'),
        title: v.string(),
        content: v.string(),
        imageUrl: v.optional(v.string()),
        images: v.optional(v.array(v.string())),
        destination: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.storyId, {
            title: args.title,
            content: args.content,
            imageUrl: args.imageUrl,
            images: args.images,
            destination: args.destination,
        });
    },
});

// Delete story
export const deleteStory = mutation({
    args: { storyId: v.id('CommunityStories') },
    handler: async (ctx, args) => {
        // Delete all comments for this story first
        const comments = await ctx.db
            .query('StoryComments')
            .filter((q) => q.eq(q.field('storyId'), args.storyId))
            .collect();
        
        for (const comment of comments) {
            await ctx.db.delete(comment._id);
        }
        
        // Delete the story
        await ctx.db.delete(args.storyId);
    },
});

// Toggle like on a story
export const toggleLike = mutation({
    args: {
        storyId: v.id('CommunityStories'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const story = await ctx.db.get(args.storyId);
        if (!story) throw new Error('Story not found');

        const likes = story.likes || [];
        const hasLiked = likes.includes(args.userId);

        if (hasLiked) {
            // Remove like
            const newLikes = likes.filter(id => id !== args.userId);
            await ctx.db.patch(args.storyId, {
                likes: newLikes,
            });

            // Delete notification if exists
            const notification = await ctx.db
                .query('Notifications')
                .filter((q) => q.and(
                    q.eq(q.field('storyId'), args.storyId),
                    q.eq(q.field('actorId'), args.userId),
                    q.eq(q.field('type'), 'like')
                ))
                .first();
            
            if (notification) {
                await ctx.db.delete(notification._id);
            }
        } else {
            // Add like
            const newLikes = [...likes, args.userId];
            await ctx.db.patch(args.storyId, {
                likes: newLikes,
            });

            // Create notification for story owner (only if not liking own story)
            if (story.userId !== args.userId) {
                const liker = await ctx.db.get(args.userId);
                await ctx.db.insert('Notifications', {
                    userId: story.userId,
                    type: 'like',
                    storyId: args.storyId,
                    actorId: args.userId,
                    actorName: liker?.name || 'Someone',
                    actorImage: liker?.imageUrl || '',
                    storyTitle: story.title,
                    isRead: false,
                    createdAt: Date.now(),
                });
            }
        }
    },
});

// Add comment to a story
export const addComment = mutation({
    args: {
        storyId: v.id('CommunityStories'),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        comment: v.string(),
    },
    handler: async (ctx, args) => {
        const commentId = await ctx.db.insert('StoryComments', {
            storyId: args.storyId,
            userId: args.userId,
            userName: args.userName,
            userImage: args.userImage,
            comment: args.comment,
            createdAt: Date.now(),
        });

        // Create notification for story owner (only if not commenting on own story)
        const story = await ctx.db.get(args.storyId);
        if (story && story.userId !== args.userId) {
            await ctx.db.insert('Notifications', {
                userId: story.userId,
                type: 'comment',
                storyId: args.storyId,
                actorId: args.userId,
                actorName: args.userName,
                actorImage: args.userImage,
                storyTitle: story.title,
                commentText: args.comment,
                isRead: false,
                createdAt: Date.now(),
            });
        }

        return commentId;
    },
});

// Get comments for a story
export const getCommentsByStoryId = query({
    args: { storyId: v.id('CommunityStories') },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query('StoryComments')
            .filter((q) => q.eq(q.field('storyId'), args.storyId))
            .order('desc')
            .collect();
        return comments;
    },
});

// Get comment count for a story
export const getCommentCount = query({
    args: { storyId: v.id('CommunityStories') },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query('StoryComments')
            .filter((q) => q.eq(q.field('storyId'), args.storyId))
            .collect();
        return comments.length;
    },
});

// Delete comment
export const deleteComment = mutation({
    args: { commentId: v.id('StoryComments') },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.commentId);
    },
});
