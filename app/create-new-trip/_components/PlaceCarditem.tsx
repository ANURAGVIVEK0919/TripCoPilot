"use client"
import { Button } from '@/components/ui/button'
import { Clock, ExternalLink, Ticket } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import React, { useEffect, useState } from 'react'
import { Activity } from './ChatBox'
import axios from 'axios'

type Props = {
    activity: Activity
}


function PlaceCardItem({ activity }: Props) {
    const [photoUrl, setPhotoUrl] = useState<string>();
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Reset error state when activity changes
        setImageError(false);
        
        // Use the image URL provided by AI in the trip plan
        if (activity?.place_image_url && activity.place_image_url !== 'PLACEHOLDER') {
            // Clean up the URL if it has malformed parts
            let cleanUrl = activity.place_image_url;
            
            // Fix URLs that have domain name embedded in path (e.g., images.unsplash.com(photo-...))
            if (cleanUrl.includes('unsplash.com(')) {
                cleanUrl = cleanUrl.replace(/unsplash\.com\(/g, 'unsplash.com/');
            }
            if (cleanUrl.includes('pexels.com(')) {
                cleanUrl = cleanUrl.replace(/pexels\.com\(/g, 'pexels.com/');
            }
            
            setPhotoUrl(cleanUrl);
        } else {
            // Fallback: try to fetch from Ola Maps API if no URL provided
            activity && GetGooglePlaceDetail();
        }
    }, [activity])

    const GetGooglePlaceDetail = async () => {
        try {
            const result = await axios.post('/api/google-place-detail', {
                placeName: activity?.place_name + ":" + activity?.place_address
            });
            // Check if we got a valid response
            if (result.status === 200 && result.data) {
                setPhotoUrl(result.data);
            }
        } catch (error) {
            console.log('Failed to fetch place photo:', error);
            // Will use placeholder image
        }
    }

    const handleImageError = () => {
        console.log('Image failed to load, using placeholder for:', activity?.place_name);
        setImageError(true);
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
            {/* Image Section - Fixed aspect ratio */}
            <div className="relative w-full aspect-[4/3] flex-shrink-0 bg-gray-100">
                <Image
                    src={imageError ? '/placeholder.jpg' : (photoUrl || '/placeholder.jpg')}
                    alt={activity.place_name}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    onError={handleImageError}
                    priority={false}
                />
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col gap-2.5 flex-grow">
                {/* Title */}
                <h2 className="font-bold text-lg text-gray-900 line-clamp-2 min-h-[3.5rem]">
                    {activity?.place_name}
                </h2>

                {/* Details */}
                <p className="text-gray-600 text-sm line-clamp-3 leading-relaxed flex-grow">
                    {activity?.place_details}
                </p>

                {/* Info Grid */}
                <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                    {/* Pricing */}
                    {activity?.ticket_pricing && (
                        <div className="flex items-start gap-2 text-blue-600 text-xs font-medium">
                            <Ticket className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{activity?.ticket_pricing}</span>
                        </div>
                    )}

                    {/* Best Time */}
                    {activity?.best_time_to_visit && (
                        <div className="flex items-start gap-2 text-orange-500 text-xs font-medium">
                            <Clock className="w-4 h-4 flex-shrink-0 mt-0.5" />
                            <span className="line-clamp-1">{activity?.best_time_to_visit}</span>
                        </div>
                    )}
                </div>

                {/* View Button */}
                <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(activity?.place_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2"
                >
                    <Button
                        size="sm"
                        variant="outline"
                        className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    >
                        View on Map <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default PlaceCardItem
