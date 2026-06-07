import { v } from "convex/values";
import { mutation, query, action, internalQuery, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

// ============ PHOTO MANAGEMENT ============

/**
 * Upload trip photo
 */
export const uploadTripPhoto = mutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        imageUrl: v.string(),
        caption: v.optional(v.string()),
        location: v.optional(v.string()),
        dateTaken: v.optional(v.number()),
        dayNumber: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
        width: v.optional(v.number()),
        height: v.optional(v.number()),
        fileSize: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const photoId = await ctx.db.insert('TripPhotos', {
            ...args,
            isPrimary: false,
            createdAt: Date.now(),
        });
        return photoId;
    },
});

/**
 * Get all photos for a trip
 */
export const getTripPhotos = query({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('TripPhotos')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .order('desc')
            .collect();
    },
});

/**
 * Get photos by day
 */
export const getPhotosByDay = query({
    args: { 
        tripId: v.string(),
        dayNumber: v.number(),
    },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('TripPhotos')
            .withIndex('by_trip_day', (q) => 
                q.eq('tripId', args.tripId).eq('dayNumber', args.dayNumber)
            )
            .collect();
    },
});

/**
 * Set primary/cover photo for trip
 */
export const setPrimaryPhoto = mutation({
    args: {
        photoId: v.id('TripPhotos'),
        tripId: v.string(),
    },
    handler: async (ctx, args) => {
        // Remove primary status from all photos in trip
        const allPhotos = await ctx.db
            .query('TripPhotos')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();
        
        for (const photo of allPhotos) {
            if (photo.isPrimary) {
                await ctx.db.patch(photo._id, { isPrimary: false });
            }
        }
        
        // Set new primary photo
        await ctx.db.patch(args.photoId, { isPrimary: true });
    },
});

/**
 * Delete photo
 */
export const deletePhoto = mutation({
    args: { photoId: v.id('TripPhotos') },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.photoId);
    },
});

/**
 * Update photo details
 */
export const updatePhoto = mutation({
    args: {
        photoId: v.id('TripPhotos'),
        caption: v.optional(v.string()),
        location: v.optional(v.string()),
        dateTaken: v.optional(v.number()),
        dayNumber: v.optional(v.number()),
        tags: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const { photoId, ...updates } = args;
        await ctx.db.patch(photoId, updates);
    },
});

// ============ SOCIAL MEDIA POST GENERATION ============

/**
 * Generate COMPLETE AI-powered social media post with photo analysis
 */
export const generateCompletePost = action({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        platform: v.union(
            v.literal('instagram_post'),
            v.literal('instagram_carousel'),
            v.literal('facebook_post'),
            v.literal('whatsapp_status'),
        ),
        photoUrls: v.array(v.string()),
        customPrompt: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{
        caption: string;
        hashtags: string[];
        location: string;
        selectedPhotos: string[];
        photoArrangement: string;
    }> => {
        try {
            // Get trip details
            const trip: any = await ctx.runQuery(internal.socialMedia.getTripDetailsForPost, {
                tripId: args.tripId,
            });

            if (!trip) {
                throw new Error('Trip not found');
            }

            // Determine how many photos to select based on platform
            const photoLimit = args.platform === 'instagram_post' || args.platform === 'whatsapp_status' ? 1 : 10;
            
            // AI analyzes and selects best photos
            const selectedPhotos = await analyzeAndSelectPhotos(ctx, {
                photoUrls: args.photoUrls,
                limit: photoLimit,
                trip: trip,
            });

            // Generate AI caption
            const caption = await generateCaption(ctx, {
                trip,
                photos: selectedPhotos.map((url: string) => ({ imageUrl: url })),
                platform: args.platform,
                customPrompt: args.customPrompt,
            });

            // Generate hashtags
            const hashtags = generateHashtags(trip, args.platform);

            // Get location from trip
            const location = trip.destination || 'Explore the World';

            // Generate photo arrangement description
            const photoArrangement = generatePhotoArrangement(args.platform, selectedPhotos.length);

            return {
                caption,
                hashtags,
                location,
                selectedPhotos,
                photoArrangement,
            };
        } catch (error) {
            console.error('Generate complete post error:', error);
            throw new Error('Failed to generate complete post');
        }
    },
});

