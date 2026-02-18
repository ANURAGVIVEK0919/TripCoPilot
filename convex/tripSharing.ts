import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Generate unique share ID
function generateShareId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Enable sharing for a trip
export const enableSharing = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        isPublic: v.boolean(),
        allowCloning: v.boolean(),
    },
    handler: async (ctx, args) => {
        // Find the trip
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('tripId'), args.tripId),
                q.eq(q.field('uid'), args.userId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        // Generate share ID if not exists
        const shareId = trip.shareId || generateShareId();

        // Update trip with sharing settings
        await ctx.db.patch(trip._id, {
            shareId,
            isPublic: args.isPublic,
            allowCloning: args.allowCloning,
        });

        return { shareId, success: true };
    }
});

// Disable sharing
export const disableSharing = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('tripId'), args.tripId),
                q.eq(q.field('uid'), args.userId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        await ctx.db.patch(trip._id, {
            shareId: undefined,
            isPublic: false,
            allowCloning: false,
        });

        // Remove all collaborators except owner
        const collaborators = await ctx.db
            .query('TripCollaborators')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .collect();

        for (const collab of collaborators) {
            if (collab.userId !== args.userId) {
                await ctx.db.delete(collab._id);
            }
        }

        return { success: true };
    }
});

// Get trip by share ID (for public access)
export const getTripByShareId = query({
    args: {
        shareId: v.string(),
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('shareId'), args.shareId))
            .first();

        if (!trip) {
            return null;
        }

        // Get owner info
        const owner = await ctx.db.get(trip.uid);

        return {
            ...trip,
            owner: {
                name: owner?.name,
                imageUrl: owner?.imageUrl,
            }
        };
    }
});

// Add collaborator
export const addCollaborator = mutation({
    args: {
        tripId: v.string(),
        userEmail: v.string(),
        role: v.union(v.literal('editor'), v.literal('viewer')),
        invitedBy: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Check if inviter is owner or has permission
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('tripId'), args.tripId))
            .first();

        if (!trip) {
            throw new Error('Trip not found');
        }

        // Check if inviter is owner
        if (trip.uid !== args.invitedBy) {
            throw new Error('Only owner can invite collaborators');
        }

        // Find user by email
        const user = await ctx.db
            .query('UserTable')
            .filter(q => q.eq(q.field('email'), args.userEmail))
            .first();

        if (!user) {
            throw new Error('User not found. They need to sign up first.');
        }

        // Check if already collaborator
        const existing = await ctx.db
            .query('TripCollaborators')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .filter(q => q.eq(q.field('userId'), user._id))
            .first();

        if (existing) {
            throw new Error('User is already a collaborator');
        }

        // Add collaborator
        await ctx.db.insert('TripCollaborators', {
            tripId: args.tripId,
            userId: user._id,
            userName: user.name,
            userEmail: user.email,
            userImage: user.imageUrl,
            role: args.role,
            invitedBy: args.invitedBy,
            invitedAt: Date.now(),
        });

        // Log activity
        const inviter = await ctx.db.get(args.invitedBy);
        await ctx.db.insert('TripActivity', {
            tripId: args.tripId,
            userId: args.invitedBy,
            userName: inviter?.name || 'Unknown',
            userImage: inviter?.imageUrl || '',
            action: 'added_collaborator',
            details: `Invited ${user.name} as ${args.role}`,
            timestamp: Date.now(),
        });

        return { success: true, collaborator: user };
    }
});

// Remove collaborator
export const removeCollaborator = mutation({
    args: {
        tripId: v.string(),
        collaboratorId: v.id('TripCollaborators'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Check if user is owner
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('tripId'), args.tripId))
            .first();

        if (!trip || trip.uid !== args.userId) {
            throw new Error('Only owner can remove collaborators');
        }

        const collaborator = await ctx.db.get(args.collaboratorId);
        if (!collaborator) {
            throw new Error('Collaborator not found');
        }

        await ctx.db.delete(args.collaboratorId);

        // Log activity
        const user = await ctx.db.get(args.userId);
        await ctx.db.insert('TripActivity', {
            tripId: args.tripId,
            userId: args.userId,
            userName: user?.name || 'Unknown',
            userImage: user?.imageUrl || '',
            action: 'removed_collaborator',
            details: `Removed ${collaborator.userName}`,
            timestamp: Date.now(),
        });

        return { success: true };
    }
});

// Update collaborator role
export const updateCollaboratorRole = mutation({
    args: {
        collaboratorId: v.id('TripCollaborators'),
        newRole: v.union(v.literal('editor'), v.literal('viewer')),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const collaborator = await ctx.db.get(args.collaboratorId);
        if (!collaborator) {
            throw new Error('Collaborator not found');
        }

        // Check if user is owner
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('tripId'), collaborator.tripId))
            .first();

        if (!trip || trip.uid !== args.userId) {
            throw new Error('Only owner can update roles');
        }

        await ctx.db.patch(args.collaboratorId, {
            role: args.newRole,
        });

        return { success: true };
    }
});

