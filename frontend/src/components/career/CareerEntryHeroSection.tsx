
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
    <section className="relative bg-[#006E6D] text-white overflow-hidden">
      {/* Subtle dot pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `radial-gradient(circle, #fff 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }}></div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
        <div className="text-center">
          <div className="flex justify-center mb-5">
            <div className="bg-white/15 rounded-2xl p-3.5">
              {icon}
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-5 tracking-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl mb-8 max-w-3xl mx-auto text-white/80 leading-relaxed">
            {description}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button
              size="lg"
              className="bg-white text-[#006E6D] hover:bg-gray-50 font-semibold rounded-full px-8"
              onClick={primaryActionOnClick}
            >
              {primaryActionIcon && <span className="mr-2">{primaryActionIcon}</span>}
              {primaryActionLabel}
            </Button>

            {secondaryActionLabel && (
              <Button
                size="lg"
                variant="outline"
                className="border-white/40 text-white hover:bg-white/10 rounded-full px-8"
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
