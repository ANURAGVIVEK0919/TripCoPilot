import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

/**
 * Get bookings for AI itinerary generation (formatted for prompt)
 */
export const getBookingsForItineraryGeneration = query({
    args: {
        tripId: v.string(),
    },
    handler: async (ctx, args) => {
        const bookings = await ctx.db.query('CustomBookings')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .order('asc')
            .collect();

        if (bookings.length === 0) {
            return null;
        }

        // Format bookings for AI prompt
        return bookings.map(b => ({
            type: b.bookingType,
            title: b.title,
            date: new Date(b.date).toLocaleString(),
            dateTimestamp: b.date,
            endDate: b.endDate ? new Date(b.endDate).toLocaleString() : undefined,
            location: b.location || b.toLocation || 'Not specified',
            fromLocation: b.fromLocation,
            toLocation: b.toLocation,
            description: b.description,
            confirmationNumber: b.confirmationNumber,
            // Flight details
            flightNumber: b.flightNumber,
            airline: b.airline,
            departureAirport: b.departureAirport,
            arrivalAirport: b.arrivalAirport,
            // Hotel details
            checkInTime: b.checkInTime,
            checkOutTime: b.checkOutTime,
            roomType: b.roomType,
            // Restaurant details
            reservationTime: b.reservationTime,
            partySize: b.partySize,
            specialRequests: b.specialRequests,
            // General
            allDay: b.allDay
        }));
    }
});

/**
 * Create a custom booking (flight, hotel, restaurant, etc.)
 */
export const createCustomBooking = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        bookingType: v.union(
            v.literal('flight'),
            v.literal('hotel'),
            v.literal('restaurant'),
            v.literal('tour'),
            v.literal('transportation'),
            v.literal('event'),
            v.literal('other')
        ),
        title: v.string(),
        description: v.optional(v.string()),
        date: v.number(),
        endDate: v.optional(v.number()),
        allDay: v.optional(v.boolean()),
        
        // Location fields
        location: v.optional(v.string()),
        fromLocation: v.optional(v.string()),
        toLocation: v.optional(v.string()),
        
        // Booking details
        confirmationNumber: v.optional(v.string()),
        bookingReference: v.optional(v.string()),
        providerName: v.optional(v.string()),
        
        // Contact
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        attachments: v.optional(v.array(v.string())),
        
        // Flight-specific
        flightNumber: v.optional(v.string()),
        airline: v.optional(v.string()),
        departureAirport: v.optional(v.string()),
        arrivalAirport: v.optional(v.string()),
        terminal: v.optional(v.string()),
        gate: v.optional(v.string()),
        seatNumber: v.optional(v.string()),
        
        // Hotel-specific
        checkInTime: v.optional(v.string()),
        checkOutTime: v.optional(v.string()),
        roomType: v.optional(v.string()),
        roomNumber: v.optional(v.string()),
        
        // Restaurant-specific
        reservationTime: v.optional(v.string()),
        partySize: v.optional(v.number()),
        specialRequests: v.optional(v.string()),
        
        // Financial
        totalCost: v.optional(v.number()),
        currency: v.optional(v.string()),
        isPaid: v.optional(v.boolean()),
        
        // Reminders
        reminderTimes: v.optional(v.array(v.number())),
        sendReminders: v.optional(v.boolean()),
        
        // Notes
        notes: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const bookingId = await ctx.db.insert('CustomBookings', {
            ...args,
            sendReminders: args.sendReminders ?? true, // Default: enable reminders
            isCancelled: false,
            isCompleted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Automatically create an expense if the booking has a cost
        if (args.totalCost && args.totalCost > 0) {
            // Get user details for the expense
            const user = await ctx.db.get(args.userId);
            if (!user) throw new Error("User not found");

            const categoryMap: { [key: string]: 'accommodation' | 'food' | 'transport' | 'activities' | 'shopping' | 'other' } = {
                'flight': 'transport',
                'hotel': 'accommodation',
                'restaurant': 'food',
                'tour': 'activities',
                'transportation': 'transport',
                'event': 'activities',
                'other': 'other'
            };

            await ctx.db.insert('TripExpenses', {
                tripId: args.tripId,
                userId: args.userId,
                userName: user.name,
                userImage: user.imageUrl,
                amount: args.totalCost,
                currency: args.currency || 'USD',
                category: categoryMap[args.bookingType] || 'other',
                description: args.title,
                date: args.date,
                location: args.location,
                paidBy: args.userId,  // The person who created the booking is the one who paid
                splitType: 'none',  // Default to not split (personal expense)
                participants: [args.userId],  // Only the creator initially
                isSettled: true,  // Personal expenses are auto-settled
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return bookingId;
    },
});

/**
 * Get all custom bookings for a trip
 */
export const getTripBookings = query({
    args: {
        tripId: v.string(),
    },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query('CustomBookings')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .filter((q) => q.eq(q.field('isCancelled'), false))
            .order('asc')
            .collect();

        return bookings.sort((a, b) => a.date - b.date);
    },
});

/**
 * Get custom bookings by type for a trip
 */
export const getTripBookingsByType = query({
    args: {
        tripId: v.string(),
        bookingType: v.union(
            v.literal('flight'),
            v.literal('hotel'),
            v.literal('restaurant'),
            v.literal('tour'),
            v.literal('transportation'),
            v.literal('event'),
            v.literal('other')
        ),
    },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query('CustomBookings')
            .withIndex('by_trip_type', (q) => 
                q.eq('tripId', args.tripId).eq('bookingType', args.bookingType)
            )
            .filter((q) => q.eq(q.field('isCancelled'), false))
            .order('asc')
            .collect();

        return bookings.sort((a, b) => a.date - b.date);
    },
});

