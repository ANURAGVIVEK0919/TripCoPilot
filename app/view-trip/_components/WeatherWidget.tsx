'use client';

import React, { useState, useEffect } from 'react';
import { useAction, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Cloud, CloudRain, Sun, CloudSnow, Wind, Droplets, Sunrise, Sunset, Loader2, RefreshCw, ChevronDown, ChevronUp, Package } from 'lucide-react';

interface WeatherWidgetProps {
    destination: string;
    country?: string;
    tripId: string;
}

export default function WeatherWidget({ destination, country, tripId }: WeatherWidgetProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch weather from API
    const fetchWeather = useAction(api.weather.fetchWeatherForecast);
    
    // Get cached weather
    const cachedWeather = useQuery(api.weather.getWeatherForecast, { location: destination });
    
    // Get packing suggestions
    const packingSuggestions = useQuery(api.weather.getPackingSuggestions, { location: destination });

    // Auto-fetch weather on mount if not cached
    useEffect(() => {
        if (cachedWeather === null && destination) {
            handleRefreshWeather();
        }
    }, [cachedWeather, destination]);

    const handleRefreshWeather = async () => {
        setIsLoading(true);
        setError(null);
        
        try {
            await fetchWeather({ location: destination, country });
        } catch (err: any) {
            setError(err.message || 'Failed to fetch weather');
        } finally {
            setIsLoading(false);
        }
    };

    const getWeatherIcon = (icon: string, description: string) => {
        if (description.toLowerCase().includes('rain')) {
            return <CloudRain className="w-6 h-6 text-blue-500" />;
        } else if (description.toLowerCase().includes('snow')) {
            return <CloudSnow className="w-6 h-6 text-blue-300" />;
        } else if (description.toLowerCase().includes('cloud')) {
            return <Cloud className="w-6 h-6 text-gray-400" />;
        } else {
            return <Sun className="w-6 h-6 text-yellow-500" />;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp * 1000).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-center space-x-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Loading weather forecast...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-950 rounded-lg p-4 border border-red-200 dark:border-red-800">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-red-800 dark:text-red-200">Weather Unavailable</p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
                    </div>
                    <button
                        onClick={handleRefreshWeather}
                        className="p-2 hover:bg-red-100 dark:hover:bg-red-900 rounded-lg transition"
                    >
                        <RefreshCw className="w-4 h-4 text-red-600" />
                    </button>
                </div>
            </div>
        );
    }

    if (!cachedWeather) {
        return (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <button
                    onClick={handleRefreshWeather}
                    className="flex items-center justify-center w-full space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                >
                    <Cloud className="w-5 h-5" />
                    <span className="text-sm font-medium">Load Weather Forecast</span>
                </button>
            </div>
        );
    }

    const { current, daily, alerts } = cachedWeather;

    return (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border border-blue-200 dark:border-blue-800 overflow-hidden">
            {/* Header - Current Weather */}
            <div className="p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        {getWeatherIcon(current.icon, current.description)}
                        <div>
                            <div className="flex items-baseline space-x-2">
                                <span className="text-3xl font-bold text-gray-900 dark:text-white">
                                    {current.temp}°C
                                </span>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    Feels like {current.feelsLike}°C
                                </span>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mt-1">
                                {current.description}
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={handleRefreshWeather}
                            disabled={isLoading}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition"
                            title="Refresh weather"
                        >
                            <RefreshCw className={`w-4 h-4 text-blue-600 ${isLoading ? 'animate-spin' : ''}`} />
                        </button>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-2 hover:bg-blue-100 dark:hover:bg-blue-900 rounded-lg transition"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 text-blue-600" />
                            ) : (
                                <ChevronDown className="w-4 h-4 text-blue-600" />
                            )}
                        </button>
                    </div>
                </div>

                {/* Current Weather Details */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Humidity</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{current.humidity}%</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-blue-500" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Wind</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{current.windSpeed} m/s</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Sunrise className="w-4 h-4 text-orange-500" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sunrise</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(current.sunrise * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Sunset className="w-4 h-4 text-purple-500" />
                        <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Sunset</p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {new Date(current.sunset * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Weather Alerts */}
                {alerts && alerts.length > 0 && (
                    <div className="mt-4 p-3 bg-red-100 dark:bg-red-900 rounded-lg border border-red-300 dark:border-red-700">
                        <p className="text-sm font-medium text-red-800 dark:text-red-200 flex items-center">
                            <span className="mr-2">⚠️</span>
                            Weather Alert: {alerts[0].event}
                        </p>
                        <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                            {alerts[0].description.substring(0, 100)}...
                        </p>
                    </div>
                )}
            </div>

            {/* Expanded View - 7-Day Forecast */}
            {isExpanded && (
                <div className="border-t border-blue-200 dark:border-blue-800">
                    {/* 7-Day Forecast */}
                    <div className="p-4">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                            7-Day Forecast
                        </h4>
                        <div className="grid grid-cols-7 gap-2">
                            {daily.map((day, index) => (
                                <div
                                    key={index}
                                    className="bg-white dark:bg-gray-800 rounded-lg p-2 text-center border border-gray-200 dark:border-gray-700"
                                >
                                    <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                                        {index === 0 ? 'Today' : formatDate(day.date).split(',')[0]}
                                    </p>
                                    <div className="my-2 flex justify-center">
                                        {getWeatherIcon(day.icon, day.description)}
                                    </div>
                                    <div className="text-xs">
                                        <p className="font-semibold text-gray-900 dark:text-white">{day.tempMax}°</p>
                                        <p className="text-gray-500 dark:text-gray-400">{day.tempMin}°</p>
                                    </div>
                                    {day.pop > 0.3 && (
                                        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                            {Math.round(day.pop * 100)}% 💧
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Packing Suggestions */}
                    {packingSuggestions && !packingSuggestions.needsUpdate && (
                        <div className="p-4 bg-white dark:bg-gray-800 border-t border-blue-200 dark:border-blue-800">
                            <div className="flex items-center space-x-2 mb-3">
                                <Package className="w-4 h-4 text-purple-600" />
                                <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                                    Weather-Based Packing Tips
                                </h4>
                            </div>
                            <div className="space-y-2">
                                {packingSuggestions.suggestions.slice(0, 5).map((suggestion, index) => (
                                    <div
                                        key={index}
                                        className="flex items-start space-x-2 text-sm text-gray-700 dark:text-gray-300"
                                    >
                                        <span className="text-green-500 mt-0.5">✓</span>
                                        <span>{suggestion}</span>
                                    </div>
                                ))}
                            </div>
                            {packingSuggestions.avgTemp && (
                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                                    Average temperature: {packingSuggestions.avgTemp}°C
                                    {packingSuggestions.rainyDays > 0 && (
                                        <> • {packingSuggestions.rainyDays} rainy day{packingSuggestions.rainyDays > 1 ? 's' : ''}</>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Footer - Last Updated */}
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900 text-xs text-gray-600 dark:text-gray-400 text-center">
                Last updated: {new Date(cachedWeather.lastUpdated).toLocaleTimeString()}
            </div>
        </div>
    );
}
