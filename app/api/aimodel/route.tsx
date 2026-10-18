
export const maxDuration =60;
import { NextRequest, NextResponse } from "next/server";


import { auth, currentUser } from "@clerk/nextjs/server";
import { openai } from "@/utils/openai";
import { aj } from "@/utils/arcjet";



const PROMPT = `You are TripCoPilot, a helpful AI travel assistant. Your goal is to help the user plan a trip by **asking one relevant trip-related question at a time**.

Only ask questions about the following details in order, and wait for the user's answer before asking the next:

1. Starting location (source) 
2. Destination city or country 
3. Group size (Solo, Couple, Family, Friends) 
4. Budget (Low, Medium, High) 
5. Trip duration (number of days)  
6. Special requirements or preferences (if any)
Do not ask multiple questions at once, and never ask irrelevant questions.
If any answer is missing or unclear, politely ask the user to clarify before proceeding.
Always maintain a conversational, interactive style while asking questions.

CRITICAL INSTRUCTION FOR EVERY RESPONSE:
You MUST ALWAYS return a strict JSON response on EVERY turn (no markdown outside JSON, no introductory commentary).
The JSON response must strictly follow this JSON schema format:
{
  "resp": "Conversational question or response to the user",
  "ui": null
}

The "ui" field must be either null or one of the following exact string values:
- "groupSize": when asking the user for their group size (Solo, Couple, Family, Friends)
- "budget": when asking the user for their budget (Low, Medium, High)
- "tripDuration": when asking the user for trip duration / number of days
- "final": when all required information has been collected, informing the user that trip generation will begin
- null: when asking open-ended questions like source, destination, special preferences, or clarifying answers
`

const FINAL_PROMPT = `Generate Travel Plan with given details. You will receive:
1. User's trip preferences (destination, duration, budget, group size)
2. **EXISTING BOOKINGS** (flights, hotels, restaurants, tours) - if any

**CRITICAL INSTRUCTIONS FOR BOOKING INTEGRATION:**
- If EXISTING BOOKINGS are provided, you MUST place them in the itinerary at their scheduled times
- Build the daily schedule AROUND these bookings (don't overlap or conflict)
- Fill gaps between bookings with AI-generated activities
- Respect booking times exactly (flight departures, hotel check-ins, restaurant reservations, etc.)
- Consider travel time between activities and bookings
- If a flight arrives at 2 PM, schedule activities for afternoon/evening only
- If hotel checkout is 11 AM, plan morning activities before checkout
- Restaurant reservations are FIXED time slots - schedule activities before/after

**OUTPUT REQUIREMENTS:**
Give me Hotels options list with HotelName, Hotel address, Price, hotel image url, geo coordinates, rating, descriptions 
AND suggest itinerary with placeName, Place Details, Place Image Url, Geo Coordinates, Place address, ticket Pricing, 
Time travel each of the location, with each day plan with best time to visit in JSON format.

**CRITICAL IMAGE URL INSTRUCTIONS:**
You MUST use ONLY these verified working Unsplash URLs for images. Pick the most relevant one based on the place type:

HOTELS & ACCOMMODATIONS:
- https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80 (luxury hotel lobby)
- https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80 (hotel exterior)
- https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800&q=80 (hotel room)
- https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800&q=80 (hotel pool)
- https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80 (modern hotel)

TEMPLES & RELIGIOUS SITES:
- https://images.unsplash.com/photo-1548013146-72479768bada?w=800&q=80 (Japanese temple)
- https://images.unsplash.com/photo-1528360983277-13d401cdc186?w=800&q=80 (Asian temple)
- https://images.unsplash.com/photo-1545569341-9eb8b30979d9?w=800&q=80 (temple interior)

BEACHES & COASTAL:
- https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80 (tropical beach)
- https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80 (beach sunset)
- https://images.unsplash.com/photo-1506953823976-52e1fdc0149a?w=800&q=80 (beach coastline)

CITIES & URBAN:
- https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&q=80 (Tokyo cityscape)
- https://images.unsplash.com/photo-1549693578-d683be217e58?w=800&q=80 (Tokyo night)
- https://images.unsplash.com/photo-1513407030348-c983a97b98d8?w=800&q=80 (Tokyo street)
- https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&q=80 (Paris)
- https://images.unsplash.com/photo-1499856871958-5b9627545d1a?w=800&q=80 (Paris landmark)
- https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&q=80 (New York)

MUSEUMS & CULTURAL:
- https://images.unsplash.com/photo-1564399579883-451a5d44ec08?w=800&q=80 (museum interior)
- https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=800&q=80 (art gallery)
- https://images.unsplash.com/photo-1569014456891-a0294e6ce0af?w=800&q=80 (museum exhibition)

PARKS & GARDENS:
- https://images.unsplash.com/photo-1585320806297-9794b3e4eeae?w=800&q=80 (Japanese garden)
- https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&q=80 (park landscape)
- https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800&q=80 (cherry blossoms)

SHOPPING & MARKETS:
- https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?w=800&q=80 (shopping street)
- https://images.unsplash.com/photo-1564759298141-cef86f51d4d4?w=800&q=80 (market)
- https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&q=80 (retail store)

MOUNTAINS & NATURE:
- https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80 (mountain landscape)
- https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&q=80 (mountain peak)
- https://images.unsplash.com/photo-1551632811-561732d1e306?w=800&q=80 (scenic nature)

RESTAURANTS & FOOD:
- https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80 (restaurant interior)
- https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80 (fine dining)

HISTORICAL SITES:
- https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&q=80 (historical building)
- https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=800&q=80 (castle/palace)

**RULES:**
- ONLY use URLs from the list above - DO NOT make up photo IDs
- Match the image type to the place category (temple → temple URL, hotel → hotel URL, etc.)
- You can reuse URLs if needed - it's better to reuse than create invalid URLs
- If a place doesn't fit any category above, use one of the generic city/nature URLs or use "PLACEHOLDER" as the URL value
- NEVER generate random photo IDs or use example.com

Output Schema:
 {
  "trip_plan": {
    "destination": "string",
    "duration": "string",
    "origin": "string",
    "budget": "string",
    "group_size": "string",
    "hotels": [
      {
        "hotel_name": "string",
        "hotel_address": "string",
        "price_per_night": "string",
        "hotel_image_url": "string",
        "geo_coordinates": {
          "latitude": "number",
          "longitude": "number"
        },
        "rating": "number",
        "description": "string"
      }
    ],
    "itinerary": [
      {
        "day": "number",
        "day_plan": "string",
        "best_time_to_visit_day": "string",
        "activities": [
          {
            "place_name": "string",
            "place_details": "string",
            "place_image_url": "string",
            "geo_coordinates": {
              "latitude": "number",
              "longitude": "number"
            },
            "place_address": "string",
            "ticket_pricing": "string",
            "time_travel_each_location": "string",
            "best_time_to_visit": "string"
          }
        ]
      }
    ]
  }
}`


