import { v } from "convex/values";
import { query, mutation, action, internalMutation, internalQuery } from "./_generated/server";
import { internal, api } from "./_generated/api";

// ============ WEATHER API INTEGRATION ============

/**
 * Fetch weather forecast from OpenWeatherMap API and cache it
 * Free tier: 1,000 calls/day, updates every 10 minutes
 */
export const fetchWeatherForecast = action({
    args: {
        location: v.string(), // City name or "lat,lon"
        country: v.optional(v.string()), // Country code (optional)
    },
    handler: async (ctx, args) => {
        const apiKey = process.env.OPENWEATHER_API_KEY;
        if (!apiKey) {
            throw new Error('OpenWeatherMap API key not configured. Add OPENWEATHER_API_KEY to environment variables.');
        }

        try {
            // First, get coordinates from location name (Geocoding API)
            let lat: number, lon: number;
            
            if (args.location.includes(',')) {
                // Already in "lat,lon" format
                const [latStr, lonStr] = args.location.split(',');
                lat = parseFloat(latStr);
                lon = parseFloat(lonStr);
            } else {
                // Geocode city name to coordinates
                const geocodeQuery = args.country 
                    ? `${args.location},${args.country}` 
                    : args.location;
                
                const geocodeUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(geocodeQuery)}&limit=1&appid=${apiKey}`;
                const geocodeResponse = await fetch(geocodeUrl);
                
                if (!geocodeResponse.ok) {
                    throw new Error(`Geocoding failed: ${geocodeResponse.statusText}`);
                }
                
                const geocodeData = await geocodeResponse.json();
                
                if (!geocodeData || geocodeData.length === 0) {
                    throw new Error(`Location not found: ${args.location}`);
                }
                
                lat = geocodeData[0].lat;
                lon = geocodeData[0].lon;
            }

            // Fetch weather forecast using One Call API 3.0
            const weatherUrl = `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
            const weatherResponse = await fetch(weatherUrl);

            if (!weatherResponse.ok) {
                // Fallback to free 2.5 API if 3.0 fails
                const fallbackUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
                const fallbackResponse = await fetch(fallbackUrl);
                
                if (!fallbackResponse.ok) {
                    throw new Error(`Weather API failed: ${fallbackResponse.statusText}`);
                }
                
                const fallbackData = await fallbackResponse.json();
                return await processFallbackWeatherData(ctx, args.location, fallbackData);
            }

            const weatherData = await weatherResponse.json();

            // Save to database
            const weatherForecast = {
                location: args.location,
                country: args.country,
                current: {
                    temp: Math.round(weatherData.current.temp),
                    feelsLike: Math.round(weatherData.current.feels_like),
                    description: weatherData.current.weather[0].description,
                    icon: weatherData.current.weather[0].icon,
                    humidity: weatherData.current.humidity,
                    windSpeed: weatherData.current.wind_speed,
                    sunrise: weatherData.current.sunrise,
                    sunset: weatherData.current.sunset,
                },
                daily: weatherData.daily.slice(0, 7).map((day: any) => ({
                    date: day.dt,
                    tempMin: Math.round(day.temp.min),
                    tempMax: Math.round(day.temp.max),
                    description: day.weather[0].description,
                    icon: day.weather[0].icon,
                    pop: day.pop, // Probability of precipitation
                    humidity: day.humidity,
                    windSpeed: day.wind_speed,
                })),
                alerts: weatherData.alerts?.map((alert: any) => ({
                    event: alert.event,
                    description: alert.description,
                    start: alert.start,
                    end: alert.end,
                })) || [],
                lastUpdated: Date.now(),
            };

            // Save to database (upsert)
            await ctx.runMutation(internal.weather.saveWeatherForecast, weatherForecast);

            return weatherForecast;
        } catch (error: any) {
            console.error('Weather fetch error:', error);
            throw new Error(`Failed to fetch weather: ${error.message}`);
        }
    },
});

/**
 * Process fallback weather data from free 2.5 API
 */
