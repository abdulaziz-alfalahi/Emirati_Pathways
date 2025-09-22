
import { useState, useRef, useCallback } from 'react';

export interface SwipeDirection {
  direction: 'left' | 'right' | 'up' | 'down';
  distance: number;
}

export function useTouchInteractions() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const touchEndRef = useRef<{ x: number; y: number } | null>(null);

  // Haptic feedback (works on supported devices)
  const triggerHaptic = useCallback((type: 'light' | 'medium' | 'heavy' = 'light') => {
    if ('vibrate' in navigator) {
      const patterns = {
        light: [10],
        medium: [20],
        heavy: [50]
      };
      navigator.vibrate(patterns[type]);
    }
  }, []);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY
    };
  }, []);

  // Handle touch end and detect swipe
  const handleTouchEnd = useCallback((e: React.TouchEvent, onSwipe?: (swipe: SwipeDirection) => void) => {
    if (!touchStartRef.current) return;

    touchEndRef.current = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };

    const deltaX = touchEndRef.current.x - touchStartRef.current.x;
    const deltaY = touchEndRef.current.y - touchStartRef.current.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Minimum swipe distance
    if (distance < 50) return;

    let direction: SwipeDirection['direction'];
    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      direction = deltaX > 0 ? 'right' : 'left';
    } else {
      direction = deltaY > 0 ? 'down' : 'up';
    }

    triggerHaptic('light');
    onSwipe?.({ direction, distance });

    // Reset touch positions
    touchStartRef.current = null;
    touchEndRef.current = null;
  }, [triggerHaptic]);

  // Pull to refresh functionality
  const handlePullToRefresh = useCallback(async (refreshFn: () => Promise<void>) => {
    if (isRefreshing) return;
    
    setIsRefreshing(true);
    triggerHaptic('medium');
    
    try {
      await refreshFn();
    } finally {
      setTimeout(() => setIsRefreshing(false), 500); // Minimum refresh time for UX
    }
  }, [isRefreshing, triggerHaptic]);

  return {
    isRefreshing,
    triggerHaptic,
    handleTouchStart,
    handleTouchEnd,
    handlePullToRefresh
  };
}
