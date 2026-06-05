/**
 * Hero Component
 * 
 * Main landing section with:
 * - Trip planner input interface
 * - Suggestion buttons (Create Trip, Get Inspired)
 * - Demo video
 * 
 * @component
 */

"use client"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { useUser } from '@clerk/nextjs'
import { Globe2, Plane, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React from 'react'

/**
 * Quick action suggestions displayed as pills below the input
 * Users can click these for common actions
 */
export const suggestions = [
    {
        title: 'Create New Trip',
        icon: <Globe2 className='text-blue-400 h-5 w-5' />
    },
    {
        title: 'Inspire me where to go',
        icon: <Plane className='text-green-500 h-5 w-5' />
    }
]

function Hero() {
    // Authentication state from Clerk
    const { user } = useUser();
    const router = useRouter();
    
    /**
     * Handles the send button click
     * Redirects to sign-in if not authenticated, otherwise navigates to trip creation
     */
    const onSend = () => {
        if (!user) {
            router.push('/sign-in')
            return;
        }
        // Navigate to Create Trip Planner Web Page
        router.push('/create-new-trip')
    }

    /**
     * Handles suggestion pill clicks
     * Different routes based on which suggestion is clicked
     * @param {string} title - The title of the clicked suggestion
     */
    const handleSuggestionClick = (title: string) => {
        // Redirect to sign-in if user not authenticated
        if (!user) {
            router.push('/sign-in')
            return;
        }
        
        // Route to different pages based on suggestion
        if (title === 'Inspire me where to go') {
            // Show community stories for inspiration
            router.push('/community')
        } else {
            // Navigate to create-new-trip for "Create New Trip"
            router.push('/create-new-trip')
        }
    }

    return (
        <section className='page-container pt-20 md:pt-28'>
            <div className='max-w-4xl mx-auto text-center'>
                
                {/* Main Heading with gradient effect on "TripCoPilot" */}
                <h1 className='mb-4'>Hey, I'm your personal{" "}
                    <span className='bg-gradient-to-r from-primary via-primary to-blue-600 bg-clip-text text-transparent'>
                        TripCoPilot
                    </span>
                </h1>
                
                {/* Subtitle explaining the AI capabilities */}
                <p className='text-muted-foreground mb-8 max-w-2xl mx-auto'>
                    Tell me what you want, and I'll handle the rest: Flights, Hotels, TripCoPilot - all in seconds
                </p>

                {/* Trip Input Card with textarea and send button */}
                <div className='mb-6'>
                    <div className='bg-card border border-border rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow relative'>
                        <Textarea 
                            placeholder='Create a trip to Paris from New York'
                            className='w-full h-28 bg-transparent border-none focus-visible:ring-0 shadow-none resize-none text-base'
                        />
                        {/* Send button positioned absolute in bottom-right */}
                        <Button 
                            size={'default'} 
                            className='absolute bottom-6 right-6 h-10 w-10 p-0 shadow-sm hover:shadow-md transition-shadow' 
                            onClick={() => onSend()}
                        >
                            <Send className='h-4 w-4' />
                        </Button>
                    </div>
                </div>

                {/* Quick action suggestion pills */}
                <div className='flex flex-wrap gap-3 justify-center mb-12'>
                    {suggestions.map((suggestions, index) => (
                        <button
                            key={index}
                            className='inline-flex items-center gap-2 px-4 py-2.5 border border-border bg-card rounded-full text-sm font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-200 shadow-sm hover:shadow-md cursor-pointer'
                            onClick={() => handleSuggestionClick(suggestions.title)}
                        >
                            {suggestions.icon}
                            <span>{suggestions.title}</span>
                        </button>
                    ))}
                </div>
            </div>
        </section>
    )
}

export default Hero