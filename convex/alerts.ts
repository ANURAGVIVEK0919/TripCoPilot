import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============ ALERT MANAGEMENT ============

/**
 * Get all alerts for a user
 */
export const getUserAlerts = query({
    args: {
        userId: v.id('UserTable'),
        includeRead: v.optional(v.boolean()),
        includeDismissed: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        let alerts = await ctx.db
            .query('TravelAlerts')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .order('desc')
            .collect();

        // Filter based on options
        if (!args.includeRead) {
            alerts = alerts.filter(a => !a.isRead);
        }
        
        if (!args.includeDismissed) {
            alerts = alerts.filter(a => !a.isDismissed);
        }

        // Filter out snoozed alerts (if snoozedUntil is in the future)
        const now = Date.now();
        alerts = alerts.filter(a => 
            !a.isSnoozed || !a.snoozedUntil || a.snoozedUntil <= now
        );

        // Filter out expired alerts
        alerts = alerts.filter(a => 
            !a.expiresAt || a.expiresAt > now
        );

        return alerts;
    },
});

/**
 * Get alerts for a specific trip
 */
export const getTripAlerts = query({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        const alerts = await ctx.db
            .query('TravelAlerts')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .filter((q) => q.eq(q.field('userId'), args.userId))
            .order('desc')
            .collect();

        const now = Date.now();
        
        return alerts.filter(a => 
            !a.isDismissed && 
            (!a.isSnoozed || !a.snoozedUntil || a.snoozedUntil <= now) &&
            (!a.expiresAt || a.expiresAt > now)
        );
    },
});

/**
 * Mark alert as read
 */
export const markAlertRead = mutation({
    args: {
        alertId: v.id('TravelAlerts'),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.alertId, {
            isRead: true,
        });
    },
});

/**
 * Dismiss alert
 */
export const dismissAlert = mutation({
    args: {
        alertId: v.id('TravelAlerts'),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.alertId, {
            isDismissed: true,
        });
    },
});

/**
 * Snooze alert
 */
export const snoozeAlert = mutation({
    args: {
        alertId: v.id('TravelAlerts'),
        snoozeHours: v.number(), // Hours to snooze
    },
    handler: async (ctx, args) => {
        const snoozedUntil = Date.now() + (args.snoozeHours * 60 * 60 * 1000);
        
        await ctx.db.patch(args.alertId, {
            isSnoozed: true,
            snoozedUntil,
        });
    },
});

/**
 * Create a new alert (internal mutation)
 */
export const createAlert = internalMutation({
    args: {
        userId: v.id('UserTable'),
        tripId: v.string(),
        type: v.union(
            v.literal('weather'),
            v.literal('packing'),
            v.literal('budget'),
            v.literal('document'),
            v.literal('activity'),
            v.literal('general')
        ),
        severity: v.union(
            v.literal('info'),
            v.literal('warning'),
            v.literal('critical')
        ),
        title: v.string(),
        message: v.string(),
        actionRequired: v.optional(v.string()),
        metadata: v.optional(v.any()),
        expiresAt: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const alertId = await ctx.db.insert('TravelAlerts', {
            userId: args.userId,
            tripId: args.tripId,
            type: args.type,
            severity: args.severity,
            title: args.title,
            message: args.message,
            actionRequired: args.actionRequired,
            metadata: args.metadata,
            isRead: false,
            isDismissed: false,
            isSnoozed: false,
            createdAt: Date.now(),
            expiresAt: args.expiresAt,
        });

        return alertId;
    },
});

// ============ ALERT PREFERENCES ============

/**
 * Get user's alert preferences (public query)
 */
export const getAlertPreferences = query({
    args: {
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        let prefs = await ctx.db
            .query('AlertPreferences')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .first();

        if (!prefs) {
            // Return defaults
            return {
                weatherAlerts: true,
                packingReminders: true,
                budgetAlerts: true,
                documentWarnings: true,
                activityReminders: true,
                emailNotifications: false,
                pushNotifications: true,
                packingReminderDays: [7, 3, 1],
                budgetThresholds: [80, 90, 100],
                weatherCheckDays: 7,
            };
        }

        return prefs;
    },
});

