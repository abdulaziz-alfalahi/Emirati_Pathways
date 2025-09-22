
import React from 'react';
import { cn } from '@/lib/utils';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'fade' | 'slide-up' | 'slide-left' | 'scale';
  duration?: 'fast' | 'normal' | 'slow';
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className,
  variant = 'fade',
  duration = 'normal'
}) => {
  const [isVisible, setIsVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger animation after component mounts
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const variants = {
    fade: isVisible 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 translate-y-4',
    'slide-up': isVisible 
      ? 'opacity-100 translate-y-0' 
      : 'opacity-0 translate-y-8',
    'slide-left': isVisible 
      ? 'opacity-100 translate-x-0' 
      : 'opacity-0 translate-x-8',
    scale: isVisible 
      ? 'opacity-100 scale-100' 
      : 'opacity-0 scale-95'
  };

  const durations = {
    fast: 'duration-200',
    normal: 'duration-500',
    slow: 'duration-700'
  };

  return (
    <div
      className={cn(
        'transition-all ease-out',
        variants[variant],
        durations[duration],
        className
      )}
    >
      {children}
    </div>
  );
};

interface StaggeredListProps {
  children: React.ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export const StaggeredList: React.FC<StaggeredListProps> = ({
  children,
  className,
  staggerDelay = 100
}) => {
  const [visibleItems, setVisibleItems] = React.useState<number[]>([]);

  React.useEffect(() => {
    children.forEach((_, index) => {
      setTimeout(() => {
        setVisibleItems(prev => [...prev, index]);
      }, index * staggerDelay);
    });
  }, [children, staggerDelay]);

  return (
    <div className={className}>
      {children.map((child, index) => (
        <div
          key={index}
          className={cn(
            'transition-all duration-600 ease-out',
            visibleItems.includes(index)
              ? 'opacity-100 translate-y-0'
              : 'opacity-0 translate-y-4'
          )}
        >
          {child}
        </div>
      ))}
    </div>
  );
};

// Utility hook for scroll-triggered animations
export const useScrollAnimation = (threshold = 0.1) => {
  const [isVisible, setIsVisible] = React.useState(false);
  const ref = React.useRef<HTMLElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isVisible };
};
