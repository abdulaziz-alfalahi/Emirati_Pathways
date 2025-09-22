
import React from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  className?: string;
  children: React.ReactNode;
  isGlass?: boolean;
}

const Card: React.FC<CardProps> = ({ className, children, isGlass = false }) => {
  return (
    <div
      className={cn(
        "rounded-2xl p-6 transition-all duration-300",
        isGlass
          ? "glass-card"
          : "bg-white border border-gray-100 shadow-card hover:shadow-lg",
        className
      )}
    >
      {children}
    </div>
  );
};

export default Card;