/**
 * Get all user bookings (across all trips)
 */
export const getUserBookings = query({
    args: {
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query('CustomBookings')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .filter((q) => q.eq(q.field('isCancelled'), false))
            .order('asc')
            .collect();

        return bookings.sort((a, b) => a.date - b.date);
    },
});

/**
 * Get upcoming bookings (for activity reminders)
 */
export const getUpcomingBookings = query({
    args: {
        tripId: v.string(),
        startTime: v.number(),
        endTime: v.number(),
    },
    handler: async (ctx, args) => {
        const bookings = await ctx.db
            .query('CustomBookings')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .filter((q) => 
                q.and(
                    q.gte(q.field('date'), args.startTime),
                    q.lte(q.field('date'), args.endTime),
                    q.eq(q.field('isCancelled'), false),
                    q.eq(q.field('isCompleted'), false)
                )
            )
            .collect();

        return bookings;
    },
});

/**
 * Update a custom booking
 */
export const updateCustomBooking = mutation({
    args: {
        bookingId: v.id('CustomBookings'),
        title: v.optional(v.string()),
        description: v.optional(v.string()),
        date: v.optional(v.number()),
        endDate: v.optional(v.number()),
        allDay: v.optional(v.boolean()),
        location: v.optional(v.string()),
        fromLocation: v.optional(v.string()),
        toLocation: v.optional(v.string()),
        confirmationNumber: v.optional(v.string()),
        bookingReference: v.optional(v.string()),
        providerName: v.optional(v.string()),
        phone: v.optional(v.string()),
        email: v.optional(v.string()),
        website: v.optional(v.string()),
        attachments: v.optional(v.array(v.string())),
        flightNumber: v.optional(v.string()),
        airline: v.optional(v.string()),
        departureAirport: v.optional(v.string()),
        arrivalAirport: v.optional(v.string()),
        terminal: v.optional(v.string()),
        gate: v.optional(v.string()),
        seatNumber: v.optional(v.string()),
        checkInTime: v.optional(v.string()),
        checkOutTime: v.optional(v.string()),
        roomType: v.optional(v.string()),
        roomNumber: v.optional(v.string()),
        reservationTime: v.optional(v.string()),
        partySize: v.optional(v.number()),
        specialRequests: v.optional(v.string()),
        totalCost: v.optional(v.number()),
        currency: v.optional(v.string()),
        isPaid: v.optional(v.boolean()),
        reminderTimes: v.optional(v.array(v.number())),
        sendReminders: v.optional(v.boolean()),
        notes: v.optional(v.string()),
        isCancelled: v.optional(v.boolean()),
        isCompleted: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const { bookingId, ...updates } = args;

        await ctx.db.patch(bookingId, {
            ...updates,
            updatedAt: Date.now(),
        });

        return bookingId;
    },
});

/**
 * Delete a custom booking
 */
export const deleteCustomBooking = mutation({
    args: {
        bookingId: v.id('CustomBookings'),
    },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.bookingId);
        return { success: true };
    },
});

/**
 * Cancel a booking (soft delete)
 */
