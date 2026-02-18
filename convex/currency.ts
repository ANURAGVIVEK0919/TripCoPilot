import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Cache currency rates to avoid excessive API calls
export const getCurrencyRates = query({
    args: { baseCurrency: v.string() },
    handler: async (ctx, args) => {
        // Check if we have cached rates (less than 6 hours old)
        const cached = await ctx.db.query('CurrencyRates')
            .withIndex('by_base', q => q.eq('baseCurrency', args.baseCurrency))
            .first();

        const sixHoursAgo = Date.now() - (6 * 60 * 60 * 1000);

        if (cached && cached.lastUpdated > sixHoursAgo) {
            return cached.rates;
        }

        // Return null if no cached data (client will fetch from API)
        return null;
    }
});

// Update cached currency rates
export const updateCurrencyRates = mutation({
    args: {
        baseCurrency: v.string(),
        rates: v.any(),
    },
    handler: async (ctx, args) => {
        // Check if rates already exist
        const existing = await ctx.db.query('CurrencyRates')
            .withIndex('by_base', q => q.eq('baseCurrency', args.baseCurrency))
            .first();

        const now = Date.now();

        if (existing) {
            await ctx.db.patch(existing._id, {
                rates: args.rates,
                lastUpdated: now,
            });
        } else {
            await ctx.db.insert('CurrencyRates', {
                baseCurrency: args.baseCurrency,
                rates: args.rates,
                lastUpdated: now,
            });
        }

        return { success: true };
    }
});

// Convert amount between currencies
export const convertCurrency = query({
    args: {
        amount: v.number(),
        fromCurrency: v.string(),
        toCurrency: v.string(),
    },
    handler: async (ctx, args) => {
        if (args.fromCurrency === args.toCurrency) {
            return args.amount;
        }

        // Get rates from cache
        const rates = await ctx.db.query('CurrencyRates')
            .withIndex('by_base', q => q.eq('baseCurrency', args.fromCurrency))
            .first();

        if (!rates || !rates.rates[args.toCurrency]) {
            return null; // Client should fetch from API
        }

        return args.amount * rates.rates[args.toCurrency];
    }
});
