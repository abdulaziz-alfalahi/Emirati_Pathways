
import React from 'react';
import { cn } from '@/lib/utils';

interface SectionDividerProps {
  variant?: 'wave' | 'dots' | 'gradient' | 'simple';
  color?: 'teal' | 'light-teal' | 'neutral' | 'white';
  direction?: 'up' | 'down';
  className?: string;
}

export const SectionDivider: React.FC<SectionDividerProps> = ({
  variant = 'wave',
  color = 'teal',
  direction = 'down',
  className
}) => {
  const colorClasses = {
    teal: 'fill-ehrdc-teal',
    'light-teal': 'fill-ehrdc-light-teal',
    neutral: 'fill-ehrdc-neutral-light',
    white: 'fill-white'
  };

  if (variant === 'wave') {
    return (
      <div className={cn("relative w-full overflow-hidden", className)}>
        <svg
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
          className={cn(
            "relative block w-full h-16 md:h-20",
            colorClasses[color],
            direction === 'up' && "rotate-180"
          )}
        >
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" />
        </svg>
      </div>
    );
  }

  if (variant === 'dots') {
    return (
      <div className={cn("relative w-full h-16 md:h-20 overflow-hidden", className)}>
        <div className="absolute inset-0 opacity-20">
          <div className="grid grid-cols-12 gap-4 h-full items-center justify-center px-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "w-2 h-2 rounded-full",
                  color === 'teal' && "bg-ehrdc-teal",
                  color === 'light-teal' && "bg-ehrdc-light-teal",
                  color === 'neutral' && "bg-ehrdc-neutral-dark",
                  color === 'white' && "bg-white"
                )}
                style={{
                  animationDelay: `${i * 0.1}s`,
                  opacity: Math.random() * 0.5 + 0.3
                }}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'gradient') {
    return (
      <div className={cn("relative w-full h-16 md:h-20", className)}>
        <div className={cn(
          "absolute inset-0",
          color === 'teal' && "bg-gradient-to-r from-transparent via-ehrdc-teal/20 to-transparent",
          color === 'light-teal' && "bg-gradient-to-r from-transparent via-ehrdc-light-teal/20 to-transparent",
          color === 'neutral' && "bg-gradient-to-r from-transparent via-ehrdc-neutral-light/40 to-transparent",
          color === 'white' && "bg-gradient-to-r from-transparent via-white/40 to-transparent"
        )} />
      </div>
    );
  }

  // Simple divider
  return (
    <div className={cn("relative w-full h-px", className)}>
      <div className={cn(
        "absolute inset-0",
        color === 'teal' && "bg-ehrdc-teal",
        color === 'light-teal' && "bg-ehrdc-light-teal",
        color === 'neutral' && "bg-ehrdc-neutral-light",
        color === 'white' && "bg-white"
      )} />
    </div>
  );
};
