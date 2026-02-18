import { NextRequest, NextResponse } from "next/server";

// Free currency conversion API
// Using exchangerate-api.com (1500 requests/month free)
const API_KEY = process.env.CURRENCY_API_KEY || 'demo'; // Add your API key in .env

export async function POST(req: NextRequest) {
    try {
        const { amount, from, to } = await req.json();

        console.log('Currency conversion request:', { amount, from, to });

        // If same currency, return as-is
        if (from === to) {
            return NextResponse.json({ 
                success: true,
                convertedAmount: amount,
                rate: 1,
                from,
                to 
            });
        }

        // Fetch conversion rate
        const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${API_KEY}/pair/${from}/${to}/${amount}`
        );

        if (!response.ok) {
            throw new Error('Currency API error');
        }

        const data = await response.json();

        if (data.result === 'success') {
            return NextResponse.json({
                success: true,
                convertedAmount: data.conversion_result,
                rate: data.conversion_rate,
                from,
                to,
                lastUpdated: data.time_last_update_utc,
            });
        } else {
            throw new Error(data['error-type'] || 'Conversion failed');
        }
    } catch (error: any) {
        console.error('Currency conversion error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to convert currency' 
            },
            { status: 500 }
        );
    }
}

// Get all exchange rates for a base currency
export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const baseCurrency = searchParams.get('base') || 'USD';

        console.log('Fetching exchange rates for:', baseCurrency);

        const response = await fetch(
            `https://v6.exchangerate-api.com/v6/${API_KEY}/latest/${baseCurrency}`
        );

        if (!response.ok) {
            throw new Error('Currency API error');
        }

        const data = await response.json();

        if (data.result === 'success') {
            return NextResponse.json({
                success: true,
                baseCurrency,
                rates: data.conversion_rates,
                lastUpdated: data.time_last_update_utc,
            });
        } else {
            throw new Error(data['error-type'] || 'Failed to fetch rates');
        }
    } catch (error: any) {
        console.error('Currency rates fetch error:', error);
        return NextResponse.json(
            { 
                success: false, 
                error: error.message || 'Failed to fetch exchange rates' 
            },
            { status: 500 }
        );
    }
}