/**
 * Get user's alert preferences (internal query for actions)
 */
export const getAlertPreferencesInternal = internalQuery({
    args: {
        userId: v.id('UserTable'),
    },
    handler: async (ctx, args) => {
        let prefs = await ctx.db
            .query('AlertPreferences')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .first();

        if (!prefs) {
            // Return defaults
            return {
                weatherAlerts: true,
                packingReminders: true,
                budgetAlerts: true,
                documentWarnings: true,
                activityReminders: true,
                emailNotifications: false,
                pushNotifications: true,
                packingReminderDays: [7, 3, 1],
                budgetThresholds: [80, 90, 100],
                weatherCheckDays: 7,
            };
        }

        return prefs;
    },
});

/**
 * Update alert preferences
 */
export const updateAlertPreferences = mutation({
    args: {
        userId: v.id('UserTable'),
        weatherAlerts: v.optional(v.boolean()),
        packingReminders: v.optional(v.boolean()),
        budgetAlerts: v.optional(v.boolean()),
        documentWarnings: v.optional(v.boolean()),
        activityReminders: v.optional(v.boolean()),
        emailNotifications: v.optional(v.boolean()),
        pushNotifications: v.optional(v.boolean()),
        packingReminderDays: v.optional(v.array(v.number())),
        budgetThresholds: v.optional(v.array(v.number())),
        weatherCheckDays: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const { userId, ...updates } = args;
        
        const existing = await ctx.db
            .query('AlertPreferences')
            .withIndex('by_user', (q) => q.eq('userId', userId))
            .first();

        if (existing) {
            await ctx.db.patch(existing._id, {
                ...updates,
                updatedAt: Date.now(),
            });
            return existing._id;
        } else {
            return await ctx.db.insert('AlertPreferences', {
                userId,
                weatherAlerts: updates.weatherAlerts ?? true,
                packingReminders: updates.packingReminders ?? true,
                budgetAlerts: updates.budgetAlerts ?? true,
                documentWarnings: updates.documentWarnings ?? true,
                activityReminders: updates.activityReminders ?? true,
                emailNotifications: updates.emailNotifications ?? false,
                pushNotifications: updates.pushNotifications ?? true,
                packingReminderDays: updates.packingReminderDays ?? [7, 3, 1],
                budgetThresholds: updates.budgetThresholds ?? [80, 90, 100],
                weatherCheckDays: updates.weatherCheckDays ?? 7,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        }
    },
});

// ============ ALERT GENERATION (Scheduled Functions) ============

/**
 * Check weather alerts for all upcoming trips
 * Should be run daily by scheduled function
 */
export const checkWeatherAlerts = action({
    args: {},
    handler: async (ctx: any): Promise<{ alertsCreated: number; tripsChecked: number }> => {
        console.log('Checking weather alerts...');
        
        // Get all trips starting within next 7 days
        const now = Date.now();
        const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
        
        const trips: any = await ctx.runQuery(internal.alerts.getUpcomingTrips, {
            startTime: now,
            endTime: sevenDaysFromNow,
        });

        let alertsCreated = 0;

        for (const trip of trips) {
            try {
                // Get user preferences
                const prefs = await ctx.runQuery(internal.alerts.getAlertPreferencesInternal, {
                    userId: trip.userId,
                });

                if (!prefs.weatherAlerts) continue;

                // Get weather forecast
                const destination = trip.tripDetail?.destination;
                if (!destination) continue;

                const weather: any = await ctx.runAction(api.weather.getOrFetchWeather as any, {
                    location: destination,
                });

                if (!weather) continue;

                // Check for weather alerts
                if (weather.alerts && weather.alerts.length > 0) {
                    for (const alert of weather.alerts) {
                        await ctx.runMutation(internal.alerts.createAlert, {
                            userId: trip.uid,
                            tripId: trip.tripId,
                            type: 'weather',
                            severity: 'warning',
                            title: `Weather Alert: ${alert.event}`,
                            message: `${alert.description}\n\nValid from ${new Date(alert.start * 1000).toLocaleString()} to ${new Date(alert.end * 1000).toLocaleString()}`,
                            actionRequired: 'Check your packing list and prepare accordingly',
                            metadata: {
                                weatherCondition: alert.event.toLowerCase(),
                                data: alert,
                            },
                            expiresAt: alert.end * 1000,
                        });
                        alertsCreated++;
                    }
                }

                // Check for extreme weather conditions
                const extremeTemp = weather.daily.some((d: any) => d.tempMax > 35 || d.tempMin < 0);
                const heavyRain = weather.daily.filter((d: any) => d.pop > 0.7).length >= 3;

                if (extremeTemp) {
                    const isHeat = weather.daily.some((d: any) => d.tempMax > 35);
                    await ctx.runMutation(internal.alerts.createAlert, {
                        userId: trip.uid,
                        tripId: trip.tripId,
                        type: 'weather',
                        severity: 'warning',
                        title: isHeat ? '🔥 Extreme Heat Expected' : '❄️ Freezing Temperatures Expected',
                        message: isHeat 
                            ? `Temperatures will exceed 35°C (95°F) in ${destination}. Stay hydrated and avoid prolonged sun exposure.`
                            : `Temperatures will drop below 0°C (32°F) in ${destination}. Pack warm clothing and be prepared for cold weather.`,
                        actionRequired: isHeat ? 'Pack sunscreen, hat, and light clothing' : 'Pack warm winter clothing',
                        metadata: {
                            weatherCondition: isHeat ? 'heat' : 'cold',
                        },
                    });
                    alertsCreated++;
                }

                if (heavyRain) {
                    await ctx.runMutation(internal.alerts.createAlert, {
                        userId: trip.uid,
                        tripId: trip.tripId,
                        type: 'weather',
                        severity: 'info',
                        title: '🌧️ Rainy Weather Expected',
                        message: `Heavy rain is forecasted for ${destination}. Consider bringing rain gear and planning indoor activities.`,
                        actionRequired: 'Pack umbrella and waterproof clothing',
                        metadata: {
                            weatherCondition: 'rain',
                        },
                    });
                    alertsCreated++;
                }
            } catch (error) {
                console.error(`Weather alert check failed for trip ${trip.tripId}:`, error);
            }
        }

        return { alertsCreated, tripsChecked: trips.length };
    },
});

/**
 * Check budget alerts for all trips
 * Should be run daily by scheduled function
 */
export const checkBudgetAlerts = action({
    args: {},
    handler: async (ctx: any): Promise<{ alertsCreated: number; tripsChecked: number }> => {
        console.log('Checking budget alerts...');
        
        // Get all active trips
        const trips: any = await ctx.runQuery(internal.alerts.getAllActiveTrips);
        
        let alertsCreated = 0;

        for (const trip of trips) {
            try {
                // Get user preferences
                const prefs = await ctx.runQuery(internal.alerts.getAlertPreferencesInternal, {
                    userId: trip.uid,
                });

                if (!prefs.budgetAlerts) continue;

                // Get budget and expenses
                const budget = await ctx.runQuery(internal.alerts.getTripBudget, {
                    tripId: trip.tripId,
                });

                if (!budget || !budget.totalBudget) continue;

                const expenses = await ctx.runQuery(internal.alerts.getTripExpenses, {
                    tripId: trip.tripId,
                });

                const totalSpent = expenses.reduce((sum: number, e: any) => sum + e.amount, 0);
                const percentage = (totalSpent / budget.totalBudget) * 100;

                // Check each threshold
                for (const threshold of prefs.budgetThresholds) {
                    if (percentage >= threshold) {
                        // Check if alert already exists for this threshold
                        const existingAlert = await ctx.runQuery(internal.alerts.findBudgetAlert, {
                            userId: trip.uid,
                            tripId: trip.tripId,
                            percentage: threshold,
                        });

                        if (!existingAlert) {
                            const severity = threshold >= 100 ? 'critical' : threshold >= 90 ? 'warning' : 'info';
                            const emoji = threshold >= 100 ? '🚨' : threshold >= 90 ? '⚠️' : '💰';
                            
                            await ctx.runMutation(internal.alerts.createAlert, {
                                userId: trip.uid,
                                tripId: trip.tripId,
                                type: 'budget',
                                severity,
                                title: `${emoji} Budget Alert: ${Math.round(percentage)}% Spent`,
                                message: threshold >= 100
                                    ? `You've exceeded your budget! Spent ${budget.currency} ${totalSpent.toFixed(2)} of ${budget.totalBudget.toFixed(2)}.`
                                    : `You've used ${Math.round(percentage)}% of your trip budget (${budget.currency} ${totalSpent.toFixed(2)} of ${budget.totalBudget.toFixed(2)}).`,
                                actionRequired: threshold >= 100 
                                    ? 'Review expenses and adjust spending' 
                                    : 'Monitor remaining expenses carefully',
                                metadata: {
                                    budgetPercentage: threshold,
                                    data: { totalSpent, totalBudget: budget.totalBudget, currency: budget.currency },
                                },
                            });
                            alertsCreated++;
                        }
                    }
                }
            } catch (error) {
                console.error(`Budget alert check failed for trip ${trip.tripId}:`, error);
            }
        }

        return { alertsCreated, tripsChecked: trips.length };
    },
});

/**
 * Check packing reminders
 * Should be run daily by scheduled function
 */
export const checkPackingReminders = action({
    args: {},
    handler: async (ctx: any): Promise<{ alertsCreated: number; tripsChecked: number }> => {
        console.log('Checking packing reminders...');
        
        const now = Date.now();
        const trips: any = await ctx.runQuery(internal.alerts.getAllActiveTrips);
        
        let alertsCreated = 0;

        for (const trip of trips) {
            try {
                const prefs = await ctx.runQuery(internal.alerts.getAlertPreferencesInternal, {
                    userId: trip.uid,
                });

                if (!prefs.packingReminders) continue;

                const startDate = trip.tripDetail?.startDate;
                if (!startDate) continue;

                const daysUntilTrip = Math.ceil((startDate - now) / (24 * 60 * 60 * 1000));

                // Check if today matches any reminder day
                if (prefs.packingReminderDays.includes(daysUntilTrip)) {
                    // Check if alert already sent for this day
                    const existingAlert = await ctx.runQuery(internal.alerts.findPackingAlert, {
                        userId: trip.uid,
                        tripId: trip.tripId,
                        daysUntil: daysUntilTrip,
                    });

                    if (!existingAlert) {
                        // Get packing progress
                        const packingItems = await ctx.runQuery(internal.alerts.getPackingItems, {
                            tripId: trip.tripId,
                        });

                        const totalItems = packingItems.length;
                        const packedItems = packingItems.filter((i: any) => i.isPacked).length;
                        const percentage = totalItems > 0 ? Math.round((packedItems / totalItems) * 100) : 0;

                        const severity = daysUntilTrip <= 1 ? 'warning' : 'info';
                        const emoji = daysUntilTrip <= 1 ? '⏰' : '🎒';
                        
                        await ctx.runMutation(internal.alerts.createAlert, {
                            userId: trip.uid,
                            tripId: trip.tripId,
                            type: 'packing',
                            severity,
                            title: `${emoji} Packing Reminder: ${daysUntilTrip} Day${daysUntilTrip !== 1 ? 's' : ''} Until Trip`,
                            message: `Your trip to ${trip.tripDetail?.destination} is in ${daysUntilTrip} day${daysUntilTrip !== 1 ? 's' : ''}! Packing progress: ${packedItems}/${totalItems} items (${percentage}%).`,
                            actionRequired: 'Review and complete your packing list',
                            metadata: {
                                daysUntilTrip,
                                data: { totalItems, packedItems, percentage },
                            },
                        });
                        alertsCreated++;
                    }
                }
            } catch (error) {
                console.error(`Packing reminder check failed for trip ${trip.tripId}:`, error);
            }
        }

        return { alertsCreated, tripsChecked: trips.length };
    },
});

// ============ INTERNAL QUERIES ============

export const getUpcomingTrips = internalQuery({
    args: {
        startTime: v.number(),
        endTime: v.number(),
    },
    handler: async (ctx, args) => {
        const allTrips = await ctx.db.query('TripDetailTable').collect();
        
        return allTrips.filter(trip => {
            const startDate = trip.tripDetail?.startDate;
            return startDate && startDate >= args.startTime && startDate <= args.endTime;
        });
    },
});

export const getAllActiveTrips = internalQuery({
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const allTrips = await ctx.db.query('TripDetailTable').collect();
        
        // Return trips that haven't ended yet (or don't have an end date)
        return allTrips.filter(trip => {
            const endDate = trip.tripDetail?.endDate;
            return !endDate || endDate >= now;
        });
    },
});

export const getTripBudget = internalQuery({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('TripBudget')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .first();
    },
});

