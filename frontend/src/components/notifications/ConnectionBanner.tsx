
import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/components/notifications/NotificationSystem';
import { WifiOff } from 'lucide-react';

/**
 * Renders a slim banner at the top of the viewport when a previously
 * established Socket.IO connection drops. Does NOT show if Socket.IO
 * was never connected (e.g. server not deployed), since the app falls
 * back to REST polling gracefully.
 */
const ConnectionBanner: React.FC = () => {
    const { isConnected } = useNotifications();
    const [showBanner, setShowBanner] = useState(false);
    const wasEverConnected = useRef(false);

    useEffect(() => {
        if (isConnected) {
            wasEverConnected.current = true;
            setShowBanner(false);
        }
    }, [isConnected]);

    useEffect(() => {
        let timer: NodeJS.Timeout | undefined;

        if (!isConnected && wasEverConnected.current) {
            // Only show banner if we HAD a connection and lost it
            timer = setTimeout(() => setShowBanner(true), 5000);
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
