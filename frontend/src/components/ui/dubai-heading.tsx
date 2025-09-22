
import React from 'react';
import { cn } from '@/lib/utils';

interface DubaiHeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  subtitle?: string;
  badge?: string;
  align?: 'left' | 'center' | 'right';
  color?: 'default' | 'teal' | 'white';
  className?: string;
}

export const DubaiHeading: React.FC<DubaiHeadingProps> = ({
  level = 2,
  children,
  subtitle,
  badge,
  align = 'center',
  color = 'default',
  className
}) => {
  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  
  const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right'
  };

  const colorClasses = {
    default: 'text-ehrdc-neutral-dark',
    teal: 'text-ehrdc-teal',
    white: 'text-white'
  };

  const sizeClasses = {
    1: 'text-4xl md:text-6xl lg:text-7xl font-bold',
    2: 'text-3xl md:text-4xl lg:text-5xl font-bold',
    3: 'text-2xl md:text-3xl lg:text-4xl font-semibold',
    4: 'text-xl md:text-2xl lg:text-3xl font-semibold',
    5: 'text-lg md:text-xl lg:text-2xl font-medium',
    6: 'text-base md:text-lg lg:text-xl font-medium'
  };

  const subtitleColor = color === 'white' 
    ? 'text-white/80' 
    : color === 'teal' 
    ? 'text-ehrdc-light-teal' 
    : 'text-ehrdc-neutral-dark/70';

  const badgeColor = color === 'white'
    ? 'bg-white/20 text-white border-white/30'
    : 'bg-ehrdc-teal/10 text-ehrdc-teal border-ehrdc-teal/20';

  return (
    <div className={cn("space-y-4", alignClasses[align], className)}>
      {badge && (
        <div className={cn("inline-block mb-6 px-4 py-2 rounded-full border", badgeColor)}>
          <p className="font-medium text-sm">{badge}</p>
        </div>
      )}
      
      <HeadingTag className={cn(
        sizeClasses[level],
        colorClasses[color],
        "leading-tight tracking-tight"
      )}>
        {children}
      </HeadingTag>
      
      {subtitle && (
        <p className={cn(
          "text-lg md:text-xl leading-relaxed max-w-3xl",
          align === 'center' && "mx-auto",
          subtitleColor
        )}>
          {subtitle}
        </p>
      )}
    </div>
  );
};
