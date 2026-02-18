import { useState, useEffect } from 'react';

type ToastType = {
    title: string;
    description?: string;
    variant?: 'default' | 'destructive';
};

export function useToast() {
    const [toasts, setToasts] = useState<ToastType[]>([]);

    const toast = (toastData: ToastType) => {
        // Simple console implementation for now
        console.log(`[Toast] ${toastData.title}: ${toastData.description}`);
        
        // You can add a proper toast UI library later
        // For now, just use alert for important messages
        if (toastData.variant === 'destructive') {
            alert(`Error: ${toastData.title}\n${toastData.description}`);
        }
    };

    return { toast };
}
