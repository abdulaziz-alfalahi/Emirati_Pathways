
import React from 'react';
import { cn } from '@/lib/utils';

interface BackgroundPatternProps {
  pattern?: 'dots' | 'grid' | 'waves' | 'geometric';
  color?: 'teal' | 'light-teal' | 'neutral' | 'white';
  opacity?: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const BackgroundPattern: React.FC<BackgroundPatternProps> = ({
  pattern = 'dots',
  color = 'teal',
  opacity = 0.1,
  size = 'md',
  className
}) => {
  const colorClasses = {
    teal: 'fill-ehrdc-teal',
    'light-teal': 'fill-ehrdc-light-teal',
    neutral: 'fill-ehrdc-neutral-dark',
    white: 'fill-white'
  };

  const sizeClasses = {
    sm: 20,
    md: 30,
    lg: 40
  };

  if (pattern === 'dots') {
    return (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity }}
      >
        <svg
          width="100%"
          height="100%"
          className={colorClasses[color]}
        >
          <defs>
            <pattern
              id="dots-pattern"
              x="0"
              y="0"
              width={sizeClasses[size]}
              height={sizeClasses[size]}
              patternUnits="userSpaceOnUse"
            >
              <circle cx={sizeClasses[size] / 2} cy={sizeClasses[size] / 2} r="2" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pattern)" />
        </svg>
      </div>
    );
  }

  if (pattern === 'grid') {
    return (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity }}
      >
        <svg
          width="100%"
          height="100%"
          className={colorClasses[color]}
        >
          <defs>
            <pattern
              id="grid-pattern"
              x="0"
              y="0"
              width={sizeClasses[size]}
              height={sizeClasses[size]}
              patternUnits="userSpaceOnUse"
            >
              <path
                d={`M ${sizeClasses[size]} 0 L 0 0 0 ${sizeClasses[size]}`}
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid-pattern)" />
        </svg>
      </div>
    );
  }

  if (pattern === 'geometric') {
    return (
      <div 
        className={cn("absolute inset-0 pointer-events-none", className)}
        style={{ opacity }}
      >
        <div className="absolute top-10 end-10 w-32 h-32 border-2 border-current rounded-full" />
        <div className="absolute bottom-20 start-20 w-24 h-24 border-2 border-current rotate-45" />
        <div className="absolute top-1/3 start-1/4 w-16 h-16 border-2 border-current rounded-lg rotate-12" />
        <div className="absolute bottom-1/3 end-1/4 w-20 h-20 border-2 border-current" />
      </div>
    );
  }

  // Waves pattern
  return (
    <div 
      className={cn("absolute inset-0 pointer-events-none overflow-hidden", className)}
      style={{ opacity }}
    >
      <svg
        viewBox="0 0 1200 600"
        className={cn("absolute w-full h-full", colorClasses[color])}
      >
        <path d="M0,100 C150,200 350,0 500,100 C650,200 850,0 1000,100 C1150,200 1200,150 1200,100 L1200,0 L0,0 Z" />
        <path d="M0,200 C150,300 350,100 500,200 C650,300 850,100 1000,200 C1150,300 1200,250 1200,200 L1200,100 L0,100 Z" />
      </svg>
    </div>
  );
};
