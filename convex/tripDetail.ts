import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const CreateTripDetail = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        tripDetail: v.any()
    },
    handler: async (ctx, args) => {
        const result = await ctx.db.insert('TripDetailTable', {
            tripDetail: args.tripDetail,
            tripId: args.tripId,
            uid: args.uid
        });

    }
})

export const GetUserTrips = query({
    args: {
        uid: v.id('UserTable')
    },
    handler: async (ctx, args) => {
        // Get trips owned by user
        const ownedTrips = await ctx.db.query('TripDetailTable')
            .filter(q => q.eq(q.field('uid'), args.uid))
            .order('desc')
            .collect();

        // Get trips where user is a collaborator
        const collaborations = await ctx.db.query('TripCollaborators')
            .withIndex('by_user', q => q.eq('userId', args.uid))
            .collect();

        const sharedTripIds = collaborations.map(c => c.tripId);
        const sharedTrips = [];

        for (const tripId of sharedTripIds) {
            const trip = await ctx.db.query('TripDetailTable')
                .filter(q => q.eq(q.field('tripId'), tripId))
                .first();
            if (trip) {
                sharedTrips.push(trip);
            }
        }

        // Combine and mark shared trips
        const allTrips = [
            ...ownedTrips.map(t => ({ ...t, isSharedWithMe: false })),
            ...sharedTrips.map(t => ({ ...t, isSharedWithMe: true }))
        ];

        return allTrips;
    }
})

export const GetTripById = query({
    args: {
        uid: v.id('UserTable'),
        tripid: v.string()
    },
    handler: async (ctx, args) => {
        // First try to find as owner
        const ownedTrip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args?.tripid)
            ))
            .first();

        if (ownedTrip) {
            return ownedTrip;
        }

        // Check if user is a collaborator
        const collaboration = await ctx.db.query('TripCollaborators')
            .withIndex('by_user', q => q.eq('userId', args.uid))
            .filter(q => q.eq(q.field('tripId'), args.tripid))
            .first();

        if (collaboration) {
            const sharedTrip = await ctx.db.query('TripDetailTable')
                .filter(q => q.eq(q.field('tripId'), args.tripid))
                .first();
            return sharedTrip;
        }

        return null;
    }
})

export const DeleteTrip = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable')
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args.tripId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        await ctx.db.delete(trip._id);
        return { success: true };
    }
})

/**
 * Update a specific activity in the itinerary
 */
export const updateItineraryActivity = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        dayIndex: v.number(),
        activityIndex: v.number(),
        updatedActivity: v.any()
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args.tripId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        // Clone trip detail
        const tripDetail = JSON.parse(JSON.stringify(trip.tripDetail));
        
        // Update specific activity
        if (tripDetail.itinerary && 
            tripDetail.itinerary[args.dayIndex] && 
            tripDetail.itinerary[args.dayIndex].activities &&
            tripDetail.itinerary[args.dayIndex].activities[args.activityIndex]) {
            
            tripDetail.itinerary[args.dayIndex].activities[args.activityIndex] = args.updatedActivity;
            
            // Update in database
            await ctx.db.patch(trip._id, {
                tripDetail: tripDetail
            });
            
            return { success: true, tripDetail };
        }
        
        throw new Error('Activity not found at specified indices');
    }
})

/**
 * Add a new activity to a specific day
 */
export const addItineraryActivity = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        dayIndex: v.number(),
        newActivity: v.any()
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args.tripId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        const tripDetail = JSON.parse(JSON.stringify(trip.tripDetail));
        
        if (tripDetail.itinerary && tripDetail.itinerary[args.dayIndex]) {
            if (!tripDetail.itinerary[args.dayIndex].activities) {
                tripDetail.itinerary[args.dayIndex].activities = [];
            }
            
            tripDetail.itinerary[args.dayIndex].activities.push(args.newActivity);
            
            await ctx.db.patch(trip._id, {
                tripDetail: tripDetail
            });
            
            return { success: true, tripDetail };
        }
        
        throw new Error('Day not found at specified index');
    }
})

