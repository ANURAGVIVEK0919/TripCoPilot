/**
 * Notification Bell Component
 * 
 * Displays real-time notifications for user interactions
 * Features:
 * - Bell icon with unread count badge
 * - Dropdown panel with notification list
 * - Mark as read / Mark all as read
 * - Delete individual notifications
 * - Navigate to related community story on click
 * - Real-time updates via Convex subscriptions
 * 
 * @component
 * @param {Id<'UserTable'>} userId - Current user's Convex ID
 */

"use client"

import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Bell, Heart, MessageCircle, X, Check } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

interface NotificationBellProps {
    userId: Id<'UserTable'>;
}

export default function NotificationBell({ userId }: NotificationBellProps) {
    // Dropdown open/close state
    const [isOpen, setIsOpen] = useState(false);

    // Real-time queries - automatically update when data changes
    const notifications = useQuery(api.notifications.getUserNotifications, { userId, limit: 20 });
    const unreadCount = useQuery(api.notifications.getUnreadCount, { userId });
    
    // Mutations for user actions
    const markAsRead = useMutation(api.notifications.markAsRead);
    const markAllAsRead = useMutation(api.notifications.markAllAsRead);
    const deleteNotification = useMutation(api.notifications.deleteNotification);

    /**
     * Handle notification click
     * - Marks notification as read
     * - Navigates to the related community story
     */
    const handleNotificationClick = async (notificationId: Id<'Notifications'>, storyId: Id<'CommunityStories'>) => {
        await markAsRead({ notificationId });
        // Navigate to the story
        window.location.href = `/community#story-${storyId}`;
        setIsOpen(false);
    };

    /**
     * Mark all notifications as read
     */
    const handleMarkAllRead = async () => {
        await markAllAsRead({ userId });
    };

    /**
     * Delete a specific notification
     * @param {React.MouseEvent} e - Click event (stopped from bubbling to parent)
     */
    const handleDelete = async (notificationId: Id<'Notifications'>, e: React.MouseEvent) => {
        e.stopPropagation();
        await deleteNotification({ notificationId });
    };

    /**
     * Format timestamp into human-readable relative time
     * Examples: "Just now", "5m ago", "2h ago", "3d ago"
     */
    const formatTime = (timestamp: number) => {
        const now = Date.now();
        const diff = now - timestamp;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        if (days < 7) return `${days}d ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    return (
        <div className='relative'>
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className='relative p-2 hover:bg-gray-100 rounded-full transition'
            >
                <Bell className='h-6 w-6 text-gray-700' />
                {unreadCount && unreadCount > 0 && (
                    <span className='absolute top-0 right-0 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold'>
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className='fixed inset-0 z-40'
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Notification Panel */}
                    <div className='absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50 max-h-[500px] overflow-hidden flex flex-col'>
                        {/* Header */}
                        <div className='p-4 border-b flex items-center justify-between'>
                            <h3 className='font-bold text-lg'>Notifications</h3>
                            {notifications && notifications.length > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className='text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1'
                                >
                                    <Check className='h-4 w-4' />
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className='overflow-y-auto flex-1'>
                            {!notifications || notifications.length === 0 ? (
                                <div className='p-8 text-center text-gray-500'>
                                    <Bell className='h-12 w-12 mx-auto mb-2 text-gray-300' />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className='divide-y'>
                                    {notifications.map((notification: any) => (
                                        <div
                                            key={notification._id}
                                            onClick={() => handleNotificationClick(notification._id, notification.storyId)}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition ${
                                                !notification.isRead ? 'bg-blue-50' : ''
                                            }`}
                                        >
                                            <div className='flex gap-3'>
                                                {/* Actor Image */}
                                                <img
                                                    src={notification.actorImage || '/placeholder.jpg'}
                                                    alt={notification.actorName}
                                                    className='h-10 w-10 rounded-full'
                                                />

                                                {/* Content */}
                                                <div className='flex-1 min-w-0'>
                                                    <div className='flex items-start justify-between gap-2'>
                                                        <div className='flex-1'>
                                                            <p className='text-sm'>
                                                                <span className='font-semibold'>{notification.actorName}</span>
                                                                {notification.type === 'like' ? (
                                                                    <span> liked your story </span>
                                                                ) : (
                                                                    <span> commented on your story </span>
                                                                )}
                                                                <span className='font-medium text-gray-700'>"{notification.storyTitle}"</span>
                                                            </p>
                                                            {notification.type === 'comment' && notification.commentText && (
                                                                <p className='text-sm text-gray-600 mt-1 line-clamp-2'>
                                                                    "{notification.commentText}"
                                                                </p>
                                                            )}
                                                            <p className='text-xs text-gray-500 mt-1'>
                                                                {formatTime(notification.createdAt)}
                                                            </p>
                                                        </div>

                                                        {/* Icon & Delete */}
                                                        <div className='flex items-center gap-2'>
                                                            {notification.type === 'like' ? (
                                                                <Heart className='h-5 w-5 text-red-500 fill-current' />
                                                            ) : (
                                                                <MessageCircle className='h-5 w-5 text-blue-500' />
                                                            )}
                                                            <button
                                                                onClick={(e) => handleDelete(notification._id, e)}
                                                                className='p-1 hover:bg-gray-200 rounded'
                                                            >
                                                                <X className='h-4 w-4 text-gray-500' />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications && notifications.length > 0 && (
                            <div className='p-3 border-t bg-gray-50 text-center'>
                                <Link
                                    href='/community'
                                    className='text-sm text-blue-600 hover:text-blue-700 font-medium'
                                    onClick={() => setIsOpen(false)}
                                >
                                    View Community
                                </Link>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