/**
 * Save generated post to database
 */
export const saveGeneratedPost = action({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        platform: v.string(),
        caption: v.string(),
        hashtags: v.array(v.string()),
        location: v.string(),
        photoUrls: v.array(v.string()),
    },
    handler: async (ctx, args): Promise<{ postId: Id<"SocialMediaPosts"> }> => {
        // Upload photos to TripPhotos table
        const photoIds: Id<"TripPhotos">[] = [];
        for (const url of args.photoUrls) {
            const photoId: Id<"TripPhotos"> = await ctx.runMutation(internal.socialMedia.saveTripPhoto, {
                tripId: args.tripId,
                userId: args.userId,
                imageUrl: url,
            });
            photoIds.push(photoId);
        }

        // Create social media post record
        const postId: Id<"SocialMediaPosts"> = await ctx.runMutation(internal.socialMedia.createSocialPost, {
            tripId: args.tripId,
            userId: args.userId,
            platform: args.platform,
            title: args.location,
            caption: args.caption,
            hashtags: args.hashtags,
            photoIds: photoIds,
            template: photoIds.length > 1 ? 'carousel' : 'single',
            destination: args.location,
            duration: undefined,
            highlights: undefined,
            aiModel: 'llama-3.3-70b',
        });

        return { postId };
    },
});

/**
 * Generate AI-powered social media post (LEGACY - for backward compatibility)
 */
export const generateSocialPost = action({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        platform: v.union(
            v.literal('instagram_post'),
            v.literal('instagram_story'),
            v.literal('facebook_post'),
            v.literal('whatsapp_status'),
        ),
        photoIds: v.optional(v.array(v.id('TripPhotos'))),
        customPrompt: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<{
        postId: any;
        caption: string;
        hashtags: string[];
        photoCount: number;
    }> => {
        try {
            // Get trip details
            const trip: any = await ctx.runQuery(internal.socialMedia.getTripDetailsForPost, {
                tripId: args.tripId,
            });

            if (!trip) {
                throw new Error('Trip not found');
            }

            // Get photos
            let photos: any[] = [];
            if (args.photoIds && args.photoIds.length > 0) {
                photos = await ctx.runQuery(internal.socialMedia.getSelectedPhotos, {
                    photoIds: args.photoIds,
                });
            } else {
                // Use all trip photos
                photos = await ctx.runQuery(internal.socialMedia.getAllTripPhotos, {
                    tripId: args.tripId,
                });
            }

            // Generate AI caption
            const caption = await generateCaption(ctx, {
                trip,
                photos,
                platform: args.platform,
                customPrompt: args.customPrompt,
            });

            // Generate hashtags
            const hashtags = generateHashtags(trip, args.platform);

            // Create social media post record
            const postId: any = await ctx.runMutation(internal.socialMedia.createSocialPost, {
                tripId: args.tripId,
                userId: args.userId,
                platform: args.platform,
                title: trip.destination,
                caption: caption,
                hashtags: hashtags,
                photoIds: photos.map((p: any) => p._id),
                template: photos.length > 1 ? 'carousel' : 'single',
                destination: trip.destination,
                duration: trip.duration,
                highlights: trip.highlights,
                aiModel: 'llama-3.3-70b',
            });

            return {
                postId,
                caption,
                hashtags,
                photoCount: photos.length,
            };
        } catch (error) {
            console.error('Generate social post error:', error);
            throw new Error('Failed to generate social media post');
        }
    },
});

/**
 * Get user's generated posts
 */
export const getUserPosts = query({
    args: { 
        userId: v.id('UserTable'),
        tripId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        if (args.tripId) {
            return await ctx.db
                .query('SocialMediaPosts')
                .withIndex('by_trip', (q) => q.eq('tripId', args.tripId as string))
                .order('desc')
                .collect();
        }
        
        return await ctx.db
            .query('SocialMediaPosts')
            .withIndex('by_user', (q) => q.eq('userId', args.userId))
            .order('desc')
            .take(50);
    },
});

/**
 * Get post by ID
 */
