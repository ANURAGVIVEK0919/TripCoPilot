"use client"
import React, { useEffect, useState } from 'react'
import { Timeline } from "@/components/ui/timeline";
import Image from 'next/image';
import { ArrowLeft, Clock, ExternalLink, Star, Ticket, Timer, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import HotelCardItem from './HotelCardItem';
import PlaceCardItem from './PlaceCarditem';
import { useTripDetail } from '@/app/provider';
import { TripInfo } from './ChatBox';
// const TRIP_DATA = {
//     "destination": "Goa, India",
//     "duration": "2 Days",
//     "origin": "Mumbai, India",
//     "budget": "Low",
//     "group_size": "Solo",
//     "hotels": [
//         {
//             "hotel_name": "The Bucket List Hostel, Goa",
//             "hotel_address": "House No. 1290/1, Soranto, Anjuna, Goa 403509",
//             "price_per_night": "INR 500 - 800",
//             "hotel_image_url": "https://example.com/thebucketlist.jpg",
//             "geo_coordinates": {
//                 "latitude": 15.5898,
//                 "longitude": 73.7431
//             },
//             "rating": 4.5,
//             "description": "A popular and highly-rated hostel in Anjuna, offering dormitory beds and private rooms. Known for its friendly atmosphere and social events, ideal for solo travelers on a budget."
//         },
//         {
//             "hotel_name": "Goa Happy Homes Hostel",
//             "hotel_address": "House No. 70/1, Porbavaddo, Calangute, Goa 403516",
//             "price_per_night": "INR 400 - 700",
//             "hotel_image_url": "https://example.com/goahappyhomes.jpg",
//             "geo_coordinates": {
//                 "latitude": 15.5458,
//                 "longitude": 73.7667
//             },
//             "rating": 4.2,
//             "description": "A budget-friendly hostel in Calangute with a relaxed vibe. Offers dormitory and private rooms, close to the beach and local amenities. Good for meeting other travelers."
//         }
//     ],
//     "itinerary": [
//         {
//             "day": 1,
//             "day_plan": "Arrival in Goa, Explore North Goa beaches and markets.",
//             "best_time_to_visit_day": "Morning to Evening",
//             "activities": [
//                 {
//                     "place_name": "Anjuna Beach",
//                     "place_details": "Famous for its vibrant flea market (operational on Wednesdays) and a lively party scene. offers stunning sunset views and shacks for food and drinks.",
//                     "place_image_url": "https://example.com/anjunabeach.jpg",
//                     "geo_coordinates": {
//                         "latitude": 15.5843,
//                         "longitude": 73.7406
//                     },
//                     "place_address": "Anjuna, North Goa, Goa 403509",
//                     "ticket_pricing": "Free (Flea market entry free, but expect to spend on shopping/food)",
//                     "time_travel_each_location": "2-3 hours",
//                     "best_time_to_visit": "Afternoon (for general beach activity) / Wednesday (for Flea Market) / Sunset"
//                 },
//                 {
//                     "place_name": "Calangute Beach",
//                     "place_details": "Known as the \"Queen of Beaches,\" Calangute is one of the most popular and largest beaches in North Goa. Good for water sports and shacks.",
//                     "place_image_url": "https://example.com/calangutebeach.jpg",
//                     "geo_coordinates": {
//                         "latitude": 15.5458,
//                         "longitude": 73.7667
//                     },
//                     "place_address": "Calangute, North Goa, Goa 403516",
//                     "ticket_pricing": "Free (Water sports extra)",
//                     "time_travel_each_location": "2 hours",
//                     "best_time_to_visit": "Late Afternoon"
//                 },
//                 {
//                     "place_name": "Baga Beach",
//                     "place_details": "Adjacent to Calangute, Baga is famous for its shacks, nightlife, and water sports. The Tito's Lane area comes alive at night.",
//                     "place_image_url": "https://example.com/bagabeach.jpg",
//                     "geo_coordinates": {
//                         "latitude": 15.5658,
//                         "longitude": 73.7547
//                     },
//                     "place_address": "Baga, North Goa, Goa 403516",
//                     "ticket_pricing": "Free",
//                     "time_travel_each_location": "2-3 hours",
//                     "best_time_to_visit": "Evening (for shacks and nightlife)"
//                 }
//             ]
//         },
//         {
//             "day": 2,
//             "day_plan": "Explore Old Goa's historical sites and return to Mumbai.",
//             "best_time_to_visit_day": "Morning to Afternoon",
//             "activities": [
//                 {
//                     "place_name": "Basilica of Bom Jesus",
//                     "place_details": "A UNESCO World Heritage Site, this basilica holds the mortal remains of St. Francis Xavier. An excellent example of Baroque architecture.",
//                     "place_image_url": "https://example.com/basilicabomjesus.jpg",
//                     "geo_coordinates": {
//                         "latitude": 15.4988,
//                         "longitude": 73.9113
//                     },
//                     "place_address": "Old Goa Road, Bainguinim, Goa 403402",
//                     "ticket_pricing": "Free",
//                     "time_travel_each_location": "1-1.5 hours",
//                     "best_time_to_visit": "Morning (less crowded)"
//                 },
//                 {
//                     "place_name": "Se Cathedral",
//                     "place_details": "One of the largest churches in Asia, dedicated to Catherine of Alexandria. A magnificent example of Portuguese-Manueline architecture.",
//                     "place_image_url": "https://example.com/secathedral.jpg",
//                     "geo_coordinates": {
//                         "latitude": 15.5002,
//                         "longitude": 73.9102
//                     },
//                     "place_address": "Velha Goa, Goa 403402",
//                     "ticket_pricing": "Free",
//                     "time_travel_each_location": "1 hour",
//                     "best_time_to_visit": "Morning"
//                 },
//                 {
//                     "place_name": "Fontainhas (Latin Quarter)",
//                     "place_details": "Goa's old Latin Quarter, known for its narrow winding streets and brightly painted Portuguese-style houses. Great for a leisurely stroll and photography.",
//                     "place_image_url": "https://example.com/fontainhas.jpg",
//                     "geo_coordinates": {
//                         "latitude": 15.4973,
//                         "longitude": 73.8184
//                     },
//                     "place_address": "Panaji, Goa 403001",
//                     "ticket_pricing": "Free",
//                     "time_travel_each_location": "1.5-2 hours",
//                     "best_time_to_visit": "Late Morning / Early Afternoon"
//                 }
//             ]
//         }
//     ]
// }




function Itinerary() {
    const { tripDetailInfo, setTripDetailInfo } = useTripDetail();
    const [tripData, setTripData] = useState<TripInfo | null>(null)

    useEffect(() => {
        tripDetailInfo && setTripData(tripDetailInfo)
    }, [tripDetailInfo])

    const data = tripData ? [
        {
            title: "Hotels",
            content: (
                <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                    {tripData?.hotels.map((hotel, index) => (
                        <HotelCardItem key={index} hotel={hotel} />
                    ))}
                </div>
            ),
        },
        ...tripData?.itinerary.map((dayData) => ({
            title: `Day ${dayData?.day}`,
            content: (
                <div>
                    <p className='mb-4 font-bold text-xl text-primary'>Best Time: {dayData?.best_time_to_visit_day}</p>
                    <div className='grid grid-cols-1 lg:grid-cols-2 gap-5'>
                        {dayData?.activities.map((activity, index) => (
                            <PlaceCardItem key={index} activity={activity} />
                        ))}
                    </div>
                </div>
            )
        }))

    ] : [];
    return (
        <div className="relative w-full h-[83vh] overflow-auto">
            {/* @ts-ignore */}
            {tripData ? <Timeline data={data} tripData={tripData} />
                :
                <div>
                    <h2 className='flex gap-2 text-3xl text-white left-20 items-center absolute bottom-20'> <ArrowLeft /> Getting to know you to build perfect trip here...</h2>

                    <Image src={'/travel.png'} alt='travel' width={'800'}
                        height={800}
                        className='w-full h-full object-cover rounded-3xl'
                    />

                </div>
            }

        </div>
    );
}

export default Itinerary