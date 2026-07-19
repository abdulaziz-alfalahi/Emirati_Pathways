
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTouchInteractions, SwipeDirection } from '@/hooks/use-touch-interactions';
import { Trash2, Heart, BookmarkPlus, Share } from 'lucide-react';

interface SwipeAction {
  icon: React.ElementType;
  label: string;
  color: string;
  action: () => void;
}

interface MobileSwipeableCardProps {
  children: React.ReactNode;
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  className?: string;
}

const MobileSwipeableCard: React.FC<MobileSwipeableCardProps> = ({
  children,
  leftActions = [],
  rightActions = [],
  className
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const { handleTouchStart, handleTouchEnd, triggerHaptic } = useTouchInteractions();

  const handleSwipe = (swipe: SwipeDirection) => {
    const { direction, distance } = swipe;
    
    if (direction === 'left' && rightActions.length > 0) {
      setSwipeOffset(-Math.min(distance * 0.5, 120));
    } else if (direction === 'right' && leftActions.length > 0) {
      setSwipeOffset(Math.min(distance * 0.5, 120));
    }

    // Auto-reset after a delay
    setTimeout(() => setSwipeOffset(0), 2000);
  };

  const executeAction = (action: SwipeAction) => {
    triggerHaptic('medium');
    action.action();
    setSwipeOffset(0);
  };

  return (
    <div className="relative overflow-hidden">
      {/* Left actions */}
      {leftActions.length > 0 && (
        <div className="absolute start-0 top-0 bottom-0 flex items-center bg-green-500">
          {leftActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                className="h-full px-6 text-white hover:bg-white/20"
                onClick={() => executeAction(action)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      )}

      {/* Right actions */}
      {rightActions.length > 0 && (
        <div className="absolute end-0 top-0 bottom-0 flex items-center bg-red-500">
          {rightActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                size="sm"
                variant="ghost"
                className="h-full px-6 text-white hover:bg-white/20"
                onClick={() => executeAction(action)}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          })}
        </div>
      )}

      {/* Main card content */}
      <Card
        className={cn(
          "transition-transform duration-200 bg-white",
          isDragging && "transition-none",
          className
        )}
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={(e) => {
          setIsDragging(true);
          handleTouchStart(e);
        }}
        onTouchEnd={(e) => {
          setIsDragging(false);
          handleTouchEnd(e, handleSwipe);
        }}
      >
        {children}
      </Card>
    </div>
  );
};

export default MobileSwipeableCard;