export const getTripExpenses = internalQuery({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('TripExpenses')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();
    },
});

export const findBudgetAlert = internalQuery({
    args: {
        userId: v.id('UserTable'),
        tripId: v.string(),
        percentage: v.number(),
    },
    handler: async (ctx, args) => {
        const alerts = await ctx.db
            .query('TravelAlerts')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .filter((q) => q.eq(q.field('userId'), args.userId))
            .filter((q) => q.eq(q.field('type'), 'budget'))
            .collect();

        return alerts.find(a => a.metadata?.budgetPercentage === args.percentage);
    },
});

export const findPackingAlert = internalQuery({
    args: {
        userId: v.id('UserTable'),
        tripId: v.string(),
        daysUntil: v.number(),
    },
    handler: async (ctx, args) => {
        const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
        
        const alerts = await ctx.db
            .query('TravelAlerts')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .filter((q) => q.eq(q.field('userId'), args.userId))
            .filter((q) => q.eq(q.field('type'), 'packing'))
            .collect();

        // Check if alert was created in the last 24 hours for this day count
        return alerts.find(a => 
            a.metadata?.daysUntilTrip === args.daysUntil && 
            a.createdAt > oneDayAgo
        );
    },
});

export const getPackingItems = internalQuery({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('PackingItems')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();
    },
});

