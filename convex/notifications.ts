import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Notification system for community interactions
// Get notifications for a user
export const getUserNotifications = query({
    args: {
        userId: v.id('UserTable'),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query('Notifications')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .order('desc')
            .take(args.limit || 50);
        
        return notifications;
    },
});

// Get unread notification count
export const getUnreadCount = query({
    args: {
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const unreadNotifications = await ctx.db
            .query('Notifications')
            .withIndex('by_user_unread', (q) => 
                q.eq('userId', args.userId).eq('isRead', false)
            )
            .collect();
        
        return unreadNotifications.length;
    },
});

// Mark notification as read
export const markAsRead = mutation({
    args: {
        notificationId: v.id('Notifications'),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, {
            isRead: true,
        });
    },
});

// Mark all notifications as read
export const markAllAsRead = mutation({
    args: {
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const unreadNotifications = await ctx.db
            .query('Notifications')
            .withIndex('by_user_unread', (q) => 
                q.eq('userId', args.userId).eq('isRead', false)
            )
            .collect();
        
        for (const notification of unreadNotifications) {
            await ctx.db.patch(notification._id, {
                isRead: true,
            });
        }
    },
});

// Delete notification
export const deleteNotification = mutation({
    args: {
        notificationId: v.id('Notifications'),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.notificationId);
    },
});

// Delete all read notifications
export const deleteAllRead = mutation({
    args: {
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const readNotifications = await ctx.db
            .query('Notifications')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .filter((q) => q.eq(q.field('isRead'), true))
            .collect();
        
        for (const notification of readNotifications) {
            await ctx.db.delete(notification._id);
        }
    },
});
