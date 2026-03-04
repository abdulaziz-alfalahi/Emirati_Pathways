
import React from 'react';

interface OnlineIndicatorProps {
    isOnline: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

/**
 * Renders a small coloured dot: green when online, grey when offline.
 * It is typically positioned absolutely over an avatar.
 */
const OnlineIndicator: React.FC<OnlineIndicatorProps> = ({
    isOnline,
    size = 'sm',
    className = '',
}) => {
    const sizeMap = {
        sm: 'h-3 w-3',
        md: 'h-3.5 w-3.5',
        lg: 'h-4 w-4',
    };

    return (
        <span
            className={`inline-block rounded-full ring-2 ring-background z-10 ${sizeMap[size]} ${isOnline ? 'bg-green-500' : 'bg-gray-400'
                } ${className}`}
            title={isOnline ? 'Online' : 'Offline'}
        />
    );
};

export default OnlineIndicator;
