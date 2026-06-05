import { mutation } from "./_generated/server";

/**
 * Seed mutation — inserts featured traveler profiles, their travel stories,
 * and local insider tips into the database.
 *
 * Run once from the Convex dashboard or via `npx convex run seedFeaturedTravelers:seedAll`
 * It is idempotent: checks for existing entries before inserting to avoid duplicates.
 */
export const seedAll = mutation({
    args: {},
    handler: async (ctx) => {

        const now = Date.now();

        // ─── 1. Upsert Users ──────────────────────────────────────────────────

        const usersData = [
            {
                name: "Sofia Reyes",
                email: "sofia.reyes@featuredtraveler.com",
                imageUrl: "/traveler_sofia.png",
            },
            {
                name: "Marcus Chen",
                email: "marcus.chen@featuredtraveler.com",
                imageUrl: "/traveler_marcus.png",
            },
            {
                name: "Aiko Tanaka",
                email: "aiko.tanaka@featuredtraveler.com",
                imageUrl: "/traveler_aiko.png",
            },
        ];

        const userIds: Record<string, any> = {};

        for (const u of usersData) {
            // Check if user already exists by email to stay idempotent
            const existing = await ctx.db
                .query("UserTable")
                .filter((q) => q.eq(q.field("email"), u.email))
                .first();

            if (existing) {
                userIds[u.email] = existing._id;
            } else {
                const id = await ctx.db.insert("UserTable", {
                    name: u.name,
                    email: u.email,
                    imageUrl: u.imageUrl,
                });
                userIds[u.email] = id;
            }
        }

        const sofiaId  = userIds["sofia.reyes@featuredtraveler.com"];
        const marcusId = userIds["marcus.chen@featuredtraveler.com"];
        const aikoId   = userIds["aiko.tanaka@featuredtraveler.com"];

        // ─── 2. Seed Community Stories ────────────────────────────────────────

        const stories = [
            {
                title: "Lost in the Bamboo Groves of Arashiyama",
                destination: "Kyoto, Japan",
                imageUrl: "/story_kyoto.png",
                images: ["/story_kyoto.png"],
                content: "I arrived at Arashiyama at 5:30 AM — before the tour buses, before the crowds. The bamboo towered overhead like a cathedral, sunlight cutting through in thin golden shafts. A local monk told me the secret: arrive at dawn, walk the lesser-known Jojakko-ji trail instead of the main path, and you'll have it almost entirely to yourself. The silence is something you carry home with you.",
                userId: sofiaId,
                userName: "Sofia Reyes",
                userImage: "/traveler_sofia.png",
            },
            {
                title: "A Week in the Medina: Marrakech Unfiltered",
                destination: "Marrakech, Morocco",
                imageUrl: "/story_morocco.png",
                images: ["/story_morocco.png"],
                content: "Forget what Instagram shows you. The real Marrakech is the sound of hammers on copper at 7 AM, the smell of cumin and rose water drifting through dusty alleyways, bargaining with a vendor who ends up inviting you for mint tea. I got hopelessly lost three times and each time stumbled onto something extraordinary — a hidden courtyard, a century-old pharmacy, a rooftop café no guidebook mentions.",
                userId: sofiaId,
                userName: "Sofia Reyes",
                userImage: "/traveler_sofia.png",
            },
            {
                title: "Santorini on $60 a Day: It's Actually Possible",
                destination: "Santorini, Greece",
                imageUrl: "/story_santorini.png",
                images: ["/story_santorini.png"],
                content: "Everyone told me Santorini would bankrupt me. They weren't entirely wrong — but I found a way. I stayed in a guesthouse in Pyrgos village instead of Oia, rented a scooter instead of taxis, ate at family tavernas set back from the caldera. Total cost? Under €55/day. And the sunsets from Skaros Rock? Identical to the ones in Oia, minus 300 other phones in your shot.",
                userId: marcusId,
                userName: "Marcus Chen",
                userImage: "/traveler_marcus.png",
            },
        ];

        for (const s of stories) {
            // Idempotency: skip if story with same title already exists
            const existing = await ctx.db
                .query("CommunityStories")
                .filter((q) => q.eq(q.field("title"), s.title))
                .first();

            if (!existing) {
                await ctx.db.insert("CommunityStories", {
                    title: s.title,
                    content: s.content,
                    imageUrl: s.imageUrl,
                    images: s.images,
                    destination: s.destination,
                    userId: s.userId,
                    userName: s.userName,
                    userImage: s.userImage,
                    likes: [],
                    createdAt: now,
                });
            }
        }

        // ─── 3. Seed Insider Tips ─────────────────────────────────────────────

        const tips = [
            {
                destination: "Kyoto, Japan",
                category: "food" as const,
                title: "Skip the Tourist Ramen, Find the Real Stuff",
                content: "Nishiki Market at lunch is elbow-to-elbow tourists. Instead, head to Fushimi district around 7 PM — tiny ramen shops run by retired salarymen who barely speak English but will beam with pride watching you slurp their broth. Look for the red lantern and handwritten menu. Cash only, seats 8 people, no reservation needed.",
                specificLocation: "Fushimi District, Kyoto",
                priceRange: "budget" as const,
                bestTime: "Weekday evenings 6–9 PM",
                tags: ["ramen", "local", "hidden gem"],
                userId: sofiaId,
                userName: "Sofia Reyes",
                userImage: "/traveler_sofia.png",
                isVerifiedLocal: true,
            },
            {
                destination: "Marrakech, Morocco",
                category: "hidden_gems" as const,
                title: "The Secret Rooftop the Locals Love",
                content: "Café des Épices in Djemaa el-Fna is full of tourists. Go instead to Café Kessabine on Rue Bab Doukkala — unmarked door, steep stairs, but the rooftop gives you a 360° view of the medina. Order the kefta tagine. They'll make you traditional Berber tea while you watch the sun set over the minarets. Magic.",
                specificLocation: "Rue Bab Doukkala, Medina",
                priceRange: "moderate" as const,
                bestTime: "Sunset (6–7:30 PM)",
                tags: ["rooftop", "sunset", "authentic"],
                userId: sofiaId,
                userName: "Sofia Reyes",
                userImage: "/traveler_sofia.png",
                isVerifiedLocal: false,
            },
            {
                destination: "Santorini, Greece",
                category: "budget" as const,
                title: "The €3 Gyro That Beats Every Restaurant in Oia",
                content: "Walk 10 minutes from the main Fira square to a blue painted shop called Nikolas. No view, plastic chairs, run by the same family since 1950. Order the pork gyro with extra tzatziki. Locals queue here at midnight. Meanwhile tourists pay €45 for the same food with a view. Spend that saving on a sailing trip to the volcano instead — totally worth it.",
                specificLocation: "Fira, near the bus station",
                priceRange: "budget" as const,
                bestTime: "Anytime — always fresh",
                tags: ["gyro", "budget", "locals favourite"],
                userId: marcusId,
                userName: "Marcus Chen",
                userImage: "/traveler_marcus.png",
                isVerifiedLocal: false,
            },
            {
                destination: "Santorini, Greece",
                category: "activities" as const,
                title: "Best Spot for the Iconic Oia Sunset (Without the Crowd)",
                content: "Everyone packs onto the Oia Castle ruins for sunset. Arrive 1.5 hours early or skip it entirely. Instead, walk to Imerovigli — 40 minutes south of Oia by the cliff path — and watch from Skaros Rock promontory. You get the exact same view of windmills and caldera, without a soul around. Golden hour hits around 8:15 PM in summer.",
                specificLocation: "Skaros Rock, Imerovigli",
                priceRange: "free" as const,
                bestTime: "Arrive by 7 PM in summer",
                tags: ["photography", "sunset", "uncrowded"],
                userId: marcusId,
                userName: "Marcus Chen",
                userImage: "/traveler_marcus.png",
                isVerifiedLocal: false,
            },
            {
                destination: "Kyoto, Japan",
                category: "cultural" as const,
                title: "Onsen Etiquette: Don't Be That Tourist",
                content: "Tattoos are still prohibited in most traditional onsen — call ahead. Always wash thoroughly at the provided stations before entering the bath. No swimwear. No phones or cameras ever. Tie your hair up. The onsen is a place of zen silence — speaking above a whisper is considered rude. Do this right and locals will bow to you with genuine respect.",
                specificLocation: "Any traditional ryokan onsen",
                priceRange: "moderate" as const,
                bestTime: "Early morning (6–8 AM) for empty baths",
                tags: ["onsen", "etiquette", "culture", "wellness"],
                userId: aikoId,
                userName: "Aiko Tanaka",
                userImage: "/traveler_aiko.png",
                isVerifiedLocal: true,
            },
            {
                destination: "Tokyo, Japan",
                category: "transport" as const,
                title: "The IC Card Trick Every Tokyo Local Knows",
                content: "Buy a Suica or Pasmo IC card at any station (¥500 refundable deposit). Load ¥3,000 and tap in/out of every train, bus, and even 7-Eleven. Fares are 10–20% cheaper than buying individual tickets. Works across Japan. When leaving, refund the remaining balance at any JR station — zero waste. Also works at vending machines and some taxis.",
                specificLocation: "Any JR station in Japan",
                priceRange: "budget" as const,
                bestTime: "First thing after landing",
                tags: ["transport", "IC card", "money saving", "essential"],
                userId: aikoId,
                userName: "Aiko Tanaka",
                userImage: "/traveler_aiko.png",
                isVerifiedLocal: true,
            },
        ];

        for (const t of tips) {
            // Idempotency: skip if tip with same title already exists
            const existing = await ctx.db
                .query("InsiderTips")
                .filter((q) => q.eq(q.field("title"), t.title))
                .first();

            if (!existing) {
                await ctx.db.insert("InsiderTips", {
                    destination: t.destination,
                    category: t.category,
                    title: t.title,
                    content: t.content,
                    specificLocation: t.specificLocation,
                    priceRange: t.priceRange,
                    bestTime: t.bestTime,
                    tags: t.tags,
                    userId: t.userId,
                    userName: t.userName,
                    userImage: t.userImage,
                    isVerifiedLocal: t.isVerifiedLocal,
                    helpfulVotes: [],
                    notHelpfulVotes: [],
                    bookmarkCount: 0,
                    createdAt: now,
                    updatedAt: now,
                });
            }
        }

        return {
            success: true,
            message: "Seeded 3 users, 3 stories, and 6 insider tips successfully.",
        };
    },
});
