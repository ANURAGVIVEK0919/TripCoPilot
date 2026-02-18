"use client"
import React, { useState, useEffect, useRef } from 'react'
import { useUser } from '@clerk/nextjs'
import { useMutation, useQuery, useAction } from 'convex/react'
import { api } from '@/convex/_generated/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { 
    MessageCircle, Send, Bot, User, Sparkles, Trash2, Plus,
    TrendingUp, DollarSign, Package, MapPin, AlertCircle, X,
    History, Loader2
} from 'lucide-react'
import { useUserDetail } from '@/app/provider'
import { Id } from '@/convex/_generated/dataModel'
import Image from 'next/image'

interface AIChatProps {
    tripId?: string
    tripName?: string
}

const QUICK_ACTIONS = [
    { label: '💰 Check my budget status', query: 'How am I doing with my budget?' },
    { label: '🎒 What should I pack?', query: 'What should I pack for this trip?' },
    { label: '📊 Analyze my expenses', query: 'Analyze my spending patterns' },
    { label: '💡 Give me travel tips', query: 'Give me tips for my destination' },
    { label: '📅 Optimize my itinerary', query: 'How can I optimize my itinerary?' },
    { label: '🌤️ What\'s the weather?', query: 'What\'s the weather like at my destination?' },
]

