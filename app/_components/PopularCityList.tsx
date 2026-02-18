/**
 * Popular City List Component
 * 
 * Displays a carousel of popular travel destinations
 * Features:
 * - Interactive card carousel
 * - Destination images from Unsplash
 * - Click to expand for more details
 * 
 * @component
 */

"use client";

import React from "react";
import { Carousel, Card } from "@/components/ui/apple-cards-carousel";

export function PopularCityList() {
    // Map data to card components for the carousel
    const cards = data.map((card, index) => (
        <Card key={card.src} card={card} index={index} />
    ));

    return (
        <section className="section-spacing py-16">
            <div className="page-container">
                <h2 className="mb-8">
                    Popular Destinations to Visit
                </h2>
            </div>
            {/* Apple-style card carousel */}
            <Carousel items={cards} />
        </section>
    );
}

/**
 * Dummy content displayed when a card is expanded
 * TODO: Replace with actual destination details
 */
const DummyContent = () => {
    return (
        <>
            {[...new Array(3).fill(1)].map((_, index) => {
                return (
                    <div
                        key={"dummy-content" + index}
                        className="bg-[#F5F5F7] dark:bg-neutral-800 p-8 md:p-14 rounded-3xl mb-4"
                    >
                        <p className="text-neutral-600 dark:text-neutral-400 text-base md:text-2xl font-sans max-w-3xl mx-auto">
                            <span className="font-bold text-neutral-700 dark:text-neutral-200">
                                The first rule of Apple club is that you boast about Apple club.
                            </span>{" "}
                            Keep a journal, quickly jot down a grocery list, and take amazing
                            class notes. Want to convert those notes to text? No problem.
                            Langotiya jeetu ka mara hua yaar is ready to capture every
                            thought.
                        </p>
                        <img
                            src="https://assets.aceternity.com/macbook.png"
                            alt="Macbook mockup from Aceternity UI"
                            height="500"
                            width="500"
                            className="md:w-1/2 md:h-1/2 h-full w-full mx-auto object-contain"
                        />
                    </div>
                );
            })}
        </>
    );
};

/**
 * Popular destinations data
 * Each destination includes:
 * - category: City name and country
 * - title: Brief description of highlights
 * - src: Unsplash image URL
 * - content: Expanded view content
 */
const data = [
    {
        category: "Paris, France",
        title: "Explore the City of Lights – Eiffel Tower, Louvre & more",
        src: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=600&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "New York, USA",
        title: "Experience NYC – Times Square, Central Park, Broadway",
        src: "https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=600&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Tokyo, Japan",
        title: "Discover Tokyo – Shibuya, Cherry Blossoms, Temples",
        src: "https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=800&h=600&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Rome, Italy",
        title: "Walk through History – Colosseum, Vatican, Roman Forum",
        src: "https://images.unsplash.com/photo-1525874684015-58379d421a52?w=800&h=600&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Dubai, UAE",
        title: "Luxury and Innovation – Burj Khalifa, Desert Safari",
        src: "https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&h=600&fit=crop",
        content: <DummyContent />,
    },
    {
        category: "Sydney, Australia",
        title: "Harbour Views – Opera House, Bondi Beach & Wildlife",
        src: "https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=600&fit=crop",
        content: <DummyContent />,
    },
];


