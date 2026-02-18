"use client"
import Image from 'next/image'
import React, { useEffect, useState } from 'react'
import { Hotel } from './ChatBox'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, Wallet } from 'lucide-react'
import axios from 'axios'

type Props = {
    hotel: Hotel
}

function HotelCardItem({ hotel }: Props) {

    const [photoUrl, setPhotoUrl] = useState<string>();
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        // Reset error state when hotel changes
        setImageError(false);
        
        // Use the image URL provided by AI in the trip plan
        if (hotel?.hotel_image_url && hotel.hotel_image_url !== 'PLACEHOLDER') {
            setPhotoUrl(hotel.hotel_image_url);
        } else {
            // Fallback: try to fetch from Ola Maps API if no URL provided
            hotel && GetGooglePlaceDetail();
        }
    }, [hotel])

    const GetGooglePlaceDetail = async () => {
        try {
            const result = await axios.post('/api/google-place-detail', {
                placeName: hotel?.hotel_name
            });
            // Check if we got a valid response
            if (result.status === 200 && result.data) {
                setPhotoUrl(result.data);
            }
        } catch (error) {
            console.log('Failed to fetch hotel photo:', error);
            // Will use placeholder image
        }
    }

    const handleImageError = () => {
        console.log('Image failed to load, using placeholder for:', hotel?.hotel_name);
        setImageError(true);
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
            {/* Image Section - Fixed aspect ratio */}
            <div className="relative w-full aspect-[4/3] flex-shrink-0 bg-gray-100">
                <Image
                    src={imageError ? '/placeholder.jpg' : (photoUrl || '/placeholder.jpg')}
                    alt={hotel?.hotel_name || 'Hotel Image'}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    onError={handleImageError}
                    priority={false}
                />
            </div>

            {/* Content Section */}
            <div className="p-4 flex flex-col gap-2.5 flex-grow">
                {/* Hotel Name */}
                <h2 className="font-bold text-lg text-gray-900 line-clamp-2 min-h-[3.5rem]">
                    {hotel?.hotel_name}
                </h2>

                {/* Address */}
                <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed flex-grow">
                    {hotel?.hotel_address}
                </p>

                {/* Price & Rating */}
                <div className="flex justify-between items-center gap-3 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-1.5 text-green-600 font-semibold text-xs min-w-0">
                        <Wallet className="w-4 h-4 flex-shrink-0" /> 
                        <span className="truncate">{hotel?.price_per_night}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-yellow-500 font-semibold text-xs flex-shrink-0">
                        <Star className="w-4 h-4 fill-yellow-500" /> 
                        {hotel?.rating}
                    </div>
                </div>

                {/* View on Map Button */}
                <Link
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(hotel?.hotel_name)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2"
                >
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full flex items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-400 transition-colors"
                    >
                        View on Map
                    </Button>
                </Link>
            </div>
        </div>
    )
}

export default HotelCardItem