async function processFallbackWeatherData(ctx: any, location: string, data: any) {
    const now = Date.now() / 1000;
    const dailyForecasts: any[] = [];
    
    // Group forecasts by day (data comes in 3-hour intervals)
    const dayGroups: { [key: string]: any[] } = {};
    
    data.list.forEach((forecast: any) => {
        const date = new Date(forecast.dt * 1000);
        const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        
        if (!dayGroups[dayKey]) {
            dayGroups[dayKey] = [];
        }
        dayGroups[dayKey].push(forecast);
    });
    
    // Get first 7 days
    Object.keys(dayGroups).slice(0, 7).forEach(dayKey => {
        const forecasts = dayGroups[dayKey];
        const temps = forecasts.map((f: any) => f.main.temp);
        const pops = forecasts.map((f: any) => f.pop || 0);
        
        dailyForecasts.push({
            date: forecasts[0].dt,
            tempMin: Math.round(Math.min(...temps)),
            tempMax: Math.round(Math.max(...temps)),
            description: forecasts[Math.floor(forecasts.length / 2)].weather[0].description,
            icon: forecasts[Math.floor(forecasts.length / 2)].weather[0].icon,
            pop: Math.max(...pops),
            humidity: forecasts[0].main.humidity,
            windSpeed: forecasts[0].wind.speed,
        });
    });
    
    const weatherForecast = {
        location,
        current: {
            temp: Math.round(data.list[0].main.temp),
            feelsLike: Math.round(data.list[0].main.feels_like),
            description: data.list[0].weather[0].description,
            icon: data.list[0].weather[0].icon,
            humidity: data.list[0].main.humidity,
            windSpeed: data.list[0].wind.speed,
            sunrise: data.city.sunrise,
            sunset: data.city.sunset,
        },
        daily: dailyForecasts,
        alerts: [],
        lastUpdated: Date.now(),
    };
    
    await ctx.runMutation(internal.weather.saveWeatherForecast, weatherForecast);
    return weatherForecast;
}

/**
 * Save/update weather forecast in database (internal mutation)
 */
export const saveWeatherForecast = internalMutation({
    args: {
        location: v.string(),
        country: v.optional(v.string()),
        current: v.object({
            temp: v.number(),
            feelsLike: v.number(),
            description: v.string(),
            icon: v.string(),
            humidity: v.number(),
            windSpeed: v.number(),
            sunrise: v.number(),
            sunset: v.number(),
        }),
        daily: v.array(v.object({
            date: v.number(),
            tempMin: v.number(),
            tempMax: v.number(),
            description: v.string(),
            icon: v.string(),
            pop: v.number(),
            humidity: v.number(),
            windSpeed: v.number(),
        })),
        alerts: v.array(v.object({
            event: v.string(),
            description: v.string(),
            start: v.number(),
            end: v.number(),
        })),
        lastUpdated: v.number(),
    },
    handler: async (ctx, args) => {
        // Check if forecast exists
        const existing = await ctx.db
            .query('WeatherForecasts')
            .withIndex('by_location', (q) => q.eq('location', args.location))
            .first();

        if (existing) {
            // Update existing forecast
            await ctx.db.patch(existing._id, args);
            return existing._id;
        } else {
            // Create new forecast
            return await ctx.db.insert('WeatherForecasts', args);
        }
    },
});

/**
 * Get cached weather forecast (query)
 * Returns cached data if less than 1 hour old, otherwise null
 */
export const getWeatherForecast = query({
    args: {
        location: v.string(),
    },
    handler: async (ctx, args) => {
        const forecast = await ctx.db
            .query('WeatherForecasts')
            .withIndex('by_location', (q) => q.eq('location', args.location))
            .first();

        if (!forecast) return null;

        // Check if cache is still valid (1 hour = 3600000 ms)
        const cacheAge = Date.now() - forecast.lastUpdated;
        const maxCacheAge = 60 * 60 * 1000; // 1 hour

        if (cacheAge > maxCacheAge) {
            return null; // Cache expired, need to refetch
        }

        return forecast;
    },
});

/**
 * Get or fetch weather forecast
 * Checks cache first, fetches from API if needed
 */
