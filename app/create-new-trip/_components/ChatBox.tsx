"use client"
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import axios from 'axios'
import { Bot, Loader, Send, User } from 'lucide-react'
import React, { useEffect, useRef, useState } from 'react'
import EmptyBoxState from './EmptyBoxState'
import GroupSizeUi from './GroupSizeUi'

import BudgetUi from './BudgetUi'
import SelectDays from './SelectDaysUi'
import FinalUi from './FinalUi'
import { useMutation } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { useTripDetail, useUserDetail } from '@/app/provider'
import { v4 as uuidv4 } from 'uuid'
import { usePathname, useRouter } from 'next/navigation'

type Message = {
    role: string
    content: string
    ui?: string
}

export type TripInfo = {
    budget: string
    destination: string
    duration: string
    group_size: string
    origin: string
    hotels: Hotel[]
    itinerary: Itinerary[]
}

export type Hotel = {
    hotel_name: string
    hotel_address: string
    price_per_night: string
    hotel_image_url: string
    geo_coordinates: {
        latitude: number
        longitude: number
    }
    rating: number
    description: string
}

export type Activity = {
    place_name: string
    place_details: string
    place_image_url: string
    geo_coordinates: {
        latitude: number
        longitude: number
    }
    place_address: string
    ticket_pricing: string
    time_travel_each_location: string
    best_time_to_visit: string
}

export type Itinerary = {
    day: number
    day_plan: string
    best_time_to_visit_day: string
    activities: Activity[]
}

interface ChatBoxProps {
    tripType?: string | null
}

