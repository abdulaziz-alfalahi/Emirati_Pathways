
import React, { useState, useRef, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobilePullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
}

const MobilePullToRefresh: React.FC<MobilePullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0) {
      startY.current = e.touches[0].clientY;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (isRefreshing || containerRef.current?.scrollTop !== 0) return;

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    if (distance > 0) {
      e.preventDefault();
      setPullDistance(Math.min(distance * 0.5, threshold * 1.5));
      setCanRefresh(distance > threshold);
    }
  };

  const handleTouchEnd = async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    setPullDistance(0);
    setCanRefresh(false);
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull to refresh indicator */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 flex items-center justify-center transition-transform duration-200 z-10",
          "bg-gradient-to-b from-white to-transparent py-4"
        )}
        style={{
          transform: `translateY(${pullDistance - 60}px)`,
          opacity: pullDistance > 20 ? 1 : 0
        }}
      >
        <div className="flex items-center space-x-2 text-emirati-teal">
          <RefreshCw
            className={cn(
              "h-5 w-5 transition-transform duration-200",
              isRefreshing && "animate-spin",
              canRefresh && !isRefreshing && "rotate-180"
            )}
          />
          <span className="text-sm font-medium">
            {isRefreshing
              ? 'Refreshing...'
              : canRefresh
              ? 'Release to refresh'
              : 'Pull to refresh'}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className="transition-transform duration-200"
        style={{ transform: `translateY(${pullDistance}px)` }}
      >
        {children}
      </div>
    </div>
  );
};

export default MobilePullToRefresh;
