"use client"
import React, { useContext, useEffect, useState } from 'react'
import Header from './_components/Header';
import { useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { UserDetailContext, UserDetail } from '@/context/UserDetailContext';
import { TripContextType, TripDetailContext } from '@/context/tripDetail';
import { TripInfo } from './create-new-trip/_components/ChatBox';

function Provider({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {

    const CreateUser = useMutation(api.user.CreateNewUser)
    const [userDetail, setUserDetail] = useState<UserDetail | null>(null);
    const [tripDetailInfo, setTripDetailInfo] = useState<TripInfo | null>(null);
    const [isClient, setIsClient] = useState(false);

    const { user } = useUser();
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        user && CreateNewUser();
    }, [user])


    const CreateNewUser = async () => {
        if (user) {
            // Save New User if Not Exist
            const result = await CreateUser({
                email: user?.primaryEmailAddress?.emailAddress ?? '',
                imageUrl: user?.imageUrl,
                name: user?.fullName ?? ''
            });
            setUserDetail(result);
        }
    }

    return (
        <UserDetailContext.Provider value={{ userDetail, setUserDetail }}>
            <TripDetailContext.Provider value={{ tripDetailInfo, setTripDetailInfo }}>
                <>
                    {isClient && <Header />}
                    {children}
                </>
            </TripDetailContext.Provider>
        </UserDetailContext.Provider>
    )
}

export default Provider

export const useUserDetail = () => {
    const context = useContext(UserDetailContext);
    if (!context) {
        throw new Error('useUserDetail must be used within UserDetailContext.Provider');
    }
    return context;
}

export const useTripDetail = () => {
    const context = useContext(TripDetailContext);
    if (!context) {
        throw new Error('useTripDetail must be used within TripDetailContext.Provider');
    }
    return context;
}