/**
 * Check custom booking reminders (flights, hotels, restaurants, etc.)
 * Should be run hourly by scheduled function
 */
export const checkCustomBookingReminders = action({
    args: {},
    handler: async (ctx: any): Promise<{ alertsCreated: number; bookingsChecked: number }> => {
        console.log('Checking custom booking reminders...');
        
        const now = Date.now();
        const sevenDaysFromNow = now + (7 * 24 * 60 * 60 * 1000);
        
        // Get all active trips in the next 7 days
        const trips: any = await ctx.runQuery(internal.alerts.getUpcomingTrips, {
            startTime: now,
            endTime: sevenDaysFromNow,
        });
        
        let alertsCreated = 0;
        let bookingsChecked = 0;

        for (const trip of trips) {
            try {
                // Get user preferences
                const prefs = await ctx.runQuery(internal.alerts.getAlertPreferencesInternal, {
                    userId: trip.uid,
                });

                if (!prefs.activityReminders) continue;

                // Get all custom bookings for this trip
                const bookings = await ctx.runQuery(api.customBookings.getTripBookings, {
                    tripId: trip.tripId,
                });

                for (const booking of bookings) {
                    // Skip if reminders disabled for this booking
                    if (booking.sendReminders === false) continue;

                    bookingsChecked++;

                    const hoursUntil = (booking.date - now) / (60 * 60 * 1000);
                    const reminderTimes = booking.reminderTimes || getDefaultReminderTimes(booking.bookingType);

                    // Check each reminder time
                    for (const hours of reminderTimes) {
                        // Check if we're within the reminder window (1 hour range)
                        if (hoursUntil <= hours && hoursUntil > (hours - 1)) {
                            // Check if alert already exists
                            const existingAlert = await ctx.runQuery(internal.alerts.findBookingAlert, {
                                userId: trip.uid,
                                tripId: trip.tripId,
                                bookingId: booking._id,
                                reminderHours: hours,
                            });

                            if (!existingAlert) {
                                // Create reminder alert
                                const severity = getSeverity(booking.bookingType, hours);
                                const message = generateBookingMessage(booking, hours);
                                const actionRequired = generateBookingAction(booking, hours);

                                await ctx.runMutation(internal.alerts.createAlert, {
                                    userId: trip.uid,
                                    tripId: trip.tripId,
                                    type: 'activity',
                                    severity,
                                    title: `${booking.bookingType.charAt(0).toUpperCase() + booking.bookingType.slice(1)} Reminder: ${booking.title}`,
                                    message,
                                    actionRequired,
                                    metadata: {
                                        activityName: booking.title,
                                        data: {
                                            bookingId: booking._id,
                                            bookingType: booking.bookingType,
                                            confirmationNumber: booking.confirmationNumber,
                                            location: booking.location,
                                            fromLocation: booking.fromLocation,
                                            toLocation: booking.toLocation,
                                            reminderHours: hours,
                                        },
                                    },
                                    expiresAt: booking.date + (24 * 60 * 60 * 1000), // Expire 1 day after booking date
                                });

                                alertsCreated++;
                            }
                        }
                    }
                }
            } catch (error) {
                console.error(`Error checking bookings for trip ${trip.tripId}:`, error);
            }
        }

        return { alertsCreated, bookingsChecked };
    },
});

