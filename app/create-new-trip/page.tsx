"use client"
import React, { useEffect, useState, Suspense } from 'react'
import ChatBox from './_components/ChatBox'
import Itinerary from './_components/Itinerary'
import { useTripDetail } from '../provider';
import { useSearchParams } from 'next/navigation';

function CreateNewTripContent() {

    const { tripDetailInfo, setTripDetailInfo } = useTripDetail();
    const searchParams = useSearchParams();
    const tripType = searchParams.get('type');
    
    useEffect(() => {
        setTripDetailInfo(null)
    }, [])
    
    return (
        <div className='page-container min-h-screen py-6'>
            {/* Two-Column Layout */}
            <div className='grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)]'>
                {/* Chat Panel - Left Side */}
                <div className='lg:col-span-5'>
                    <ChatBox tripType={tripType} />
                </div>

                {/* Itinerary Panel - Right Side */}
                <div className='lg:col-span-7'>
                    <div className='h-full bg-card border border-border rounded-lg shadow-md overflow-hidden'>
                        <Itinerary />
                    </div>
                </div>
            </div>
        </div>
    )
}

function CreateNewTrip() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <CreateNewTripContent />
        </Suspense>
    )
}

export default CreateNewTrip