export const getPost = query({
    args: { postId: v.id('SocialMediaPosts') },
    handler: async (ctx, args) => {
        const post = await ctx.db.get(args.postId);
        if (!post) return null;

        // Get photos for the post
        const photos = await Promise.all(
            post.photoIds.map(async (photoId) => {
                return await ctx.db.get(photoId);
            })
        );

        return {
            ...post,
            photos: photos.filter(Boolean),
        };
    },
});

/**
 * Delete social media post
 */
export const deletePost = mutation({
    args: { postId: v.id('SocialMediaPosts') },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.postId);
    },
});

/**
 * Mark post as published
 */
export const markPostPublished = mutation({
    args: { postId: v.id('SocialMediaPosts') },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.postId, {
            isPublished: true,
            publishedAt: Date.now(),
            updatedAt: Date.now(),
        });
    },
});

// ============ INTERNAL FUNCTIONS ============

/**
 * Internal: Get trip details for post generation
 */
export const getTripDetailsForPost = internalQuery({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        const trip = await ctx.db
            .query('TripDetailTable')
            .filter((q) => q.eq(q.field('tripId'), args.tripId))
            .first();

        if (!trip) return null;

        const tripDetail = trip.tripDetail;

        // Get expenses for highlights
        const expenses = await ctx.db
            .query('TripExpenses')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();

        // Get bookings for highlights
        const bookings = await ctx.db
            .query('CustomBookings')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .collect();

        // Extract highlights
        const highlights: string[] = [];
        
        // Add unique locations from bookings
        const uniqueLocations = new Set(
            bookings
                .map(b => b.location)
                .filter((loc): loc is string => Boolean(loc))
        );
        highlights.push(...Array.from(uniqueLocations).slice(0, 3));

        // Add activity types
        const activityTypes = new Set(
            bookings
                .filter(b => b.bookingType === 'tour' || b.bookingType === 'event')
                .map(b => b.title)
        );
        highlights.push(...Array.from(activityTypes).slice(0, 2));

        return {
            destination: tripDetail?.destination || 'Amazing Place',
            duration: tripDetail?.duration || 'A few days',
            budget: tripDetail?.budget || 'Moderate',
            groupSize: tripDetail?.group_size || 'Solo',
            totalExpenses: expenses.reduce((sum, e) => sum + e.amount, 0),
            bookingCount: bookings.length,
            highlights: highlights.slice(0, 5),
            itinerary: tripDetail?.itinerary || [],
        };
    },
});

/**
 * Internal: Get selected photos
 */
export const getSelectedPhotos = internalQuery({
    args: { photoIds: v.array(v.id('TripPhotos')) },
    handler: async (ctx, args) => {
        return await Promise.all(
            args.photoIds.map(async (id) => {
                return await ctx.db.get(id);
            })
        );
    },
});

/**
 * Internal: Get all trip photos
 */
export const getAllTripPhotos = internalQuery({
    args: { tripId: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query('TripPhotos')
            .withIndex('by_trip', (q) => q.eq('tripId', args.tripId))
            .take(10); // Limit to 10 photos
    },
});

/**
 * Internal: Save trip photo
 */
export const saveTripPhoto = internalMutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        imageUrl: v.string(),
    },
    handler: async (ctx, args) => {
        return await ctx.db.insert('TripPhotos', {
            tripId: args.tripId,
            userId: args.userId,
            imageUrl: args.imageUrl,
            isPrimary: false,
            createdAt: Date.now(),
        });
    },
});

/**
 * Internal: Create social media post
 */
export const createSocialPost = internalMutation({
    args: {
        tripId: v.string(),
        userId: v.id('UserTable'),
        platform: v.string(),
        title: v.string(),
        caption: v.string(),
        hashtags: v.array(v.string()),
        photoIds: v.array(v.id('TripPhotos')),
        template: v.string(),
        destination: v.string(),
        duration: v.optional(v.string()),
        highlights: v.optional(v.array(v.string())),
        aiModel: v.string(),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        return await ctx.db.insert('SocialMediaPosts', {
            tripId: args.tripId,
            userId: args.userId,
            platform: args.platform as any,
            title: args.title,
            caption: args.caption,
            hashtags: args.hashtags,
            photoIds: args.photoIds,
            template: args.template,
            destination: args.destination,
            duration: args.duration,
            highlights: args.highlights,
            aiModel: args.aiModel,
            generatedAt: now,
            isPublished: false,
            createdAt: now,
            updatedAt: now,
        });
    },
});

