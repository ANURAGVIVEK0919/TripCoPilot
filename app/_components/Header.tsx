/**
 * Header Component
 * 
 * Main navigation header displayed across all pages
 * Features:
 * - Logo and app name
 * - Navigation menu with active state
 * - Authentication buttons (Sign In / User Profile)
 * - Notification bell for authenticated users
 * - Conditional "My Trips" link (auth required)
 * 
 * @component
 */

"use client"
import { Button } from '@/components/ui/button'
import { SignInButton, UserButton, useUser } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useEffect } from 'react'
import { useTripDetail, useUserDetail } from '../provider'
import NotificationBell from './NotificationBell'

/**
 * Navigation menu configuration
 * - requireAuth flag hides menu item when user not logged in
 */
const menuOptions = [
    {
        name: 'Home',
        path: '/'
    },
    {
        name: 'My Trips',
        path: '/my-trips',
        requireAuth: true // Only show when logged in
    },
    {
        name: 'Community',
        path: '/community'
    },
    {
        name: 'Pricing',
        path: '/pricing'
    },
    {
        name: 'Contact us',
        path: '/contact-us'
    }
];

function Header() {
    // Global trip detail state (for current viewing/editing trip)
    //@ts-ignore
    const { tripDetailInfo, setTripDetailInfo } = useTripDetail();
    
    // Current user's Convex database record
    const { userDetail } = useUserDetail();

    // Clerk authentication state
    const { user } = useUser();
    
    // Current route path for active link highlighting
    const path = usePathname();



    return (
        <div className='flex justify-between items-center p-4 shadow'>
            
            {/* Logo and Brand Name */}
            <div className='flex gap-2 items-center'>
                <Image src={'/logo.svg'} alt='logo' width={30} height={30} />
                <h2 className='font-bold text-2xl'>AI Trip Planner</h2>
            </div>
            
            {/* Navigation Menu - filters out auth-required items when not logged in */}
            <div className='flex gap-8 items-center'>
                {menuOptions.map((menu, index) => {
                    // Hide "My Trips" if user is not logged in
                    //@ts-ignore
                    if (menu.requireAuth && !user) return null;
                    
                    return (
                        <Link key={menu.path} href={menu.path}>
                            {/* Highlight active route with primary color and bold */}
                            <h2 className={`text-lg hover:scale-105 transition-all hover:text-primary ${path === menu.path ? 'text-primary font-bold' : ''}`}>
                                {menu.name}
                            </h2>
                        </Link>
                    );
                })}
            </div>
            
            {/* Authentication Section - Sign In button or User Profile */}
            <div className='flex gap-5 items-center'>
                {!user ? (
                    /* Show Sign In button for unauthenticated users */
                    <SignInButton mode='modal'>
                        <Button>Get Started</Button>
                    </SignInButton>
                ) : (
                    <>
                        {/* Notification Bell - only for authenticated users */}
                        {userDetail?._id && <NotificationBell userId={userDetail._id} />}
                        
                        {/* Context-aware CTA button */}
                        {path == '/create-new-trip' ? (
                            <Link href={'/my-trips'}>
                                <Button>My Trips</Button>
                            </Link>
                        ) : (
                            <Link href={'/create-new-trip'}>
                                <Button onClick={() => setTripDetailInfo(null)}>Create New trip</Button>
                            </Link>
                        )}
                    </>
                )}
                <UserButton />
            </div>
        </div>
    )
}

export default Header