export const cancelBooking = mutation({
    args: {
        bookingId: v.id('CustomBookings'),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bookingId, {
            isCancelled: true,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Mark booking as completed
 */
export const completeBooking = mutation({
    args: {
        bookingId: v.id('CustomBookings'),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bookingId, {
            isCompleted: true,
            updatedAt: Date.now(),
        });

        return { success: true };
    },
});

/**
 * Quick add flight booking
 */
export const quickAddFlight = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        flightNumber: v.string(),
        airline: v.string(),
        departureDate: v.number(),
        departureAirport: v.string(),
        arrivalAirport: v.string(),
        confirmationNumber: v.optional(v.string()),
        totalCost: v.optional(v.number()),
        currency: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const bookingId = await ctx.db.insert('CustomBookings', {
            tripId: args.tripId,
            userId: args.userId,
            bookingType: 'flight',
            title: `Flight ${args.flightNumber} to ${args.arrivalAirport}`,
            date: args.departureDate,
            flightNumber: args.flightNumber,
            airline: args.airline,
            departureAirport: args.departureAirport,
            arrivalAirport: args.arrivalAirport,
            fromLocation: args.departureAirport,
            toLocation: args.arrivalAirport,
            confirmationNumber: args.confirmationNumber,
            totalCost: args.totalCost,
            currency: args.currency,
            sendReminders: true,
            reminderTimes: [24, 3], // 24 hours and 3 hours before
            isCancelled: false,
            isCompleted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Automatically create an expense if cost is provided
        if (args.totalCost && args.totalCost > 0) {
            const user = await ctx.db.get(args.userId);
            if (!user) throw new Error("User not found");

            await ctx.db.insert('TripExpenses', {
                tripId: args.tripId,
                userId: args.userId,
                userName: user.name,
                userImage: user.imageUrl,
                amount: args.totalCost,
                currency: args.currency || 'USD',
                category: 'transport',
                description: `Flight ${args.flightNumber} to ${args.arrivalAirport}`,
                date: args.departureDate,
                location: `${args.departureAirport} → ${args.arrivalAirport}`,
                paidBy: args.userId,  // The person who created the booking is the one who paid
                splitType: 'none',  // Default to not split (personal expense)
                participants: [args.userId],
                isSettled: true,  // Personal expenses are auto-settled
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return bookingId;
    },
});

/**
 * Quick add hotel booking
 */
export const quickAddHotel = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        hotelName: v.string(),
        location: v.string(),
        checkInDate: v.number(),
        checkOutDate: v.number(),
        checkInTime: v.optional(v.string()),
        checkOutTime: v.optional(v.string()),
        confirmationNumber: v.optional(v.string()),
        totalCost: v.optional(v.number()),
        currency: v.optional(v.string()),
        phone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const bookingId = await ctx.db.insert('CustomBookings', {
            tripId: args.tripId,
            userId: args.userId,
            bookingType: 'hotel',
            title: `Hotel: ${args.hotelName}`,
            description: `Check-in: ${new Date(args.checkInDate).toLocaleDateString()}`,
            date: args.checkInDate,
            endDate: args.checkOutDate,
            location: args.location,
            providerName: args.hotelName,
            checkInTime: args.checkInTime || '15:00',
            checkOutTime: args.checkOutTime || '11:00',
            confirmationNumber: args.confirmationNumber,
            phone: args.phone,
            totalCost: args.totalCost,
            currency: args.currency,
            sendReminders: true,
            reminderTimes: [24], // 1 day before check-in
            isCancelled: false,
            isCompleted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        // Automatically create an expense if cost is provided
        if (args.totalCost && args.totalCost > 0) {
            const user = await ctx.db.get(args.userId);
            if (!user) throw new Error("User not found");

            await ctx.db.insert('TripExpenses', {
                tripId: args.tripId,
                userId: args.userId,
                userName: user.name,
                userImage: user.imageUrl,
                amount: args.totalCost,
                currency: args.currency || 'USD',
                category: 'accommodation',
                description: `Hotel: ${args.hotelName}`,
                date: args.checkInDate,
                location: args.location,
                paidBy: args.userId,  // The person who created the booking is the one who paid
                splitType: 'none',  // Default to not split (personal expense)
                participants: [args.userId],
                isSettled: true,  // Personal expenses are auto-settled
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }

        return bookingId;
    },
});

/**
 * Quick add restaurant reservation
 */
export const quickAddRestaurant = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        restaurantName: v.string(),
        location: v.string(),
        reservationDate: v.number(),
        reservationTime: v.string(),
        partySize: v.number(),
        confirmationNumber: v.optional(v.string()),
        phone: v.optional(v.string()),
        specialRequests: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const bookingId = await ctx.db.insert('CustomBookings', {
            tripId: args.tripId,
            userId: args.userId,
            bookingType: 'restaurant',
            title: `Dinner at ${args.restaurantName}`,
            date: args.reservationDate,
            location: args.location,
            providerName: args.restaurantName,
            reservationTime: args.reservationTime,
            partySize: args.partySize,
            confirmationNumber: args.confirmationNumber,
            phone: args.phone,
            specialRequests: args.specialRequests,
            sendReminders: true,
            reminderTimes: [24, 2], // 1 day before and 2 hours before
            isCancelled: false,
            isCompleted: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return bookingId;
    },
});