// ============ HELPER FUNCTIONS ============

/**
 * Generate AI caption using Groq
 */
async function generateCaption(
    ctx: any,
    data: {
        trip: any;
        photos: any[];
        platform: string;
        customPrompt?: string;
    }
): Promise<string> {
    const { trip, photos, platform, customPrompt } = data;

    // Build AI prompt
    const prompt = `You are a creative travel content creator. Generate an engaging, authentic social media caption for ${platform}.

Trip Details:
- Destination: ${trip.destination}
- Duration: ${trip.duration}
- Highlights: ${trip.highlights?.join(', ') || 'None'}
- Photos: ${photos.length} stunning images
${customPrompt ? `\nUser Request: ${customPrompt}` : ''}

Platform Guidelines:
${getPlatformGuidelines(platform)}

Create a caption that:
1. Captures the trip's essence
2. Uses storytelling (not generic)
3. Includes emojis naturally
4. Ends with a call-to-action question
5. Length: ${getPlatformLength(platform)}

DO NOT include hashtags (they'll be added separately).
Write in first person, be authentic and engaging.`;

    try {
        const groqApiKey = process.env.GROQ_API_KEY!;
        if (!groqApiKey) {
            throw new Error('GROQ_API_KEY not configured');
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
                    {
                        role: 'system',
                        content: 'You are an expert travel content creator specializing in authentic, engaging social media captions.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.9,
                max_tokens: 500,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Groq API error (${response.status}): ${errorText || response.statusText}`);
        }

        const result = await response.json();
        if (!result.choices || result.choices.length === 0 || !result.choices[0]?.message?.content) {
            throw new Error(`Invalid or empty response from Groq API: ${JSON.stringify(result)}`);
        }
        return result.choices[0].message.content.trim();
    } catch (error) {
        console.error('Caption generation error:', error);
        // Fallback caption
        return `Just got back from an incredible trip to ${trip.destination}! ${trip.duration} of pure adventure 🌍✨\n\n${trip.highlights?.[0] || 'Amazing experiences'} and so many unforgettable memories. Can't wait to go back! 💙\n\nHave you been here? What should I visit next time? 👇`;
    }
}

/**
 * Get platform-specific guidelines
 */
function getPlatformGuidelines(platform: string): string {
    const guidelines: Record<string, string> = {
        instagram_post: '- Professional yet personal\n- 3-5 sentences\n- 2-3 emojis\n- Aspirational tone',
        instagram_story: '- Casual and spontaneous\n- 1-2 sentences\n- Many emojis\n- Conversational',
        facebook_post: '- Detailed storytelling\n- 4-6 sentences\n- Fewer emojis\n- Personal updates',
        whatsapp_status: '- Very brief\n- 1 sentence max\n- Lots of emojis\n- Exciting tone',
    };
    return guidelines[platform] || guidelines['instagram_post'];
}

/**
 * Get platform character limits
 */
function getPlatformLength(platform: string): string {
    const lengths: Record<string, string> = {
        instagram_post: '125-150 words',
        instagram_story: '50-75 words',
        facebook_post: '150-200 words',
        whatsapp_status: '30-50 words',
    };
    return lengths[platform] || '100-150 words';
}

/**
 * Generate relevant hashtags
 */
function generateHashtags(trip: any, platform: string): string[] {
    const hashtags: string[] = [];
    
    // Destination-based
    const destination = trip.destination?.replace(/\s+/g, '') || 'Travel';
    hashtags.push(`#${destination}`);
    hashtags.push(`#Visit${destination}`);
    
    // Generic travel hashtags
    const travelTags = [
        '#TravelGram',
        '#Wanderlust',
        '#TravelPhotography',
        '#Explore',
        '#Adventure',
        '#TravelBlogger',
        '#InstaTravel',
        '#TravelDiaries',
        '#BucketList',
        '#TravelMore',
    ];
    
    // Add 8-12 hashtags based on platform
    const count = platform === 'instagram_post' || platform === 'instagram_carousel' ? 10 : 5;
    hashtags.push(...travelTags.slice(0, count - 2));
    
    // Budget-based
    if (trip.budget) {
        if (trip.budget.toLowerCase().includes('budget')) {
            hashtags.push('#BudgetTravel');
        } else if (trip.budget.toLowerCase().includes('luxury')) {
            hashtags.push('#LuxuryTravel');
        }
    }
    
    return hashtags;
}

/**
 * AI analyzes photos and selects best ones for the post
 */
async function analyzeAndSelectPhotos(
    ctx: any,
    data: {
        photoUrls: string[];
        limit: number;
        trip: any;
    }
): Promise<string[]> {
    const { photoUrls, limit, trip } = data;

    // If photos are within limit, return all
    if (photoUrls.length <= limit) {
        return photoUrls;
    }

    // Use AI to select best photos based on trip context
    try {
        const groqApiKey = process.env.GROQ_API_KEY!;
        if (!groqApiKey) {
            // Fallback: return first N photos
            return photoUrls.slice(0, limit);
        }

        const prompt = `You are an expert photo curator for social media. Analyze this trip and recommend which ${limit} photo(s) to select for maximum engagement.

Trip Details:
- Destination: ${trip.destination}
- Highlights: ${trip.highlights?.join(', ') || 'General travel'}
- Available Photos: ${photoUrls.length}

Selection Criteria (in order of priority):
1. Variety: Mix of landscapes, people, food, activities
2. Quality: Clear, well-composed, visually appealing
3. Story: Photos that tell the trip story
4. Engagement: Photos that spark curiosity

Respond with ONLY comma-separated photo indices (0-based). Example: "0,3,7,12"
Select exactly ${limit} photo(s).`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: 'You are a professional photo curator specializing in social media engagement.',
                    },
                    {
                        role: 'user',
                        content: prompt,
                    },
                ],
                temperature: 0.3,
                max_tokens: 50,
            }),
        });

        if (response.ok) {
            const result = await response.json();
            if (result.choices && result.choices.length > 0 && result.choices[0]?.message?.content) {
                const indices = result.choices[0].message.content
                    .trim()
                    .split(',')
                    .map((idx: string) => parseInt(idx.trim()))
                    .filter((idx: number) => !isNaN(idx) && idx >= 0 && idx < photoUrls.length)
                    .slice(0, limit);

                if (indices.length > 0) {
                    return indices.map((idx: number) => photoUrls[idx]);
                }
            } else {
                console.warn('Unexpected response structure in photo analysis:', result);
            }
        }
    } catch (error) {
        console.error('Photo analysis error:', error);
    }

    // Fallback: intelligent sampling
    if (limit === 1) {
        // Pick middle photo (usually best quality)
        return [photoUrls[Math.floor(photoUrls.length / 2)]];
    }

    // For multiple photos: evenly distribute across the collection
    const step = Math.floor(photoUrls.length / limit);
    const selected: string[] = [];
    for (let i = 0; i < limit; i++) {
        selected.push(photoUrls[i * step]);
    }
    return selected;
}

/**
 * Generate photo arrangement instructions based on platform
 */
function generatePhotoArrangement(platform: string, photoCount: number): string {
    if (photoCount === 1) {
        return '📸 Single impactful photo - use as-is';
    }

    const arrangements: Record<string, Record<number, string>> = {
        instagram_carousel: {
            2: '📸 Photo 1: Opening shot (landscape/wide) → Photo 2: Detail/close-up',
            3: '📸 1: Landscape → 2: Activity/people → 3: Food/detail',
            4: '📸 1: Hero shot → 2-3: Supporting photos → 4: Closing shot',
            5: '📸 1: Hero → 2: People → 3: Food → 4: Landscape → 5: Detail',
            10: '📸 Start with landscape, alternate between wide & close shots, end with memorable moment',
        },
        facebook_post: {
            2: '📸 Collage: Side-by-side comparison or before/after',
            3: '📸 Collage: Triangle layout - 1 large + 2 small',
            4: '📸 Grid: 2x2 layout for balanced storytelling',
            10: '📸 Gallery: Chronological order showing trip progression',
        },
    };

    const platformArrangements = arrangements[platform] || arrangements['instagram_carousel'];
    return platformArrangements[photoCount] || platformArrangements[10] || '📸 Standard grid layout';
}
