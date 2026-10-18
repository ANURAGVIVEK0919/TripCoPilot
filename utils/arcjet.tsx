import arcjet, { tokenBucket } from "@arcjet/next";

export const aj = arcjet({
    key: process.env.ARCJET_KEY!, // Get your site key from https://app.arcjet.com
    rules: [
        // Create a token bucket rate limit. Other algorithms are supported.
        tokenBucket({
            mode: "LIVE", // will block requests. Use "DRY_RUN" to log only
            characteristics: ["userId"], // track requests by a custom user ID
            refillRate: 30, // refill 30 tokens per interval (allows ~5 full trips per day at ~6 requests/trip)
            interval: 86400, // 24 hours
            capacity: 30, // bucket maximum capacity of 30 tokens
        }),
    ],
});