function AIChat({ tripId, tripName }: AIChatProps) {
    const { user } = useUser()
    const { userDetail } = useUserDetail()
    
    const [message, setMessage] = useState('')
    const [currentConversationId, setCurrentConversationId] = useState<Id<"ChatConversations"> | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Queries
    const conversations = useQuery(
        api.aiChat.getUserConversations,
        userDetail?._id ? { userId: userDetail._id, tripId } : 'skip'
    )
    
    const conversationData = useQuery(
        api.aiChat.getConversationWithMessages,
        currentConversationId ? { conversationId: currentConversationId } : 'skip'
    )

    // Mutations & Actions
    const sendChat = useAction(api.aiChat.sendChatMessage)
    const deleteConversation = useMutation(api.aiChat.deleteConversation)

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [conversationData?.messages])

    // Auto-select first conversation or create new
    useEffect(() => {
        if (conversations && conversations.length > 0 && !currentConversationId) {
            setCurrentConversationId(conversations[0]._id)
        }
    }, [conversations, currentConversationId])

    const handleSendMessage = async (customMessage?: string) => {
        const msgToSend = customMessage || message
        if (!msgToSend.trim() || !userDetail?._id) return

        setIsLoading(true)
        setMessage('')

        try {
            const result = await sendChat({
                conversationId: currentConversationId || undefined,
                userId: userDetail._id,
                message: msgToSend,
                tripId: tripId,
            })

            if (!currentConversationId) {
                setCurrentConversationId(result.conversationId)
            }
        } catch (error) {
            console.error('Chat error:', error)
            alert('Failed to send message. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleNewConversation = () => {
        setCurrentConversationId(null)
    }

    const handleDeleteConversation = async (convId: Id<"ChatConversations">) => {
        if (confirm('Delete this conversation?')) {
            await deleteConversation({ conversationId: convId })
            if (currentConversationId === convId) {
                setCurrentConversationId(null)
            }
        }
    }

    const handleQuickAction = (query: string) => {
        setMessage(query)
        handleSendMessage(query)
    }

    if (!user || !userDetail) {
        return (
            <Card>
                <CardContent className='py-12 text-center'>
                    <Bot className='mx-auto mb-4 text-gray-300' size={48} />
                    <p className='text-gray-500'>Please sign in to use AI Travel Assistant</p>
                </CardContent>
            </Card>
        )
    }

    const messages = conversationData?.messages || []
    const hasMessages = messages.length > 0

    return (
        <div className='flex h-full gap-2'>
            {/* Sidebar - Conversation History */}
            <div className={`${showSidebar ? 'block' : 'hidden'} w-64 flex-shrink-0`}>
                <Card className='h-full flex flex-col'>
                    <CardHeader className='border-b'>
                        <div className='flex items-center justify-between'>
                            <CardTitle className='text-sm flex items-center gap-2'>
                                <History size={16} />
                                Conversations
                            </CardTitle>
                            <Button
                                size='sm'
                                variant='ghost'
                                onClick={handleNewConversation}
                            >
                                <Plus size={16} />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className='flex-1 overflow-y-auto p-2'>
                        <div className='space-y-2'>
                            {conversations?.map((conv) => (
                                <div
                                    key={conv._id}
                                    onClick={() => setCurrentConversationId(conv._id)}
                                    className={`w-full text-left p-3 rounded-lg transition-all cursor-pointer ${
                                        currentConversationId === conv._id
                                            ? 'bg-blue-50 border-2 border-blue-500'
                                            : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                                    }`}
                                >
                                    <div className='flex items-start justify-between gap-2'>
                                        <div className='flex-1 min-w-0'>
                                            <p className='text-sm font-medium truncate'>
                                                {conv.title}
                                            </p>
                                            <p className='text-xs text-gray-500 mt-1'>
                                                {conv.messageCount} messages
                                            </p>
                                            <p className='text-xs text-gray-400'>
                                                {new Date(conv.lastMessageAt).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button
                                            size='sm'
                                            variant='ghost'
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                handleDeleteConversation(conv._id)
                                            }}
                                            className='flex-shrink-0'
                                        >
                                            <Trash2 size={14} className='text-red-500' />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {(!conversations || conversations.length === 0) && (
                            <div className='text-center py-8 text-gray-500 text-sm'>
                                No conversations yet
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Main Chat Area */}
            <div className='flex-1 flex flex-col min-w-0'>
                <Card className='flex-1 flex flex-col h-full overflow-hidden'>
                    {/* Chat Header */}
                    <CardHeader className='border-b bg-gradient-to-r from-purple-50 to-blue-50 py-3'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-2'>
                                <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center'>
                                    <Bot className='text-white' size={18} />
                                </div>
                                <div>
                                    <CardTitle className='flex items-center gap-2 text-sm'>
                                        AI Travel Assistant
                                        <Sparkles className='text-yellow-500' size={14} />
                                    </CardTitle>
                                    {tripName && (
                                        <p className='text-xs text-gray-600 mt-0.5'>
                                            {tripName}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant='ghost'
                                size='sm'
                                onClick={() => setShowSidebar(!showSidebar)}
                                className='h-8 w-8 p-0'
                            >
                                <History size={18} />
                            </Button>
                        </div>
                    </CardHeader>

                    {/* Messages Area */}
                    <CardContent className='flex-1 overflow-y-auto p-3 space-y-3'>
                        {!hasMessages && !isLoading && (
                            <div className='h-full flex flex-col items-center justify-center text-center p-8'>
                                <div className='w-20 h-20 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full flex items-center justify-center mb-4'>
                                    <Bot className='text-purple-600' size={40} />
                                </div>
                                <h3 className='text-xl font-bold text-gray-900 mb-2'>
                                    Welcome to AI Travel Assistant! 👋
                                </h3>
                                <p className='text-gray-600 mb-6 max-w-md'>
                                    I can help you plan trips, analyze budgets, suggest packing lists, and answer travel questions.
                                </p>
                                
                                {/* Quick Actions */}
                                <div className='w-full max-w-2xl'>
                                    <p className='text-sm font-semibold text-gray-700 mb-3'>Quick Actions:</p>
                                    <div className='grid md:grid-cols-2 gap-2'>
                                        {QUICK_ACTIONS.map((action, index) => (
                                            <button
                                                key={index}
                                                onClick={() => handleQuickAction(action.query)}
                                                className='text-left p-3 border-2 border-gray-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all text-sm'
                                            >
                                                {action.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Messages */}
                        {messages.map((msg) => (
                            <div
                                key={msg._id}
                                className={`flex gap-3 ${
                                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                                }`}
                            >
                                {/* Avatar */}
                                <div className='flex-shrink-0'>
                                    {msg.role === 'user' ? (
                                        <div className='w-8 h-8 rounded-full overflow-hidden bg-gray-200'>
                                            {user.imageUrl ? (
                                                <Image
                                                    src={user.imageUrl}
                                                    alt='You'
                                                    width={32}
                                                    height={32}
                                                />
                                            ) : (
                                                <User className='w-full h-full p-1 text-gray-600' />
                                            )}
                                        </div>
                                    ) : (
                                        <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center'>
                                            <Bot className='text-white' size={18} />
                                        </div>
                                    )}
                                </div>

                                {/* Message Bubble */}
                                <div
                                    className={`flex-1 max-w-[80%] ${
                                        msg.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-900'
                                    } rounded-2xl px-4 py-3`}
                                >
                                    <p className='text-sm whitespace-pre-wrap'>{msg.content}</p>
                                    
                                    {/* Action Badge */}
                                    {msg.context?.actionTaken && (
                                        <div className='mt-2 pt-2 border-t border-gray-300'>
                                            <span className='text-xs bg-white/20 px-2 py-1 rounded-full'>
                                                {getActionLabel(msg.context.actionTaken)}
                                            </span>
                                        </div>
                                    )}
                                    
                                    <p className='text-xs opacity-70 mt-2'>
                                        {new Date(msg.createdAt).toLocaleTimeString()}
                                    </p>
                                </div>
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className='flex gap-3'>
                                <div className='w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center'>
                                    <Bot className='text-white' size={18} />
                                </div>
                                <div className='bg-gray-100 rounded-2xl px-4 py-3'>
                                    <Loader2 className='animate-spin text-gray-600' size={20} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </CardContent>

                    {/* Input Area */}
                    <div className='border-t p-3 bg-gray-50 flex-shrink-0'>
                        {hasMessages && (
                            <div className='mb-3 flex gap-2 flex-wrap'>
                                {QUICK_ACTIONS.slice(0, 3).map((action, index) => (
                                    <button
                                        key={index}
                                        onClick={() => handleQuickAction(action.query)}
                                        disabled={isLoading}
                                        className='text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-full hover:border-purple-400 hover:bg-purple-50 transition-all disabled:opacity-50'
                                    >
                                        {action.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        <div className='flex gap-2'>
                            <Input
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyPress={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault()
                                        handleSendMessage()
                                    }
                                }}
                                placeholder='Ask me anything about your trip...'
                                disabled={isLoading}
                                className='flex-1'
                            />
                            <Button
                                onClick={() => handleSendMessage()}
                                disabled={!message.trim() || isLoading}
                                className='bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600'
                            >
                                {isLoading ? (
                                    <Loader2 className='animate-spin' size={18} />
                                ) : (
                                    <Send size={18} />
                                )}
                            </Button>
                        </div>
                        
                        <p className='text-xs text-gray-500 mt-2 text-center'>
                            AI can make mistakes. Verify important information.
                        </p>
                    </div>
                </Card>
            </div>
        </div>
    )
}

function getActionLabel(action: string): string {
    const labels: Record<string, string> = {
        'packing_suggestion': '🎒 Packing Advice',
        'budget_analysis': '💰 Budget Analysis',
        'recommendation': '💡 Recommendation',
        'weather_info': '🌤️ Weather Info',
    }
    return labels[action] || action
}

export default AIChat
