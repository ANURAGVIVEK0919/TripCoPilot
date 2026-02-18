import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
    const { placeName } = await req.json();
    const OLA_API_KEY = process.env.OLA_MAPS_API_KEY;

    // Return placeholder immediately if no API key or no place name
    if (!OLA_API_KEY || !placeName) {
        console.warn("Ola Maps API Key is not configured or no place name provided.");
        return NextResponse.json('/placeholder.jpg');
    }

    try {
        // ## Step 1: Use Text Search API with timeout
        const textSearchUrl = `https://api.olakrutrim.com/places/v1/text-search?input=${encodeURIComponent(placeName)}&api_key=${OLA_API_KEY}`;

        // Add timeout to prevent hanging
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

        const searchResponse = await fetch(textSearchUrl, {
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!searchResponse.ok) {
            console.warn(`Ola Maps API returned status ${searchResponse.status} for "${placeName}"`);
            return NextResponse.json('/placeholder.jpg');
        }

        const searchData = await searchResponse.json();

        if (searchData.status !== 'OK' || !searchData.results || searchData.results.length === 0) {
            console.warn(`Ola Maps: No results found for "${placeName}"`);
            return NextResponse.json('/placeholder.jpg');
        }

        const placeId = searchData.results[0].place_id;

        // ## Step 2: Construct the Photo URL
        const photoUrl = `https://api.olakrutrim.com/places/v1/photo?place_id=${placeId}&maxwidth=1000&api_key=${OLA_API_KEY}`;

        return NextResponse.json(photoUrl);

    } catch (error: any) {
        // Handle network errors, timeouts, or API issues gracefully
        if (error.name === 'AbortError') {
            console.warn(`Ola Maps API timeout for "${placeName}"`);
        } else if (error.code === 'ENOTFOUND') {
            console.warn(`Ola Maps API unreachable (DNS error) for "${placeName}"`);
        } else {
            console.warn(`Ola Maps API Error for "${placeName}":`, error.message);
        }
        
        // Return placeholder instead of error
        return NextResponse.json('/placeholder.jpg');
    }
}