function ChatBox({ tripType }: ChatBoxProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [userInput, setUserInput] = useState<string>('')
    const [loading, setLoading] = useState(false)
    const [isFinal, setIsFinal] = useState(false)
    const [tripDetail, setTripDetail] = useState<TripInfo>()
    const SaveTripDetail = useMutation(api.tripDetail.CreateTripDetail)
    const { userDetail } = useUserDetail()
    const router = useRouter();
    const [_tripId, setTripId] = useState<string>();
    const { setTripDetailInfo } = useTripDetail()
    const path = usePathname()
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const finalRequestSentRef = useRef(false) // Track if final request already sent

    // Pre-fill input based on trip type
    useEffect(() => {
        if (tripType === 'hidden-gems') {
            setUserInput('Suggest me hidden gem destinations that are off-beat, underrated, and less touristy with unique experiences')
        }
    }, [tripType])

    // Auto scroll to bottom when messages update
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, loading])

    const onSend = async (messageContent?: string) => {
        const content = messageContent || userInput;
        if (!content.trim()) return

        const newMsg: Message = {
            role: 'user',
            content: content
        }

        setMessages((prev) => [...prev, newMsg])
        setUserInput('')
        setLoading(true)

        try {
            console.log('Sending to AI:', { messages: [...messages, newMsg], isFinal });
            
            // Send tripId if generating final itinerary (so AI can check bookings)
            const result = await axios.post('/api/aimodel', {
                messages: [...messages, newMsg],
                isFinal,
                tripId: _tripId || null // Send tripId if available (for re-generation with bookings)
            })

            console.log('AI Response:', result.data);

            const { resp, ui, trip_plan } = result.data || {}

            if (!isFinal && resp) {
                setMessages((prev) => [...prev, { role: 'assistant', content: resp, ui }])
            }

            if (trip_plan) {
                const tripId = uuidv4()
                if (!userDetail?._id) {
                    console.error('User detail not loaded');
                    return;
                }
                await SaveTripDetail({
                    tripDetail: trip_plan,
                    tripId,
                    uid: userDetail._id
                })
                setTripId(tripId)
                setTripDetail(trip_plan)
                setTripDetailInfo(trip_plan)
                setIsFinal(false)
            }
        } catch (error) {
            console.error('Error fetching AI response:', error)
            setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Something went wrong. Please try again.' }])
        } finally {
            setLoading(false)
        }
    }

    const RenderGenerativeUi = (ui?: string) => {
        switch (ui) {
            case 'budget':
                return <BudgetUi onSelectedOption={(v: string) => onSend(v)} />
            case 'groupSize':
                return <GroupSizeUi onSelectedOption={(v: string) => onSend(v)} />
            case 'tripDuration':
                return <SelectDays onSelectedOption={(v: string) => onSend(v)} />
            case 'final':
                return <FinalUi viewTrip={() => router.push('/view-trip/' + _tripId)} disable={!tripDetail} />
            case 'limit':
                return (
                    <div className="flex flex-col items-center justify-center mt-4 p-6 bg-error-light border border-error/20 rounded-lg shadow-sm space-y-3">
                        <div className="w-12 h-12 rounded-full bg-error/10 flex items-center justify-center text-2xl">
                            🚫
                        </div>
                        <div className="text-center space-y-1">
                            <h3 className="font-semibold text-foreground">Free Credits Exhausted</h3>
                            <p className="text-sm text-muted-foreground max-w-xs">
                                You've used all your free trip generations for today. Upgrade to premium for unlimited access!
                            </p>
                        </div>
                        <Button 
                            onClick={() => router.push('/pricing')} 
                            className="w-full bg-error hover:bg-error/90 shadow-sm"
                        >
                            View Pricing Plans
                        </Button>
                    </div>
                )
            default:
                return null
        }
    }

    // Detect final step and trigger response once
    useEffect(() => {
        console.log('🔍 useEffect triggered - checking messages');
        console.log('Messages length:', messages.length);
        console.log('isFinal state:', isFinal);
        console.log('finalRequestSentRef:', finalRequestSentRef.current);
        
        const lastMsg = messages[messages.length - 1]
        console.log('Last message:', lastMsg);
        
        if (lastMsg?.ui === 'final' && !finalRequestSentRef.current) {
            console.log('🎯 Final step detected - ui is final, sending request');
            finalRequestSentRef.current = true // Mark as sent immediately
            setIsFinal(true)
            
            // Auto-send confirmation message with isFinal flag
            const timeout = setTimeout(async () => {
                console.log('⏱️ Timeout fired - sending final request');
                
                const newMsg: Message = {
                    role: 'user',
                    content: 'Ok, Great!'
                }

                setMessages((prev) => [...prev, newMsg])
                setLoading(true)

                try {
                    console.log('📤 Sending FINAL request to AI with isFinal=true');
                    
                    const result = await axios.post('/api/aimodel', {
                        messages: [...messages, newMsg],
                        isFinal: true,  // Force true for final generation
                        tripId: _tripId || null // Include tripId if regenerating
                    })

                    console.log('📥 AI Final Response:', result.data);

                    const { trip_plan } = result.data || {}

                    if (trip_plan) {
                        const tripId = uuidv4()
                        if (!userDetail?._id) {
                            console.error('❌ User detail not loaded');
                            return;
                        }
                        await SaveTripDetail({
                            tripDetail: trip_plan,
                            tripId,
                            uid: userDetail._id
                        })
                        setTripId(tripId)
                        setTripDetail(trip_plan)
                        setTripDetailInfo(trip_plan)
                        console.log('✅ Trip saved successfully with ID:', tripId);
                    } else {
                        console.error('❌ No trip_plan in response');
                    }
                } catch (error) {
                    console.error('❌ Error fetching AI final response:', error)
                    setMessages((prev) => [...prev, { role: 'assistant', content: '❌ Something went wrong generating your trip. Please try again.' }])
                    finalRequestSentRef.current = false // Reset on error
                } finally {
                    setLoading(false)
                    setIsFinal(false) // Reset for next trip
                }
            }, 300)
            
            return () => clearTimeout(timeout)
        } else {
            console.log('⏭️ Skipping - not final step or already sent');
        }
    }, [messages])

    return (
        <div className='h-full flex flex-col bg-card border border-border rounded-lg shadow-md'>
            {/* Chat Header */}
            {messages.length === 0 && (
                <div className='p-6'>
                    <EmptyBoxState onSelectOption={(v: string) => onSend(v)} />
                </div>
            )}

            {/* Messages Container */}
            {messages.length > 0 && (
                <section className='flex-1 overflow-y-auto p-6 space-y-6'>
                    {messages.map((msg, index) => (
                        <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {/* AI Avatar (left side) */}
                            {msg.role === 'assistant' && (
                                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                                    <Bot className='h-4 w-4 text-primary' />
                                </div>
                            )}

                            {/* Message Bubble */}
                            <div className={`flex flex-col max-w-[75%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                                <div className={`px-4 py-3 rounded-2xl ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground rounded-tr-sm' 
                                        : 'bg-muted/80 rounded-tl-sm'
                                }`}>
                                    <p className='text-sm leading-relaxed whitespace-pre-wrap break-words'>{msg.content}</p>
                                </div>
                                {/* Interactive UI below message */}
                                {msg.ui && (
                                    <div className='mt-2 w-full'>
                                        {RenderGenerativeUi(msg.ui)}
                                    </div>
                                )}
                            </div>

                            {/* User Avatar (right side) */}
                            {msg.role === 'user' && (
                                <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center'>
                                    <User className='h-4 w-4 text-primary-foreground' />
                                </div>
                            )}
                        </div>
                    ))}

                    {/* Loading State */}
                    {loading && (
                        <div className='flex gap-3 justify-start'>
                            <div className='flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center'>
                                <Bot className='h-4 w-4 text-primary' />
                            </div>
                            <div className='px-4 py-3 rounded-2xl rounded-tl-sm bg-muted/80 flex items-center gap-2'>
                                <Loader className='animate-spin h-4 w-4 text-muted-foreground' />
                                <span className='text-sm text-muted-foreground'>Thinking...</span>
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </section>
            )}

            {/* Input Section */}
            <section className='p-4 border-t border-border bg-background/50'>
                <div className='relative bg-background border border-border rounded-lg p-3 shadow-sm focus-within:shadow-md focus-within:border-primary/50 transition-all'>
                    <Textarea
                        placeholder='Describe your trip idea...'
                        className='w-full h-24 bg-transparent border-none focus-visible:ring-0 shadow-none resize-none text-sm pr-12'
                        onChange={(e) => setUserInput(e.target.value)}
                        value={userInput}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), onSend())}
                    />
                    <Button 
                        size='icon' 
                        className='absolute bottom-4 right-4 h-9 w-9 shadow-sm hover:shadow-md transition-shadow' 
                        onClick={() => onSend()} 
                        disabled={loading || !userInput.trim()}
                    >
                        <Send className='h-4 w-4' />
                    </Button>
                </div>
                {/* Hint Text */}
                <p className='text-xs text-muted-foreground mt-2 text-center'>
                    Press <kbd className='px-1.5 py-0.5 bg-muted rounded text-xs border border-border'>Enter</kbd> to send
                </p>
            </section>
        </div>
    )
}

export default ChatBox
