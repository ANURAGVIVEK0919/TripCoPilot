"use client"
import EditableItinerary from '../_components/EditableItinerary';
import { Trip } from '@/app/my-trips/page';
import { useTripDetail, useUserDetail } from '@/app/provider';
import { api } from '@/convex/_generated/api';
import { useConvex, useQuery, useMutation } from 'convex/react';
import { useParams, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'
import ShareTripDialog from '../_components/ShareTripDialog';
import ExpenseTracker from '../_components/ExpenseTracker';
import BudgetSettings from '../_components/BudgetSettings';
import BudgetAnalytics from '../_components/BudgetAnalytics';
import SettlementTracker from '../_components/SettlementTracker';
import PackingListManager from '../_components/PackingListManager';
import AIChat from '@/app/_components/AIChat';
import WeatherWidget from '../_components/WeatherWidget';
import AlertsPanel from '../_components/AlertsPanel';
import BookingsPanel from '../_components/BookingsPanel';
import SocialMediaGenerator from '../_components/SocialMediaGenerator';
import { Users, Activity, Trash2, Wallet, BarChart3, Receipt, HandCoins, Briefcase, Bot, Bell, Calendar, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function ViewTrip() {

    const { tripid } = useParams();
    const router = useRouter();
    const { userDetail, setUserDetail } = useUserDetail();
    const convex = useConvex();
    const [tripData, setTripData] = useState<Trip>();
    const { tripDetailInfo, setTripDetailInfo } = useTripDetail();
    const [isDeleting, setIsDeleting] = useState(false);
    const [activeTab, setActiveTab] = useState<'itinerary' | 'expenses' | 'analytics' | 'settlements' | 'packing' | 'bookings' | 'ai-assistant' | 'alerts' | 'social'>('itinerary');
    
    // Get user permission for this trip
    const permission = useQuery(
        api.tripSharing.getUserPermission,
        userDetail?._id ? { tripId: tripid as string, userId: userDetail._id } : 'skip'
    );

    // Get collaborators
    const collaborators = useQuery(
        api.tripSharing.getCollaborators,
        { tripId: tripid as string }
    );

    // Get trip budget for currency
    const tripBudget = useQuery(
        api.expenses.getTripBudget,
        { tripId: tripid as string }
    );
    const activeCurrency = tripBudget?.currency || 'USD';

    // Delete mutation
    const deleteTrip = useMutation(api.tripDetail.DeleteTrip);

    useEffect(() => {
        userDetail && GetTrip()
    }, [userDetail])

    const GetTrip = async () => {
        if (!userDetail?._id) {
            console.error('User detail not loaded');
            return;
        }
        const result = await convex.query(api.tripDetail.GetTripById, {
            uid: userDetail._id,
            tripid: tripid + ''
        });
        console.log(result);
        if (result) {
            setTripData(result as any);
            setTripDetailInfo(result?.tripDetail)
        }
    }

    const isOwner = permission?.role === 'owner';
    const canEdit = permission?.canEdit || false;

    const handleDeleteTrip = async () => {
        const confirmed = window.confirm(
            '⚠️ Are you sure you want to delete this trip?\n\nThis action cannot be undone and will remove:\n• All trip details\n• All collaborators\n• All sharing settings'
        );

        if (!confirmed) return;

        setIsDeleting(true);
        try {
            await deleteTrip({
                tripId: tripid as string,
                uid: userDetail!._id
            });

            alert('✅ Trip deleted successfully!');
            router.push('/my-trips');
        } catch (error: any) {
            alert(`❌ Failed to delete trip: ${error.message}`);
            setIsDeleting(false);
        }
    };

    return (
        <div className='flex flex-col h-screen bg-transparent'>
            {/* Top Bar with Trip Info and Actions */}
            <div className='border-b bg-white p-4 shadow-sm z-10'>
                <div className='max-w-7xl mx-auto flex items-center justify-between'>
                    <div>
                        <h1 className='text-2xl font-bold text-gray-800'>
                            {tripDetailInfo?.destination || 'Trip Details'}
                        </h1>
                        <p className='text-sm text-gray-500 mt-1'>
                            {tripDetailInfo?.duration || 'N/A'} • {tripDetailInfo?.group_size || 'Solo'}
                        </p>
                    </div>

                    <div className='flex items-center gap-3'>
                        {/* Collaborators Count */}
                        {collaborators && collaborators.length > 1 && (
                            <div className='flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg'>
                                <Users className='h-4 w-4' />
                                <span>{collaborators.length} {collaborators.length === 1 ? 'person' : 'people'}</span>
                            </div>
                        )}

                        {/* Share Button */}
                        {userDetail?._id && (
                            <ShareTripDialog
                                tripId={tripid as string}
                                userId={userDetail._id}
                                isOwner={isOwner}
                            />
                        )}

                        {/* Delete Button - Owner Only */}
                        {isOwner && (
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeleteTrip}
                                disabled={isDeleting}
                            >
                                <Trash2 className='h-4 w-4 mr-2' />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button>
                        )}

                        {/* Edit Mode Indicator */}
                        {canEdit && !isOwner && (
                            <span className='text-xs bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg font-medium'>
                                ✏️ Editor
                            </span>
                        )}

                        {!canEdit && !isOwner && (
                            <span className='text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium'>
                                👀 View Only
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className='border-b bg-white'>
                <div className='max-w-7xl mx-auto px-4'>
                    <div className='flex gap-1'>
                        <button
                            onClick={() => setActiveTab('itinerary')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'itinerary'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Activity className='h-4 w-4' />
                            Itinerary
                        </button>
                        <button
                            onClick={() => setActiveTab('expenses')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'expenses'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Receipt className='h-4 w-4' />
                            Expenses
                        </button>
                        <button
                            onClick={() => setActiveTab('analytics')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'analytics'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <BarChart3 className='h-4 w-4' />
                            Analytics
                        </button>
                        <button
                            onClick={() => setActiveTab('settlements')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'settlements'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <HandCoins className='h-4 w-4' />
                            Settlements
                        </button>
                        <button
                            onClick={() => setActiveTab('packing')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'packing'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Briefcase className='h-4 w-4' />
                            Packing List
                        </button>
                        <button
                            onClick={() => setActiveTab('bookings')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'bookings'
                                    ? 'border-purple-600 text-purple-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Calendar className='h-4 w-4' />
                            Bookings
                        </button>
                        <button
                            onClick={() => setActiveTab('ai-assistant')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'ai-assistant'
                                    ? 'border-blue-600 text-blue-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Bot className='h-4 w-4' />
                            AI Assistant
                        </button>
                        <button
                            onClick={() => setActiveTab('alerts')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'alerts'
                                    ? 'border-orange-600 text-orange-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Bell className='h-4 w-4' />
                            Alerts
                        </button>
                        <button
                            onClick={() => setActiveTab('social')}
                            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-all ${
                                activeTab === 'social'
                                    ? 'border-pink-600 text-pink-600 font-semibold'
                                    : 'border-transparent text-gray-600 hover:text-gray-800'
                            }`}
                        >
                            <Share2 className='h-4 w-4' />
                            Social Media
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='flex-1 overflow-hidden p-4 max-w-7xl mx-auto w-full'>
                <div className='h-full bg-white rounded-xl shadow-sm overflow-hidden flex flex-col'>
                    {activeTab === 'itinerary' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-blue-50 to-indigo-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <Activity className='h-5 w-5 text-blue-600' />
                                    Trip Itinerary
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    Detailed day-by-day plan for your journey
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-4 space-y-4'>
                                {/* Weather Widget */}
                                {tripDetailInfo?.destination && (
                                    <WeatherWidget 
                                        destination={tripDetailInfo.destination}
                                        tripId={tripid as string}
                                    />
                                )}
                                
                                {/* Editable Itinerary Content */}
                                <EditableItinerary />
                            </div>
                        </>
                    )}

                    {activeTab === 'expenses' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-green-50 to-emerald-50 flex items-center justify-between'>
                                <div>
                                    <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                        <Wallet className='h-5 w-5 text-green-600' />
                                        Expense Tracker
                                    </h2>
                                    <p className='text-xs text-gray-500 mt-1'>
                                        Track and manage your trip expenses
                                    </p>
                                </div>
                                <BudgetSettings tripId={tripid as string} />
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                <ExpenseTracker 
                                    tripId={tripid as string} 
                                    tripCurrency={activeCurrency}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'analytics' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <BarChart3 className='h-5 w-5 text-purple-600' />
                                    Budget Analytics
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    Visualize your spending patterns and budget health
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                <BudgetAnalytics 
                                    tripId={tripid as string}
                                    currency={activeCurrency}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'settlements' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-orange-50 to-yellow-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <HandCoins className='h-5 w-5 text-orange-600' />
                                    Settlements & Split Expenses
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    Track who owes whom and settle up expenses
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                <SettlementTracker 
                                    tripId={tripid as string}
                                    currency={activeCurrency}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'packing' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <Briefcase className='h-5 w-5 text-blue-600' />
                                    Packing Lists
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    AI-powered packing lists with smart categorization
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                <PackingListManager 
                                    tripId={tripid as string}
                                    tripDestination={tripDetailInfo?.destination || 'Unknown Destination'}
                                    tripDuration={tripDetailInfo?.duration ? parseInt(tripDetailInfo.duration.split(' ')[0]) : undefined}
                                    tripActivities={undefined}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'bookings' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-purple-50 to-pink-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <Calendar className='h-5 w-5 text-purple-600' />
                                    Bookings & Reservations
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    Manage flights, hotels, restaurants, and get automatic reminders
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                {userDetail?._id && (
                                    <BookingsPanel 
                                        tripId={tripid as string}
                                        userId={userDetail._id}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'ai-assistant' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <Bot className='h-5 w-5 text-purple-600' />
                                    AI Travel Assistant
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    Ask me anything about your trip - budget, packing, suggestions, and more!
                                </p>
                            </div>
                            <div className='overflow-hidden flex-1 p-6'>
                                <AIChat 
                                    tripId={tripid as string}
                                    tripName={tripDetailInfo?.destination || 'Your Trip'}
                                />
                            </div>
                        </>
                    )}

                    {activeTab === 'alerts' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-orange-50 to-yellow-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <Bell className='h-5 w-5 text-orange-600' />
                                    Travel Alerts & Reminders
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    Weather alerts, packing reminders, budget warnings, and more
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                {userDetail?._id && (
                                    <AlertsPanel 
                                        userId={userDetail._id}
                                        tripId={tripid as string}
                                    />
                                )}
                            </div>
                        </>
                    )}

                    {activeTab === 'social' && (
                        <>
                            <div className='p-4 border-b bg-gradient-to-r from-pink-50 to-purple-50'>
                                <h2 className='text-lg font-semibold text-gray-800 flex items-center gap-2'>
                                    <Share2 className='h-5 w-5 text-pink-600' />
                                    Social Media Generator
                                </h2>
                                <p className='text-xs text-gray-500 mt-1'>
                                    AI-powered posts for Instagram, Facebook, and WhatsApp Status
                                </p>
                            </div>
                            <div className='overflow-y-auto flex-1 p-6'>
                                {userDetail?._id && (
                                    <SocialMediaGenerator 
                                        tripId={tripid as string}
                                        userId={userDetail._id}
                                    />
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default ViewTrip