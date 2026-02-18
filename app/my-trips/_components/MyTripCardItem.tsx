import React, { useEffect, useState } from 'react'
import { Trip } from '../page'
import Image from 'next/image'
import { ArrowRight, Calendar, DollarSign, Users, MapPin } from 'lucide-react'
import axios from 'axios'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

type Props = {
    trip: Trip & { isSharedWithMe?: boolean }
}

function MyTripCardItem({ trip }: Props) {
    const [photoUrl, setPhotoUrl] = useState<string>();
    const [imageError, setImageError] = useState(false);

    useEffect(() => {
        setImageError(false);
        trip && GetGooglePlaceDetail();
    }, [trip])

    const GetGooglePlaceDetail = async () => {
        const result = await axios.post('/api/google-place-detail', {
            placeName: trip?.tripDetail?.destination
        });
        if (result?.data?.e) {
            return;
        }
        setPhotoUrl(result?.data);
    }

    const handleImageError = () => {
        console.log('Image failed to load for trip, using placeholder');
        setImageError(true);
    }

    return (
        <div className='group bg-card border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 hover:border-primary/50'>
            {/* Image Container */}
            <Link href={'/view-trip/' + trip?.tripId}>
                <div className='relative h-48 overflow-hidden bg-muted cursor-pointer'>
                    <Image 
                        src={imageError ? '/placeholder.jpg' : (photoUrl || '/placeholder.jpg')} 
                        alt={trip?.tripDetail?.destination || 'Trip destination'}
                        width={400} 
                        height={300}
                        className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-300'
                        onError={handleImageError}
                    />
                    {trip.isSharedWithMe && (
                        <div className='absolute top-3 right-3 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 shadow-md'>
                            <Users className='h-3 w-3' />
                            Shared
                        </div>
                    )}
                </div>
            </Link>

            {/* Content */}
            <div className='p-4 space-y-3'>
                {/* Route */}
                <Link href={'/view-trip/' + trip?.tripId}>
                    <div className='flex items-center gap-2 cursor-pointer'>
                        <h3 className='font-semibold text-foreground truncate flex-1'>
                            {trip?.tripDetail?.origin}
                        </h3>
                        <ArrowRight className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                        <h3 className='font-semibold text-foreground truncate flex-1 text-right'>
                            {trip?.tripDetail?.destination}
                        </h3>
                    </div>
                </Link>

                {/* Metadata */}
                <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1.5'>
                        <Calendar className='h-3.5 w-3.5' />
                        <span>{trip?.tripDetail?.duration}</span>
                    </div>
                    <div className='flex items-center gap-1.5'>
                        <DollarSign className='h-3.5 w-3.5' />
                        <span className='capitalize'>{trip?.tripDetail?.budget}</span>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className='flex gap-2 pt-2'>
                    <Link href={'/view-trip/' + trip?.tripId} className='flex-1'>
                        <Button variant='default' size='sm' className='w-full'>
                            View Details
                        </Button>
                    </Link>
                    <a 
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(trip?.tripDetail?.destination || '')}`}
                        target='_blank'
                        rel='noopener noreferrer'
                        onClick={(e) => e.stopPropagation()}
                    >
                        <Button variant='outline' size='sm' className='gap-1.5'>
                            <MapPin className='h-3.5 w-3.5' />
                            Map
                        </Button>
                    </a>
                </div>
            </div>
        </div>
    )
}

export default MyTripCardItem