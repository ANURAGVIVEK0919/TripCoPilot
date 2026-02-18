import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    UserTable: defineTable({
        name: v.string(),
        imageUrl: v.string(),
        email: v.string(),
        subscription: v.optional(v.string()),
    }),

    TripDetailTable: defineTable({
        tripId: v.string(),
        tripDetail: v.any(),
        uid: v.id('UserTable'),
        // Sharing & Collaboration fields
        shareId: v.optional(v.string()), // Unique share link ID
        isPublic: v.optional(v.boolean()), // Public/Private
        allowCloning: v.optional(v.boolean()), // Allow others to clone
        cloneCount: v.optional(v.number()), // Number of times cloned
        originalTripId: v.optional(v.string()), // If this is a cloned trip
    }),

    // Trip Collaborators
    TripCollaborators: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        userName: v.string(),
        userEmail: v.string(),
        userImage: v.string(),
        role: v.union(v.literal('owner'), v.literal('editor'), v.literal('viewer')),
        invitedBy: v.id('UserTable'),
        invitedAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['userId']),

    // Trip Activity Log
    TripActivity: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        action: v.string(), // "added_place", "edited_hotel", "commented", etc.
        details: v.optional(v.string()), // Additional context
        timestamp: v.number(),
    }).index('by_trip', ['tripId']),

    // Trip Comments
    TripComments: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        comment: v.string(),
        parentId: v.optional(v.id('TripComments')), // For threaded comments
        createdAt: v.number(),
    }).index('by_trip', ['tripId']),

    CommunityStories: defineTable({
        title: v.string(),
        content: v.string(),
        imageUrl: v.optional(v.string()), // Preview image
        images: v.optional(v.array(v.string())), // All images
        destination: v.string(),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        likes: v.array(v.id('UserTable')),
        createdAt: v.number(),
    }),

    StoryComments: defineTable({
        storyId: v.id('CommunityStories'),
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        comment: v.string(),
        createdAt: v.number(),
    }),

    // ============ LOCAL INSIDER TIPS ============
    
    // Insider Tips
    InsiderTips: defineTable({
        destination: v.string(), // City, Country or specific location
        category: v.union(
            v.literal('food'), // Best local food spots
            v.literal('activities'), // Things to do
            v.literal('transport'), // Getting around
            v.literal('hidden_gems'), // Off-the-beaten-path places
            v.literal('safety'), // Safety tips
            v.literal('budget'), // Money-saving tips
            v.literal('cultural'), // Cultural etiquette
            v.literal('seasonal') // Best times to visit
        ),
        title: v.string(), // Short tip title
        content: v.string(), // Detailed tip description
        images: v.optional(v.array(v.string())), // Supporting images
        specificLocation: v.optional(v.string()), // Exact address or place name
        priceRange: v.optional(v.union(
            v.literal('free'),
            v.literal('budget'), // $
            v.literal('moderate'), // $$
            v.literal('expensive') // $$$
        )),
        bestTime: v.optional(v.string()), // Best time to visit/use this tip
        tags: v.array(v.string()), // Searchable tags
        userId: v.id('UserTable'),
        userName: v.string(),
        userImage: v.string(),
        isVerifiedLocal: v.boolean(), // Badge for verified locals
        helpfulVotes: v.array(v.id('UserTable')), // Users who found this helpful
        notHelpfulVotes: v.array(v.id('UserTable')), // Users who didn't find this helpful
        bookmarkCount: v.number(), // How many users bookmarked this
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_destination', ['destination'])
      .index('by_category', ['category'])
      .index('by_user', ['userId'])
      .index('by_destination_category', ['destination', 'category']),

    // User Bookmarks for Tips
    TipBookmarks: defineTable({
        userId: v.id('UserTable'),
        tipId: v.id('InsiderTips'),
        createdAt: v.number(),
    }).index('by_user', ['userId'])
      .index('by_tip', ['tipId'])
      .index('by_user_tip', ['userId', 'tipId']),

    // Verified Local Status
    VerifiedLocals: defineTable({
        userId: v.id('UserTable'),
        destination: v.string(), // City/Country they're local to
        verificationMethod: v.union(
            v.literal('user_claimed'), // User self-verified
            v.literal('admin_verified'), // Admin verified
            v.literal('community_verified') // Community vouched (10+ helpful tips)
        ),
        verifiedAt: v.number(),
        tipCount: v.number(), // Number of tips provided for this destination
        helpfulScore: v.number(), // Aggregate helpfulness score
    }).index('by_user', ['userId'])
      .index('by_destination', ['destination'])
      .index('by_user_destination', ['userId', 'destination']),

    // Notifications
    Notifications: defineTable({
        userId: v.id('UserTable'), // User who receives the notification
        type: v.union(v.literal('like'), v.literal('comment')), // Notification type
        storyId: v.id('CommunityStories'), // Related story
        actorId: v.id('UserTable'), // User who performed the action
        actorName: v.string(),
        actorImage: v.string(),
        storyTitle: v.string(), // Title of the story
        commentText: v.optional(v.string()), // If type is comment, the comment text
        isRead: v.boolean(), // Whether notification has been read
        createdAt: v.number(),
    }).index('by_user', ['userId'])
      .index('by_user_unread', ['userId', 'isRead']),

    // ============ BUDGET & EXPENSE MANAGEMENT ============
    
    // Budget Settings per Trip
    TripBudget: defineTable({
        tripId: v.string(),
        totalBudget: v.number(), // Total budget amount
        currency: v.string(), // Base currency (USD, EUR, INR, etc.)
        categoryBudgets: v.optional(v.object({
            accommodation: v.optional(v.number()),
            food: v.optional(v.number()),
            transport: v.optional(v.number()),
            activities: v.optional(v.number()),
            shopping: v.optional(v.number()),
            other: v.optional(v.number()),
        })),
        alertThreshold: v.optional(v.number()), // Alert when X% of budget spent (e.g., 80)
        createdBy: v.id('UserTable'),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_trip', ['tripId']),

    // Individual Expenses
    TripExpenses: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'), // Who logged the expense
        userName: v.string(),
        userImage: v.string(),
        amount: v.number(), // Amount in original currency
        currency: v.string(), // Currency of expense
        convertedAmount: v.optional(v.number()), // Amount in trip base currency
        category: v.union(
            v.literal('accommodation'),
            v.literal('food'),
            v.literal('transport'),
            v.literal('activities'),
            v.literal('shopping'),
            v.literal('other')
        ),
        description: v.string(),
        date: v.number(), // Expense date (timestamp)
        receiptUrl: v.optional(v.string()), // Receipt image URL
        location: v.optional(v.string()), // Where expense occurred
        paidBy: v.id('UserTable'), // Who paid
        splitType: v.union(
            v.literal('equal'), // Split equally among all participants
            v.literal('custom'), // Custom split percentages
            v.literal('none') // Not split (personal expense)
        ),
        participants: v.array(v.id('UserTable')), // Who should split this expense
        customSplit: v.optional(v.array(v.object({
            userId: v.id('UserTable'),
            amount: v.number(), // How much this person owes
        }))),
        isSettled: v.boolean(), // Whether all splits are settled
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['userId'])
      .index('by_trip_date', ['tripId', 'date']),

    // Settlement Records (who owes whom)
    ExpenseSettlements: defineTable({
        tripId: v.string(),
        expenseId: v.id('TripExpenses'),
        fromUserId: v.id('UserTable'), // Who owes money
        fromUserName: v.string(),
        toUserId: v.id('UserTable'), // Who is owed money
        toUserName: v.string(),
        amount: v.number(),
        currency: v.string(),
        isPaid: v.boolean(),
        paidAt: v.optional(v.number()),
        notes: v.optional(v.string()),
        createdAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_from_user', ['fromUserId'])
      .index('by_to_user', ['toUserId'])
      .index('by_expense', ['expenseId']),

    // Currency Exchange Rates Cache
    CurrencyRates: defineTable({
        baseCurrency: v.string(),
        rates: v.any(), // { USD: 1, EUR: 0.85, INR: 83.12, etc. }
        lastUpdated: v.number(),
    }).index('by_base', ['baseCurrency']),

    // ============ PACKING LIST SYSTEM ============

    // Packing Lists for Trips
    PackingLists: defineTable({
        tripId: v.string(),
        name: v.string(), // "Main Packing List" or custom name
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
        generatedPrompt: v.optional(v.string()), // What was used to generate
        createdBy: v.id('UserTable'),
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['createdBy']),

    // Individual Packing Items
    PackingItems: defineTable({
        packingListId: v.id('PackingLists'),
        tripId: v.string(), // Denormalized for easier queries
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
        name: v.string(), // "T-shirts", "Passport", "Phone Charger"
        quantity: v.number(), // How many
        isPacked: v.boolean(),
        isEssential: v.boolean(), // Highlight important items
        weight: v.optional(v.number()), // Weight in kg
        notes: v.optional(v.string()),
        imageUrl: v.optional(v.string()), // Photo of item
        addedBy: v.id('UserTable'),
        packedBy: v.optional(v.id('UserTable')),
        packedAt: v.optional(v.number()),
        assignedTo: v.optional(v.id('UserTable')), // For group packing
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_list', ['packingListId'])
      .index('by_trip', ['tripId'])
      .index('by_category', ['packingListId', 'category'])
      .index('by_assigned', ['assignedTo']),

    // Packing Templates (Reusable)
    PackingTemplates: defineTable({
        name: v.string(), // "Beach Vacation", "Winter Ski Trip"
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
        isPublic: v.boolean(), // Can others use this template?
        useCount: v.number(), // How many times used
        createdBy: v.id('UserTable'),
        createdAt: v.number(),
    }).index('by_type', ['type'])
      .index('by_public', ['isPublic'])
      .index('by_creator', ['createdBy']),

    // Packing Reminders
    PackingReminders: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        reminderType: v.union(
            v.literal('pack_soon'), // 3 days before
            v.literal('last_minute'), // 1 day before
            v.literal('custom')
        ),
        scheduledFor: v.number(), // Timestamp when to send
        isSent: v.boolean(),
        sentAt: v.optional(v.number()),
        message: v.string(),
        createdAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['userId'])
      .index('by_scheduled', ['scheduledFor']),

    // AI Chat Conversations
    ChatConversations: defineTable({
        userId: v.id('UserTable'),
        tripId: v.optional(v.string()), // Associated trip (optional)
        title: v.string(), // Auto-generated from first message
        lastMessageAt: v.number(),
        messageCount: v.number(),
        createdAt: v.number(),
    }).index('by_user', ['userId'])
      .index('by_trip', ['tripId'])
      .index('by_user_and_date', ['userId', 'lastMessageAt']),

    // AI Chat Messages
    ChatMessages: defineTable({
        conversationId: v.id('ChatConversations'),
        userId: v.id('UserTable'),
        role: v.union(
            v.literal('user'),
            v.literal('assistant'),
            v.literal('system')
        ),
        content: v.string(),
        context: v.optional(v.object({
            tripId: v.optional(v.string()),
            tripName: v.optional(v.string()),
            actionTaken: v.optional(v.string()), // "created_packing_list", "analyzed_budget", etc.
            data: v.optional(v.any()), // Additional context data
        })),
        createdAt: v.number(),
    }).index('by_conversation', ['conversationId'])
      .index('by_user', ['userId']),

    // ============ WEATHER INTEGRATION ============

    // Weather Forecasts Cache
    WeatherForecasts: defineTable({
        location: v.string(), // City name or coordinates "lat,lon"
        country: v.optional(v.string()), // Country code (US, FR, JP, etc.)
        current: v.object({
            temp: v.number(), // Current temperature in Celsius
            feelsLike: v.number(), // Feels like temperature
            description: v.string(), // "Clear sky", "Light rain", etc.
            icon: v.string(), // OpenWeather icon code (01d, 10n, etc.)
            humidity: v.number(), // Humidity percentage
            windSpeed: v.number(), // Wind speed in m/s
            sunrise: v.number(), // Unix timestamp
            sunset: v.number(), // Unix timestamp
        }),
        daily: v.array(v.object({
            date: v.number(), // Unix timestamp (day)
            tempMin: v.number(), // Minimum temperature
            tempMax: v.number(), // Maximum temperature
            description: v.string(), // Weather description
            icon: v.string(), // Icon code
            pop: v.number(), // Probability of precipitation (0-1)
            humidity: v.number(), // Humidity percentage
            windSpeed: v.number(), // Wind speed
        })),
        alerts: v.optional(v.array(v.object({
            event: v.string(), // "Extreme heat", "Heavy rain", etc.
            description: v.string(), // Full alert description
            start: v.number(), // Alert start time
            end: v.number(), // Alert end time
        }))),
        lastUpdated: v.number(), // Cache timestamp
    }).index('by_location', ['location'])
      .index('by_updated', ['lastUpdated']),

    // ============ SMART ALERTS & REMINDERS ============

    // Travel Alerts
    TravelAlerts: defineTable({
        userId: v.id('UserTable'),
        tripId: v.string(),
        type: v.union(
            v.literal('weather'), // Weather warning/alert
            v.literal('packing'), // Packing reminder
            v.literal('budget'), // Budget threshold alert
            v.literal('document'), // Document expiry warning
            v.literal('activity'), // Activity/flight reminder
            v.literal('general') // General trip reminder
        ),
        severity: v.union(
            v.literal('info'), // Informational (blue)
            v.literal('warning'), // Warning (yellow/orange)
            v.literal('critical') // Critical (red)
        ),
        title: v.string(), // Alert title (e.g., "Heavy Rain Expected")
        message: v.string(), // Full alert message
        actionRequired: v.optional(v.string()), // Suggested action
        metadata: v.optional(v.object({
            weatherCondition: v.optional(v.string()), // rain, snow, heat, etc.
            budgetPercentage: v.optional(v.number()), // 80, 90, 100
            daysUntilTrip: v.optional(v.number()), // Days remaining
            documentType: v.optional(v.string()), // passport, visa, etc.
            activityName: v.optional(v.string()), // Activity/flight name
            data: v.optional(v.any()), // Additional data
        })),
        isRead: v.boolean(), // Whether user has seen it
        isDismissed: v.boolean(), // Whether user dismissed it
        isSnoozed: v.boolean(), // Whether user snoozed it
        snoozedUntil: v.optional(v.number()), // When to show again
        createdAt: v.number(),
        expiresAt: v.optional(v.number()), // Auto-dismiss after this time
    }).index('by_user', ['userId'])
      .index('by_trip', ['tripId'])
      .index('by_user_unread', ['userId', 'isRead'])
      .index('by_type', ['type'])
      .index('by_created', ['createdAt']),

    // Alert Preferences
    AlertPreferences: defineTable({
        userId: v.id('UserTable'),
        weatherAlerts: v.boolean(), // Enable weather alerts
        packingReminders: v.boolean(), // Enable packing reminders
        budgetAlerts: v.boolean(), // Enable budget alerts
        documentWarnings: v.boolean(), // Enable document expiry warnings
        activityReminders: v.boolean(), // Enable activity reminders
        emailNotifications: v.boolean(), // Send emails
        pushNotifications: v.boolean(), // Browser push notifications
        packingReminderDays: v.array(v.number()), // Days before trip (e.g., [7, 3, 1])
        budgetThresholds: v.array(v.number()), // Percentages (e.g., [80, 90, 100])
        weatherCheckDays: v.number(), // How many days ahead to check weather
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_user', ['userId']),

    // ============ CUSTOM BOOKINGS ============
    
    // User's Custom Bookings (Flights, Hotels, Activities, etc.)
    CustomBookings: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        bookingType: v.union(
            v.literal('flight'), // Flight booking
            v.literal('hotel'), // Hotel/accommodation
            v.literal('restaurant'), // Restaurant reservation
            v.literal('tour'), // Tour/attraction booking
            v.literal('transportation'), // Train, bus, car rental
            v.literal('event'), // Concert, show, sports event
            v.literal('other') // Other bookings
        ),
        
        // Basic Information
        title: v.string(), // e.g., "Flight to Paris" or "Hotel Grand Plaza"
        description: v.optional(v.string()), // Additional details
        
        // Date & Time
        date: v.number(), // Main date/time (departure, check-in, reservation, etc.)
        endDate: v.optional(v.number()), // End date (check-out, return flight, etc.)
        allDay: v.optional(v.boolean()), // All-day event
        
        // Location
        location: v.optional(v.string()), // Address or venue
        fromLocation: v.optional(v.string()), // For flights/transportation (departure)
        toLocation: v.optional(v.string()), // For flights/transportation (arrival)
        
        // Booking Details
        confirmationNumber: v.optional(v.string()), // Booking/ticket confirmation
        bookingReference: v.optional(v.string()), // Alternative reference
        providerName: v.optional(v.string()), // Airline, hotel name, tour company
        
        // Contact & Documents
        phone: v.optional(v.string()), // Contact phone number
        email: v.optional(v.string()), // Contact email
        website: v.optional(v.string()), // Booking website
        attachments: v.optional(v.array(v.string())), // URLs to tickets, confirmations, receipts
        
        // Flight-Specific Fields
        flightNumber: v.optional(v.string()), // e.g., "AA123"
        airline: v.optional(v.string()), // e.g., "American Airlines"
        departureAirport: v.optional(v.string()), // e.g., "JFK"
        arrivalAirport: v.optional(v.string()), // e.g., "CDG"
        terminal: v.optional(v.string()), // Terminal number
        gate: v.optional(v.string()), // Gate number
        seatNumber: v.optional(v.string()), // Seat assignment
        
        // Hotel-Specific Fields
        checkInTime: v.optional(v.string()), // e.g., "15:00"
        checkOutTime: v.optional(v.string()), // e.g., "11:00"
        roomType: v.optional(v.string()), // e.g., "Deluxe Suite"
        roomNumber: v.optional(v.string()), // Room assignment
        
        // Restaurant-Specific Fields
        reservationTime: v.optional(v.string()), // e.g., "19:30"
        partySize: v.optional(v.number()), // Number of guests
        specialRequests: v.optional(v.string()), // Dietary restrictions, etc.
        
        // Financial
        totalCost: v.optional(v.number()), // Total booking cost
        currency: v.optional(v.string()), // Currency code
        isPaid: v.optional(v.boolean()), // Payment status
        
        // Reminders
        reminderTimes: v.optional(v.array(v.number())), // Custom reminder times (hours before)
        sendReminders: v.optional(v.boolean()), // Enable/disable reminders for this booking
        
        // Notes
        notes: v.optional(v.string()), // User's personal notes
        
        // Status
        isCancelled: v.optional(v.boolean()), // Booking cancelled
        isCompleted: v.optional(v.boolean()), // Booking completed
        
        // Metadata
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['userId'])
      .index('by_trip_date', ['tripId', 'date'])
      .index('by_type', ['bookingType'])
      .index('by_trip_type', ['tripId', 'bookingType']),

    // ============ PHOTO GALLERY & SOCIAL MEDIA ============

    // Trip Photos
    TripPhotos: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        imageUrl: v.string(), // UploadThing URL
        caption: v.optional(v.string()), // User-provided caption
        location: v.optional(v.string()), // Where photo was taken
        dateTaken: v.optional(v.number()), // When photo was taken (timestamp)
        dayNumber: v.optional(v.number()), // Which day of trip (1, 2, 3...)
        tags: v.optional(v.array(v.string())), // Tags like "food", "sunset", "beach"
        isPrimary: v.optional(v.boolean()), // Trip cover photo
        width: v.optional(v.number()), // Image dimensions
        height: v.optional(v.number()),
        fileSize: v.optional(v.number()), // Size in bytes
        createdAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['userId'])
      .index('by_trip_day', ['tripId', 'dayNumber'])
      .index('by_trip_date', ['tripId', 'dateTaken']),

    // Social Media Posts (Generated)
    SocialMediaPosts: defineTable({
        tripId: v.string(),
        userId: v.id('UserTable'),
        platform: v.union(
            v.literal('instagram_post'), // 1:1 square
            v.literal('instagram_story'), // 9:16 vertical
            v.literal('instagram_reel'), // 9:16 video
            v.literal('facebook_post'), // 1.91:1 horizontal
            v.literal('whatsapp_status'), // 9:16 vertical
            v.literal('twitter_post'), // 16:9 horizontal
        ),
        title: v.string(), // Generated title
        caption: v.string(), // AI-generated caption
        hashtags: v.array(v.string()), // Generated hashtags
        photoIds: v.array(v.id('TripPhotos')), // Photos used in post
        template: v.string(), // Template used (carousel, collage, single, etc.)
        generatedImageUrl: v.optional(v.string()), // Final compiled image URL
        
        // Trip Context (for caption generation)
        destination: v.string(),
        duration: v.optional(v.string()),
        highlights: v.optional(v.array(v.string())), // Key moments
        
        // AI Generation Metadata
        aiModel: v.optional(v.string()), // "gpt-4", "llama-3.3", etc.
        generatedAt: v.number(),
        
        // Status
        isPublished: v.optional(v.boolean()),
        publishedAt: v.optional(v.number()),
        
        createdAt: v.number(),
        updatedAt: v.number(),
    }).index('by_trip', ['tripId'])
      .index('by_user', ['userId'])
      .index('by_platform', ['platform'])
      .index('by_trip_platform', ['tripId', 'platform']),
});