/**
 * Delete an activity from a specific day
 */
export const deleteItineraryActivity = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        dayIndex: v.number(),
        activityIndex: v.number()
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args.tripId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        const tripDetail = JSON.parse(JSON.stringify(trip.tripDetail));
        
        if (tripDetail.itinerary && 
            tripDetail.itinerary[args.dayIndex] && 
            tripDetail.itinerary[args.dayIndex].activities &&
            tripDetail.itinerary[args.dayIndex].activities[args.activityIndex]) {
            
            tripDetail.itinerary[args.dayIndex].activities.splice(args.activityIndex, 1);
            
            await ctx.db.patch(trip._id, {
                tripDetail: tripDetail
            });
            
            return { success: true, tripDetail };
        }
        
        throw new Error('Activity not found at specified indices');
    }
})

/**
 * Reorder activities within a day (drag and drop)
 */
export const reorderItineraryActivities = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        dayIndex: v.number(),
        oldIndex: v.number(),
        newIndex: v.number()
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args.tripId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        const tripDetail = JSON.parse(JSON.stringify(trip.tripDetail));
        
        if (tripDetail.itinerary && 
            tripDetail.itinerary[args.dayIndex] && 
            tripDetail.itinerary[args.dayIndex].activities) {
            
            const activities = tripDetail.itinerary[args.dayIndex].activities;
            const [movedActivity] = activities.splice(args.oldIndex, 1);
            activities.splice(args.newIndex, 0, movedActivity);
            
            await ctx.db.patch(trip._id, {
                tripDetail: tripDetail
            });
            
            return { success: true, tripDetail };
        }
        
        throw new Error('Day not found at specified index');
    }
})

/**
 * Update day plan description
 */
export const updateDayPlan = mutation({
    args: {
        tripId: v.string(),
        uid: v.id('UserTable'),
        dayIndex: v.number(),
        dayPlan: v.string()
    },
    handler: async (ctx, args) => {
        const trip = await ctx.db.query('TripDetailTable')
            .filter(q => q.and(
                q.eq(q.field('uid'), args.uid),
                q.eq(q.field('tripId'), args.tripId)
            ))
            .first();

        if (!trip) {
            throw new Error('Trip not found or unauthorized');
        }

        const tripDetail = JSON.parse(JSON.stringify(trip.tripDetail));
        
        if (tripDetail.itinerary && tripDetail.itinerary[args.dayIndex]) {
            tripDetail.itinerary[args.dayIndex].day_plan = args.dayPlan;
            
            await ctx.db.patch(trip._id, {
                tripDetail: tripDetail
            });
            
            return { success: true, tripDetail };
        }
        
        throw new Error('Day not found at specified index');
    }
})

// Get Trip Statistics for Homepage
export const getTripStatistics = query({
    args: {},
    handler: async (ctx) => {
        // Get all trips
        const allTrips = await ctx.db.query('TripDetailTable').collect();
        
        // Get unique users (active travelers)
        const uniqueUserIds = new Set(allTrips.map(trip => trip.uid));
        const activeUsers = uniqueUserIds.size;
        
        // Extract unique destinations and countries
        const destinations = new Set<string>();
        const countries = new Set<string>();
        
        allTrips.forEach(trip => {
            const tripDetail = trip.tripDetail;
            if (tripDetail?.destination) {
                destinations.add(tripDetail.destination);
                
                // Extract country from destination (assumes format: "City, Country" or just "Country")
                const parts = tripDetail.destination.split(',');
                const country = parts.length > 1 ? parts[parts.length - 1].trim() : parts[0].trim();
                countries.add(country);
            }
        });
        
        return {
            totalTrips: allTrips.length,
            uniqueDestinations: destinations.size,
            activeUsers: activeUsers,
            countriesCount: countries.size,
        };
    }
})