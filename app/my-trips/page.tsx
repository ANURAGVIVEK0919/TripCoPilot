"use client"
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useConvex } from 'convex/react';
import Link from 'next/link';
import React, { useEffect, useState } from 'react'
import { useUserDetail } from '../provider';
import { TripInfo } from '../create-new-trip/_components/ChatBox';
import { ArrowBigRightIcon } from 'lucide-react';
import Image from 'next/image';
import MyTripCardItem from './_components/MyTripCardItem';

export type Trip = {
    tripId: any,
    tripDetail: TripInfo,
    _id: string
}

function MyTrips() {

    const [myTrips, setMyTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const { userDetail, setUserDetail } = useUserDetail();
    const convex = useConvex();

    useEffect(() => {
        userDetail && GetUserTrip();
    }, [userDetail])

    const GetUserTrip = async () => {
        if (!userDetail?._id) {
            console.error('User detail not loaded');
            return;
        }
        setLoading(true);
        const result = await convex.query(api.tripDetail.GetUserTrips, {
            uid: userDetail._id
        });
        setMyTrips(result);
        setLoading(false);
        console.log(result);
    }

    return (
        <div className='page-container min-h-screen py-8'>
            {/* Page Header */}
            <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8'>
                <div>
                    <h1 className='mb-2'>My Trips</h1>
                    <p className='text-muted-foreground'>
                        {myTrips.length > 0 
                            ? `You have ${myTrips.length} ${myTrips.length === 1 ? 'trip' : 'trips'} planned`
                            : 'Start planning your next adventure'
                        }
                    </p>
                </div>
                <Link href={'/create-new-trip'}>
                    <Button className='shadow-sm hover:shadow-md transition-shadow'>
                        Create New Trip
                    </Button>
                </Link>
            </div>

            {/* Empty State */}
            {!loading && myTrips?.length === 0 && (
                <div className='max-w-md mx-auto mt-16'>
                    <div className='bg-card border border-border rounded-lg p-8 text-center shadow-sm space-y-4'>
                        <div className='w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center'>
                            <span className='text-4xl'>✈️</span>
                        </div>
                        <div className='space-y-2'>
                            <h3 className='font-semibold'>No trips yet</h3>
                            <p className='text-sm text-muted-foreground'>
                                Start planning your dream vacation with AI-powered itineraries.
                            </p>
                        </div>
                        <Link href={'/create-new-trip'}>
                            <Button className='shadow-sm hover:shadow-md transition-shadow'>
                                Create Your First Trip
                            </Button>
                        </Link>
                    </div>
                </div>
            )}

            {/* Loading Skeletons */}
            {loading && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className='bg-card border border-border rounded-lg overflow-hidden shadow-sm'>
                            <div className='w-full h-48 bg-muted animate-pulse' />
                            <div className='p-4 space-y-3'>
                                <div className='h-5 bg-muted rounded animate-pulse w-3/4' />
                                <div className='h-4 bg-muted rounded animate-pulse w-1/2' />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Trip Cards Grid */}
            {!loading && myTrips?.length > 0 && (
                <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
                    {myTrips.map((trip, index) => (
                        <MyTripCardItem trip={trip} key={index} />
                    ))}
                </div>
            )}
        </div>
    )
}

export default MyTrips