
import React from 'react';
import { cn } from '@/lib/utils';
import { SectionDivider } from './section-dividers';

interface DubaiSectionProps {
  children: React.ReactNode;
  background?: 'white' | 'light' | 'teal' | 'dark-teal' | 'gradient';
  padding?: 'sm' | 'md' | 'lg' | 'xl';
  dividerTop?: {
    variant?: 'wave' | 'dots' | 'gradient' | 'simple';
    color?: 'teal' | 'light-teal' | 'neutral' | 'white';
    direction?: 'up' | 'down';
  };
  dividerBottom?: {
    variant?: 'wave' | 'dots' | 'gradient' | 'simple';
    color?: 'teal' | 'light-teal' | 'neutral' | 'white';
    direction?: 'up' | 'down';
  };
  className?: string;
  id?: string;
}

export const DubaiSection: React.FC<DubaiSectionProps> = ({
  children,
  background = 'white',
  padding = 'lg',
  dividerTop,
  dividerBottom,
  className,
  id
}) => {
  const backgroundClasses = {
    white: 'bg-white',
    light: 'bg-ehrdc-neutral-light/30',
    teal: 'bg-ehrdc-teal',
    'dark-teal': 'bg-ehrdc-dark-teal',
    gradient: 'bg-gradient-to-br from-ehrdc-teal via-ehrdc-teal to-ehrdc-dark-teal'
  };

  const paddingClasses = {
    sm: 'py-8 md:py-12',
    md: 'py-12 md:py-16',
    lg: 'py-16 md:py-20',
    xl: 'py-20 md:py-24'
  };

  const textColor = background === 'teal' || background === 'dark-teal' || background === 'gradient' 
    ? 'text-white' 
    : 'text-ehrdc-neutral-dark';

  return (
    <section id={id} className={cn("relative w-full", backgroundClasses[background], className)}>
      {dividerTop && (
        <SectionDivider
          variant={dividerTop.variant}
          color={dividerTop.color}
          direction={dividerTop.direction}
          className="absolute top-0 left-0 right-0 z-10"
        />
      )}
      
      <div className={cn("relative z-20", paddingClasses[padding], textColor)}>
        <div className="dubai-container">
          {children}
        </div>
      </div>

      {dividerBottom && (
        <SectionDivider
          variant={dividerBottom.variant}
          color={dividerBottom.color}
          direction={dividerBottom.direction}
          className="absolute bottom-0 left-0 right-0 z-10"
        />
      )}
    </section>
  );
};
