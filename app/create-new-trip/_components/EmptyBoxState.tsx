"use client"
import { suggestions } from '@/app/_components/Hero'
import { useRouter } from 'next/navigation'
import React from 'react'

function EmptyBoxState({ onSelectOption }: any) {
    const router = useRouter()

    const handleClick = (title: string) => {
        if (title === 'Inspire me where to go') {
            router.push('/community')
        } else {
            onSelectOption(title)
        }
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='text-center space-y-2'>
                <h2 className='text-2xl md:text-3xl font-bold'>
                    Start Planning Your{" "}
                    <span className='text-primary'>Dream Trip</span>
                </h2>
                <p className='text-muted-foreground text-sm leading-relaxed max-w-md mx-auto'>
                    Discover personalized travel itineraries, find the best destinations, and plan your vacation effortlessly with AI.
                </p>
            </div>

            {/* Suggestion Cards */}
            <div className='flex flex-col gap-3'>
                {suggestions.map((suggestions, index) => (
                    <button
                        key={index}
                        onClick={() => handleClick(suggestions.title)}
                        className='flex items-center gap-3 p-4 border border-border bg-background rounded-lg cursor-pointer hover:border-primary hover:bg-accent transition-all duration-200 shadow-sm hover:shadow-md text-left'
                    >
                        <div className='flex-shrink-0'>{suggestions.icon}</div>
                        <span className='font-medium'>{suggestions.title}</span>
                    </button>
                ))}
            </div>
        </div>
    )
}

export default EmptyBoxState