// Get all collaborators for a trip
export const getCollaborators = query({
    args: {
        tripId: v.string(),
    },
    handler: async (ctx, args) => {
        const collaborators = await ctx.db
            .query('TripCollaborators')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .collect();

        // Also get owner
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('tripId'), args.tripId))
            .first();

        if (!trip) return [];

        const owner = await ctx.db.get(trip.uid);

        return [
            {
                _id: 'owner' as Id<'TripCollaborators'>,
                tripId: args.tripId,
                userId: trip.uid,
                userName: owner?.name || 'Unknown',
                userEmail: owner?.email || '',
                userImage: owner?.imageUrl || '',
                role: 'owner' as const,
                invitedBy: trip.uid,
                invitedAt: 0,
            },
            ...collaborators,
        ];
    }
});

// Check user permission for a trip
export const getUserPermission = query({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Check if owner
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('tripId'), args.tripId))
            .first();

        if (!trip) return null;

        if (trip.uid === args.userId) {
            return { role: 'owner', canEdit: true, canDelete: true, canInvite: true };
        }

        // Check if collaborator
        const collaborator = await ctx.db
            .query('TripCollaborators')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .filter(q => q.eq(q.field('userId'), args.userId))
            .first();

        if (collaborator) {
            return {
                role: collaborator.role,
                canEdit: collaborator.role === 'editor',
                canDelete: false,
                canInvite: false,
            };
        }

        // Check if public
        if (trip.isPublic) {
            return { role: 'viewer', canEdit: false, canDelete: false, canInvite: false };
        }

        return null; // No access
    }
});

// Clone a trip
export const cloneTrip = mutation({
    args: {
        shareId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        // Find original trip
        const originalTrip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('shareId'), args.shareId))
            .first();

        if (!originalTrip) {
            throw new Error('Trip not found');
        }

        if (!originalTrip.allowCloning) {
            throw new Error('Cloning is not allowed for this trip');
        }

        // Generate new trip ID
        const newTripId = Math.random().toString(36).substring(2, 15);

        // Create cloned trip
        const clonedTripId = await ctx.db.insert('TripDetailTable', {
            tripId: newTripId,
            tripDetail: originalTrip.tripDetail,
            uid: args.userId,
            originalTripId: originalTrip.tripId,
            isPublic: false,
            allowCloning: false,
        });

        // Increment clone count
        await ctx.db.patch(originalTrip._id, {
            cloneCount: (originalTrip.cloneCount || 0) + 1,
        });

        // Log activity on original trip
        const user = await ctx.db.get(args.userId);
        await ctx.db.insert('TripActivity', {
            tripId: originalTrip.tripId,
            userId: args.userId,
            userName: user?.name || 'Someone',
            userImage: user?.imageUrl || '',
            action: 'cloned_trip',
            details: `Cloned this trip`,
            timestamp: Date.now(),
        });

        return { success: true, newTripId };
    }
});

// Get trip activity log
export const getTripActivity = query({
    args: {
        tripId: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const activities = await ctx.db
            .query('TripActivity')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .order('desc')
            .take(args.limit || 50);

        return activities;
    }
});

// Add comment to trip
export const addTripComment = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        comment: v.string(),
        parentId: v.optional(v.id('TripComments')),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            throw new Error('User not found');
        }

        const commentId = await ctx.db.insert('TripComments', {
            tripId: args.tripId,
            userId: args.userId,
            userName: user.name,
            userImage: user.imageUrl,
            comment: args.comment,
            parentId: args.parentId,
            createdAt: Date.now(),
        });

        // Log activity
        await ctx.db.insert('TripActivity', {
            tripId: args.tripId,
            userId: args.userId,
            userName: user.name,
            userImage: user.imageUrl,
            action: 'commented',
            details: args.comment.substring(0, 100),
            timestamp: Date.now(),
        });

        return { success: true, commentId };
    }
});

// Get trip comments
export const getTripComments = query({
    args: {
        tripId: v.string(),
    },
    handler: async (ctx, args) => {
        const comments = await ctx.db
            .query('TripComments')
            .withIndex('by_trip', q => q.eq('tripId', args.tripId))
            .order('desc')
            .collect();

        return comments;
    }
});

// Delete trip comment
export const deleteTripComment = mutation({
    args: {
        commentId: v.id('TripComments'),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const comment = await ctx.db.get(args.commentId);
        if (!comment) {
            throw new Error('Comment not found');
        }

        // Check if user owns the comment or is trip owner
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter(q => q.eq(q.field('tripId'), comment.tripId))
            .first();

        if (comment.userId !== args.userId && trip?.uid !== args.userId) {
            throw new Error('Unauthorized');
        }

        await ctx.db.delete(args.commentId);
        return { success: true };
    }
});