// Helper: Get default reminder times based on booking type
function getDefaultReminderTimes(bookingType: string): number[] {
    switch (bookingType) {
        case 'flight':
            return [24, 3]; // 24 hours and 3 hours before
        case 'hotel':
            return [24]; // 1 day before check-in
        case 'restaurant':
            return [24, 2]; // 1 day and 2 hours before
        case 'tour':
            return [24, 3]; // 1 day and 3 hours before
        case 'transportation':
            return [24, 3]; // 1 day and 3 hours before
        case 'event':
            return [24, 3]; // 1 day and 3 hours before
        default:
            return [24]; // Default: 1 day before
    }
}

// Helper: Get severity based on booking type and time until
function getSeverity(bookingType: string, hoursUntil: number): 'info' | 'warning' | 'critical' {
    if (hoursUntil <= 3) {
        return 'critical'; // 3 hours or less = critical
    } else if (hoursUntil <= 12) {
        return 'warning'; // 12 hours or less = warning
    } else {
        return 'info'; // More than 12 hours = info
    }
}

// Helper: Generate message based on booking details
function generateBookingMessage(booking: any, hoursUntil: number): string {
    const timeStr = hoursUntil >= 24 
        ? `in ${Math.round(hoursUntil / 24)} day${Math.round(hoursUntil / 24) === 1 ? '' : 's'}` 
        : `in ${hoursUntil} hour${hoursUntil === 1 ? '' : 's'}`;

    switch (booking.bookingType) {
        case 'flight':
            return `Your flight ${booking.flightNumber || ''} from ${booking.departureAirport || booking.fromLocation} to ${booking.arrivalAirport || booking.toLocation} departs ${timeStr}. ${booking.confirmationNumber ? `Confirmation: ${booking.confirmationNumber}` : ''}`;
        
        case 'hotel':
            return `Check-in at ${booking.providerName || 'your hotel'} ${timeStr}. ${booking.location ? `Location: ${booking.location}` : ''} ${booking.confirmationNumber ? `Confirmation: ${booking.confirmationNumber}` : ''}`;
        
        case 'restaurant':
            return `Reservation at ${booking.providerName || booking.title} ${timeStr}${booking.partySize ? ` for ${booking.partySize} guests` : ''}. ${booking.location ? `Location: ${booking.location}` : ''}`;
        
        case 'tour':
            return `${booking.title} starts ${timeStr}. ${booking.location ? `Meeting point: ${booking.location}` : ''} ${booking.confirmationNumber ? `Confirmation: ${booking.confirmationNumber}` : ''}`;
        
        case 'transportation':
            return `${booking.title} ${timeStr}. ${booking.fromLocation ? `From: ${booking.fromLocation}` : ''} ${booking.toLocation ? `To: ${booking.toLocation}` : ''}`;
        
        case 'event':
            return `${booking.title} starts ${timeStr}. ${booking.location ? `Venue: ${booking.location}` : ''} ${booking.confirmationNumber ? `Ticket: ${booking.confirmationNumber}` : ''}`;
        
        default:
            return `${booking.title} is scheduled ${timeStr}. ${booking.location ? `Location: ${booking.location}` : ''}`;
    }
}

