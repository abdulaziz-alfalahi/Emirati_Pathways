
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

interface LoadingStateProps {
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ message = "Loading camps..." }) => {
  const { isRTL } = useLanguage();

  return (
    <div className="space-y-4">
      {/* Loading indicator */}
      <div className={cn(
        "flex items-center justify-center py-4",
        isRTL && "rtl:flex-row-reverse"
      )}>
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600 me-3"></div>
        <span className={cn(
          "text-gray-600",
          isRTL && "rtl:font-arabic rtl:ms-0 rtl:me-3"
        )}>{message}</span>
      </div>

      {/* Skeleton cards */}
      {[1, 2, 3].map(index => (
        <Card key={index} className="shadow-sm animate-pulse">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-1/4 h-48 bg-gray-200"></div>
            <div className="p-4 md:p-6 md:w-3/4">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              
              <div className="h-20 bg-gray-200 rounded mb-4"></div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

export default LoadingState;
