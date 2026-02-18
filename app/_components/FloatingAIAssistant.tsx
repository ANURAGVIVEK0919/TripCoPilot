"use client"
import React, { useState } from 'react'
import { Bot, X, Minimize2, Maximize2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import AIChat from './AIChat'
import { useUserDetail } from '../provider'

function FloatingAIAssistant() {
    const [isOpen, setIsOpen] = useState(false)
    const [isMinimized, setIsMinimized] = useState(false)
    const { userDetail } = useUserDetail()

    if (!userDetail) return null

    return (
        <>
            {/* Floating Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className='fixed bottom-6 right-6 w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform z-50 animate-pulse hover:animate-none'
                    aria-label='Open AI Assistant'
                >
                    <Bot className='text-white' size={32} />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`fixed z-50 ${
                        isMinimized
                            ? 'bottom-6 right-6 w-80 h-16'
                            : 'bottom-6 right-6 w-[450px] h-[650px]'
                    }`}
                    style={{
                        transition: 'all 0.3s ease-in-out'
                    }}
                >
                    <Card className='h-full flex flex-col shadow-2xl'>
                        {/* Header */}
                        <div className='flex items-center justify-between p-3 border-b bg-gradient-to-r from-purple-50 to-blue-50'>
                            <div className='flex items-center gap-2'>
                                <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center'>
                                    <Bot className='text-white' size={18} />
                                </div>
                                <span className='font-semibold text-sm'>AI Travel Assistant</span>
                            </div>
                            <div className='flex gap-1'>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setIsMinimized(!isMinimized)}
                                >
                                    {isMinimized ? (
                                        <Maximize2 size={16} />
                                    ) : (
                                        <Minimize2 size={16} />
                                    )}
                                </Button>
                                <Button
                                    variant='ghost'
                                    size='sm'
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X size={16} />
                                </Button>
                            </div>
                        </div>

                        {/* Chat Content */}
                        {!isMinimized && (
                            <div className='flex-1 overflow-hidden' style={{ height: 'calc(650px - 60px)' }}>
                                <AIChat />
                            </div>
                        )}
                    </Card>
                </div>
            )}
        </>
    )
}

export default FloatingAIAssistant