export async function POST(req: NextRequest) {
  const { messages, isFinal, tripId } = await req.json();
  const user = await currentUser();
  
  // Check premium status from user's email or custom metadata
  const hasPremiumAccess = Boolean(
    user?.publicMetadata?.subscription === 'premium' ||
    user?.publicMetadata?.subscription === 'monthly'
  );

  console.log("=== AI MODEL API CALLED ===");
  console.log("Messages count:", Array.isArray(messages) ? messages.length : 0);
  console.log("Is Final:", Boolean(isFinal));
  console.log("Trip ID present:", Boolean(tripId));
  console.log("User authenticated:", Boolean(user?.id));
  console.log("hasPremiumAccess:", hasPremiumAccess);
  // Arcjet tokenBucket accounting:
  // Both intermediate turns and final generation deduct 1 token from the bucket.
  // The daily capacity is 30 tokens, supporting ~5 full trips per day (approx 6 requests per trip).
  const requestedTokens = 1;
  const decision = await aj.protect(req, {
    userId: user?.primaryEmailAddress?.emailAddress ?? 'anonymous',
    requested: requestedTokens,
  });

  console.log("Arcjet decision conclusion:", decision.conclusion);

  //@ts-ignore
  if (decision.isDenied() && !hasPremiumAccess) {
    console.log("❌ Credit limit reached");
    return NextResponse.json({
      resp: 'No Free Credit Remaining',
      ui: 'limit'
    })
  }

  //@ts-ignore
  if (decision.isErrored() && !hasPremiumAccess) {
    console.error("❌ Arcjet protection error:", decision.reason);
    // Explicit security check: if Arcjet encounters an internal/config error, do not fail silently
    return NextResponse.json(
      { error: "Security check failed. Please try again later." },
      { status: 429 }
    );
  }

  try {
    // Map messages to include UI context in content if present
    const cleanedMessages = messages.map((msg: any) => {
      let content = msg.content;
      // If this message had a UI component, add it as context
      if (msg.ui) {
        content = `${msg.content}\n[UI Component Shown: ${msg.ui}]`;
      }
      return {
        role: msg.role,
        content: content
      };
    });

    // Fetch existing bookings if generating final itinerary
    let bookingsContext = '';
    if (isFinal && tripId) {
      try {
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
        if (convexUrl) {
          const response = await fetch(`${convexUrl}/api/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              path: 'customBookings:getBookingsForItineraryGeneration',
              args: { tripId }
            })
          });
          
          const bookings = await response.json();
          
          if (bookings && bookings.length > 0) {
            bookingsContext = `\n\n**EXISTING BOOKINGS TO INTEGRATE:**\n${JSON.stringify(bookings, null, 2)}\n\nIMPORTANT: Place these bookings at their scheduled times in the itinerary. Build activities around them.\n`;
            console.log('📅 Found bookings to integrate:', bookings.length);
          }
        }
      } catch (error) {
        console.error('⚠️ Error fetching bookings:', error);
        // Continue without bookings if fetch fails
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: (isFinal ? FINAL_PROMPT : PROMPT) + bookingsContext
        },
        ...cleanedMessages
      ],
    });
    if (!completion.choices || completion.choices.length === 0 || !completion.choices[0]?.message) {
      throw new Error("Invalid or empty response from OpenAI/Groq API");
    }
    console.log("✅ AI Response received successfully (choices count:", completion.choices.length, ")");
    const message = completion.choices[0].message;
    const rawContent = message.content?.trim() ?? '{}';
    const cleanedContent = rawContent.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/\s*```$/, '');
    return NextResponse.json(JSON.parse(cleanedContent));
  }
  catch (e: any) {
    console.error("❌ AI API Error status:", e?.status, "code:", e?.error?.code ?? e?.code);
    if (e?.error?.failed_generation) {
      const snippet = typeof e.error.failed_generation === 'string'
        ? e.error.failed_generation.slice(0, 150)
        : JSON.stringify(e.error.failed_generation).slice(0, 150);
      console.error("❌ Groq failed_generation diagnostic:", snippet);
    }
    const status = typeof e?.status === 'number' && e.status >= 400 && e.status < 600 ? e.status : 500;
    return NextResponse.json(
      { error: "Failed to generate AI response. Please try again." },
      { status }
    );
  }
}