/**
 * Trip Statistics Component
 * 
 * Displays real-time statistics about app usage
 * Features:
 * - Total trips created
 * - Unique destinations visited
 * - Active travelers
 * - Countries explored
 * 
 * @component
 */

"use client"

import React from 'react'
import { useQuery } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Users, MapPin, Globe2, Plane, TrendingUp, Calendar } from 'lucide-react'

export function TripStatistics() {
    // Fetch real-time statistics from Convex
    const stats = useQuery(api.tripDetail.getTripStatistics)

    const statisticsData = [
        {
            icon: <Plane className="w-8 h-8 text-blue-500" />,
            value: stats?.totalTrips || 0,
            label: "Trips Planned",
            color: "from-blue-500 to-blue-600"
        },
        {
            icon: <MapPin className="w-8 h-8 text-green-500" />,
            value: stats?.uniqueDestinations || 0,
            label: "Destinations",
            color: "from-green-500 to-green-600"
        },
        {
            icon: <Users className="w-8 h-8 text-purple-500" />,
            value: stats?.activeUsers || 0,
            label: "Active Travelers",
            color: "from-purple-500 to-purple-600"
        },
        {
            icon: <Globe2 className="w-8 h-8 text-orange-500" />,
            value: stats?.countriesCount || 0,
            label: "Countries",
            color: "from-orange-500 to-orange-600"
        },
    ]

    return (
        <section className="section-spacing py-16 bg-gradient-to-b from-background to-muted/20">
            <div className="page-container">
                {/* Section Header */}
                <div className="text-center mb-12">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <TrendingUp className="w-6 h-6 text-primary" />
                        <span className="text-sm font-semibold text-primary uppercase tracking-wide">
                            Community Impact
                        </span>
                    </div>
                    <h2 className="text-4xl font-bold mb-4">
                        Powered by Travelers Like You
                    </h2>
                    <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                        Join thousands of adventurers planning their dream trips with AI
                    </p>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statisticsData.map((stat, index) => (
                        <div
                            key={index}
                            className="relative group"
                        >
                            {/* Card */}
                            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
                                {/* Icon with gradient background */}
                                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                                    {stat.icon}
                                </div>

                                {/* Value */}
                                <div className="text-4xl font-bold text-foreground mb-2 tabular-nums">
                                    {stats ? stat.value.toLocaleString() : (
                                        <span className="animate-pulse">...</span>
                                    )}
                                </div>

                                {/* Label */}
                                <div className="text-sm text-muted-foreground font-medium">
                                    {stat.label}
                                </div>
                            </div>

                            {/* Decorative gradient border on hover */}
                            <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 -z-10`} />
                        </div>
                    ))}
                </div>

                {/* Call to Action */}
                <div className="mt-12 text-center">
                    <p className="text-muted-foreground mb-4">
                        Ready to plan your next adventure?
                    </p>
                    <a
                        href="/create-new-trip"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors shadow-md hover:shadow-lg"
                    >
                        <Calendar className="w-5 h-5" />
                        Start Planning Your Trip
                    </a>
                </div>
            </div>
        </section>
    )
}
