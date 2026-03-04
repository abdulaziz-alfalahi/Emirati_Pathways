
import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { WifiOff } from 'lucide-react';

/**
 * Renders a slim banner at the top of the viewport when the Socket.IO
 * connection drops. Shows after a 2-second delay to avoid flashing on
 * quick reconnects.
 */
const ConnectionBanner: React.FC = () => {
    const { isConnected } = useNotifications();
    const [showBanner, setShowBanner] = useState(false);

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        if (!isConnected) {
            // Wait 2s before showing to avoid flash on quick reconnects
            timer = setTimeout(() => setShowBanner(true), 2000);
        } else {
            setShowBanner(false);
        }

        return () => {
            if (timer) clearTimeout(timer);
        };
    }, [isConnected]);

    if (!showBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500/95 text-white text-center py-1.5 text-sm font-medium shadow-md backdrop-blur-sm animate-pulse">
            <div className="flex items-center justify-center gap-2">
                <WifiOff className="h-4 w-4" />
                Reconnecting to real-time services…
            </div>
        </div>
    );
};

export default ConnectionBanner;
