import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { NextResponse } from "next/server";

const client = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const stories = await client.query(api.communityStories.getAllStories, {});
        return NextResponse.json({ success: true, count: stories.length, stories });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message });
    }
}