// Helper: Generate action required based on booking
function generateBookingAction(booking: any, hoursUntil: number): string {
    switch (booking.bookingType) {
        case 'flight':
            if (hoursUntil <= 3) {
                return 'Head to the airport now - allow time for security and check-in';
            } else if (hoursUntil <= 24) {
                return 'Complete online check-in and prepare travel documents';
            } else {
                return 'Review flight details and prepare for your trip';
            }
        
        case 'hotel':
            if (hoursUntil <= 3) {
                return 'Head to the hotel for check-in';
            } else {
                return 'Confirm your reservation and review check-in requirements';
            }
        
        case 'restaurant':
            if (hoursUntil <= 2) {
                return 'Get ready and head to the restaurant';
            } else {
                return 'Confirm your reservation and review the menu';
            }
        
        case 'tour':
            if (hoursUntil <= 3) {
                return 'Head to the meeting point - don\'t be late!';
            } else {
                return 'Review tour details and prepare required items';
            }
        
        case 'transportation':
            if (hoursUntil <= 3) {
                return 'Arrive at departure point early';
            } else {
                return 'Check departure time and location';
            }
        
        case 'event':
            if (hoursUntil <= 3) {
                return 'Head to the venue - arrive early for best experience';
            } else {
                return 'Review event details and parking/transit options';
            }
        
        default:
            return 'Review booking details and prepare accordingly';
    }
}