export const getOrFetchWeather = action({
    args: {
        location: v.string(),
        country: v.optional(v.string()),
    },
    handler: async (ctx, args): Promise<any> => {
        // Check cache first using query
        const forecast = await ctx.runQuery(api.weather.getWeatherForecast, {
            location: args.location,
        });

        if (forecast) {
            // Cache is valid
            return forecast;
        }

        // Cache miss or expired, fetch new data
        const newForecast = await ctx.runAction(api.weather.fetchWeatherForecast, {
            location: args.location,
            country: args.country,
        });

        return newForecast;
    },
});

/**
 * Get weather-based packing suggestions
 */
export const getPackingSuggestions = query({
    args: {
        location: v.string(),
    },
    handler: async (ctx, args) => {
        const forecast = await ctx.db
            .query('WeatherForecasts')
            .withIndex('by_location', (q) => q.eq('location', args.location))
            .first();

        if (!forecast) {
            return {
                suggestions: ['Check weather forecast closer to your trip date'],
                needsUpdate: true,
            };
        }

        const suggestions: string[] = [];
        const daily = forecast.daily;

        // Analyze weather patterns
        const avgTemp = daily.reduce((sum, d) => sum + (d.tempMax + d.tempMin) / 2, 0) / daily.length;
        const maxTemp = Math.max(...daily.map(d => d.tempMax));
        const minTemp = Math.min(...daily.map(d => d.tempMin));
        const rainyDays = daily.filter(d => d.pop > 0.3).length;
        const highHumidity = daily.some(d => d.humidity > 80);

        // Temperature-based suggestions
        if (avgTemp < 10) {
            suggestions.push('🧥 Pack warm winter clothing (coat, gloves, scarf)');
            suggestions.push('🥾 Bring insulated boots');
        } else if (avgTemp < 20) {
            suggestions.push('🧥 Pack light jacket or sweater for cooler evenings');
            suggestions.push('👖 Bring long pants and layers');
        } else if (avgTemp > 30) {
            suggestions.push('☀️ Pack light, breathable clothing');
            suggestions.push('🕶️ Bring sunscreen, hat, and sunglasses');
            suggestions.push('💧 Stay hydrated - carry water bottle');
        } else {
            suggestions.push('👕 Pack comfortable, versatile clothing');
        }

        // Rain suggestions
        if (rainyDays >= 3) {
            suggestions.push('☔ Pack umbrella and rain jacket');
            suggestions.push('👟 Bring waterproof shoes');
        } else if (rainyDays > 0) {
            suggestions.push('🌂 Consider bringing a light rain jacket');
        }

        // Humidity suggestions
        if (highHumidity) {
            suggestions.push('💨 Pack quick-dry, moisture-wicking fabrics');
        }

        // Temperature variation suggestions
        if (maxTemp - minTemp > 15) {
            suggestions.push('🌡️ Temperature varies significantly - pack layers!');
        }

        // Check for weather alerts
        if (forecast.alerts && forecast.alerts.length > 0) {
            forecast.alerts.forEach(alert => {
                if (alert.event.toLowerCase().includes('heat')) {
                    suggestions.push('🔥 Heat alert! Stay cool and hydrated');
                } else if (alert.event.toLowerCase().includes('storm')) {
                    suggestions.push('⛈️ Storm warning! Plan indoor activities');
                } else if (alert.event.toLowerCase().includes('snow')) {
                    suggestions.push('❄️ Snow expected! Pack winter gear');
                }
            });
        }

        return {
            suggestions,
            needsUpdate: false,
            avgTemp: Math.round(avgTemp),
            rainyDays,
        };
    },
});

/**
 * Clean up old weather forecasts (older than 7 days)
 * Should be called by scheduled function
 */
export const cleanupOldForecasts = internalMutation({
    args: {},
    handler: async (ctx) => {
        const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
        
        const oldForecasts = await ctx.db
            .query('WeatherForecasts')
            .withIndex('by_updated', (q) => q.lt('lastUpdated', sevenDaysAgo))
            .collect();

        for (const forecast of oldForecasts) {
            await ctx.db.delete(forecast._id);
        }

        return { deleted: oldForecasts.length };
    },
});
