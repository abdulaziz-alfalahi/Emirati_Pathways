
import React from 'react';
import { Button } from '@/components/ui/button';

interface CareerEntryHeroProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  primaryActionLabel: string;
  primaryActionIcon?: React.ReactNode;
  primaryActionOnClick?: () => void;
  secondaryActionLabel?: string;
  secondaryActionIcon?: React.ReactNode;
  secondaryActionOnClick?: () => void;
}

export const CareerEntryHeroSection: React.FC<CareerEntryHeroProps> = ({
  title,
  description,
  icon,
  primaryActionLabel,
  primaryActionIcon,
  primaryActionOnClick,
  secondaryActionLabel,
  secondaryActionIcon,
  secondaryActionOnClick
}) => {
  return (
    <section className="relative bg-gradient-to-r from-blue-700 via-ehrdc-teal to-blue-500 text-white overflow-hidden">
      {/* Consistent pattern overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.1'%3E%3Cpath d='M30 30L15 15v30l15-15zm15 0L30 15v30l15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
      }}></div>
      
      {/* Consistent content structure */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-24">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="bg-white/20 rounded-full p-4">
              {icon}
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            {title}
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-4xl mx-auto opacity-90">
            {description}
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              size="lg" 
              className="bg-white text-ehrdc-teal hover:bg-gray-50 font-semibold"
              onClick={primaryActionOnClick}
            >
              {primaryActionIcon && <span className="mr-2">{primaryActionIcon}</span>}
              {primaryActionLabel}
            </Button>
            
            {secondaryActionLabel && (
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white text-white hover:bg-white hover:text-ehrdc-teal"
                onClick={secondaryActionOnClick}
              >
                {secondaryActionIcon && <span className="mr-2">{secondaryActionIcon}</span>}
                {secondaryActionLabel}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};
