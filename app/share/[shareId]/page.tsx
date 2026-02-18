"use client"

import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUserDetail } from '@/app/provider';
import { useState } from 'react';
import Itinerary from '@/app/create-new-trip/_components/Itinerary';
import GlobalMap from '@/app/create-new-trip/_components/GlobalMap';
import { Button } from '@/components/ui/button';
import { Copy, Users, Clock, MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function SharedTripPage() {
    const { shareId } = useParams();
    const router = useRouter();
    const { userDetail } = useUserDetail();
    const [isCloning, setIsCloning] = useState(false);

    const tripData = useQuery(api.tripSharing.getTripByShareId, {
        shareId: shareId as string
    });

    const cloneTrip = useMutation(api.tripSharing.cloneTrip);
    const collaborators = useQuery(
        api.tripSharing.getCollaborators,
        tripData ? { tripId: tripData.tripId } : 'skip'
    );

    const handleCloneTrip = async () => {
        if (!userDetail?._id) {
            alert('Please sign in to clone this trip');
            router.push('/sign-in');
            return;
        }

        setIsCloning(true);
        try {
            const result = await cloneTrip({
                shareId: shareId as string,
                userId: userDetail._id
            });

            alert('Trip cloned successfully! Redirecting...');
            router.push(`/view-trip/${result.newTripId}`);
        } catch (error: any) {
            alert(error.message || 'Failed to clone trip');
        } finally {
            setIsCloning(false);
        }
    };

    if (!tripData) {
        return (
            <div className='flex items-center justify-center h-screen'>
                <div className='text-center'>
                    <h1 className='text-2xl font-bold mb-2'>Trip Not Found</h1>
                    <p className='text-gray-500 mb-4'>
                        This trip doesn't exist or is no longer shared
                    </p>
                    <Link href='/'>
                        <Button>
                            <ArrowLeft className='h-4 w-4 mr-2' />
                            Go Home
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    const destination = tripData.tripDetail?.tripDetails?.destination || 'Unknown';
    const totalDays = tripData.tripDetail?.tripDetails?.totalDays || 0;
    const groupSize = tripData.tripDetail?.tripDetails?.groupSize || 'Solo';
    const budget = tripData.tripDetail?.tripDetails?.budget || 'Unknown';

    return (
        <div className='flex flex-col h-screen bg-gray-50'>
            {/* Hero Section */}
            <div className='bg-gradient-to-r from-blue-600 to-purple-600 text-white'>
                <div className='max-w-7xl mx-auto px-6 py-8'>
                    <div className='flex items-center gap-2 mb-4'>
                        <Link href='/'>
                            <Button variant='ghost' size='sm' className='text-white hover:bg-white/20'>
                                <ArrowLeft className='h-4 w-4 mr-2' />
                                Back
                            </Button>
                        </Link>
                    </div>

                    <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                            <h1 className='text-4xl font-bold mb-3'>{destination}</h1>
                            
                            <div className='flex items-center gap-6 text-sm mb-4'>
                                <div className='flex items-center gap-2'>
                                    <Clock className='h-4 w-4' />
                                    <span>{totalDays} {totalDays === 1 ? 'day' : 'days'}</span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <Users className='h-4 w-4' />
                                    <span>{groupSize}</span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <MapPin className='h-4 w-4' />
                                    <span>{budget} Budget</span>
                                </div>
                            </div>

                            {/* Owner Info */}
                            <div className='inline-flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-3 rounded-lg'>
                                <img
                                    src={tripData.owner?.imageUrl || '/placeholder.jpg'}
                                    alt={tripData.owner?.name}
                                    className='h-10 w-10 rounded-full border-2 border-white'
                                />
                                <div>
                                    <p className='text-xs opacity-80'>Created by</p>
                                    <p className='font-medium'>{tripData.owner?.name || 'Anonymous'}</p>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className='flex flex-col gap-3'>
                            {tripData.allowCloning && (
                                <Button
                                    onClick={handleCloneTrip}
                                    disabled={isCloning}
                                    className='bg-white text-blue-600 hover:bg-gray-100'
                                    size='lg'
                                >
                                    <Copy className='h-4 w-4 mr-2' />
                                    {isCloning ? 'Cloning...' : 'Clone This Trip'}
                                </Button>
                            )}

                            {collaborators && collaborators.length > 1 && (
                                <div className='text-center text-sm bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg'>
                                    <Users className='h-4 w-4 inline mr-1' />
                                    {collaborators.length} {collaborators.length === 1 ? 'collaborator' : 'collaborators'}
                                </div>
                            )}

                            {tripData.cloneCount && tripData.cloneCount > 0 && (
                                <div className='text-center text-xs bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg'>
                                    🔥 Cloned {tripData.cloneCount} times
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trip Content */}
            <div className='flex-1 overflow-hidden'>
                <div className='grid grid-cols-5 h-full'>
                    <div className='col-span-3 overflow-y-auto bg-white border-r'>
                        <div className='p-6'>
                            {/* Pass trip data to Itinerary */}
                            <div className='prose max-w-none'>
                                {/* Hotels Section */}
                                {tripData.tripDetail?.hotels && tripData.tripDetail.hotels.length > 0 && (
                                    <div className='mb-8'>
                                        <h2 className='text-2xl font-bold mb-4'>🏨 Recommended Hotels</h2>
                                        <div className='grid gap-4'>
                                            {tripData.tripDetail.hotels.map((hotel: any, index: number) => (
                                                <div key={index} className='border rounded-lg p-4 hover:shadow-md transition'>
                                                    <div className='flex gap-4'>
                                                        {hotel.imageUrl && (
                                                            <img
                                                                src={hotel.imageUrl}
                                                                alt={hotel.name}
                                                                className='w-32 h-32 object-cover rounded'
                                                            />
                                                        )}
                                                        <div className='flex-1'>
                                                            <h3 className='font-bold text-lg'>{hotel.name}</h3>
                                                            <p className='text-sm text-gray-600 mb-2'>{hotel.address}</p>
                                                            <p className='text-sm mb-2'>{hotel.description}</p>
                                                            <div className='flex items-center gap-4 text-sm'>
                                                                <span className='text-green-600 font-medium'>
                                                                    ${hotel.price}/night
                                                                </span>
                                                                <span className='text-yellow-500'>
                                                                    ⭐ {hotel.rating}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Itinerary Section */}
                                {tripData.tripDetail?.itinerary && (
                                    <div>
                                        <h2 className='text-2xl font-bold mb-4'>📅 Daily Itinerary</h2>
                                        {Object.entries(tripData.tripDetail.itinerary).map(([day, data]: [string, any]) => (
                                            <div key={day} className='mb-6 border-l-4 border-blue-500 pl-4'>
                                                <h3 className='text-xl font-bold mb-3'>{day}</h3>
                                                <div className='space-y-4'>
                                                    {data.activities?.map((activity: any, index: number) => (
                                                        <div key={index} className='bg-gray-50 rounded-lg p-4'>
                                                            <div className='flex gap-3'>
                                                                {activity.imageUrl && (
                                                                    <img
                                                                        src={activity.imageUrl}
                                                                        alt={activity.place_name}
                                                                        className='w-24 h-24 object-cover rounded'
                                                                    />
                                                                )}
                                                                <div className='flex-1'>
                                                                    <h4 className='font-bold'>{activity.place_name}</h4>
                                                                    <p className='text-sm text-gray-600 mb-1'>
                                                                        ⏰ {activity.best_time_to_visit}
                                                                    </p>
                                                                    <p className='text-sm mb-1'>{activity.place_details}</p>
                                                                    {activity.ticket_price && (
                                                                        <p className='text-sm text-green-600 font-medium'>
                                                                            💰 {activity.ticket_price}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className='col-span-2 bg-gray-100'>
                        <GlobalMap />
                    </div>
                </div>
            </div>
        </div>
    );
}