/**
 * Find existing booking alert to prevent duplicates
 */
export const findBookingAlert = internalQuery({
    args: {
        userId: v.id('UserTable'),
        tripId: v.string(),
        bookingId: v.string(),
        reminderHours: v.number(),
    },
    handler: async (ctx, args) => {
        const oneHourAgo = Date.now() - (60 * 60 * 1000);
        
        const alerts = await ctx.db
            .query('TravelAlerts')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .filter((q) => q.eq(q.field('userId'), args.userId))
            .filter((q) => q.eq(q.field('type'), 'activity'))
            .collect();

        // Check if alert was created in the last hour for this booking and reminder time
        return alerts.find(a => 
            a.metadata?.data?.bookingId === args.bookingId && 
            a.metadata?.data?.reminderHours === args.reminderHours &&
            a.createdAt > oneHourAgo
        );
    },
});

/**
 * Clean up old alerts (older than 30 days)
 */
export const cleanupOldAlerts = internalMutation({
    args: {},
    handler: async (ctx) => {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        const oldAlerts = await ctx.db
            .query('TravelAlerts')
            .withIndex('by_created', (q) => q.lt('createdAt', thirtyDaysAgo))
            .collect();

        for (const alert of oldAlerts) {
            await ctx.db.delete(alert._id);
        }

        return { deleted: oldAlerts.length };
    },
});
