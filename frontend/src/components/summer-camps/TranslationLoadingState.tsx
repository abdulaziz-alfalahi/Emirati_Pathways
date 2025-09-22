
import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { useLanguage } from '@/context/LanguageContext';
import { cn } from '@/lib/utils';

const TranslationLoadingState: React.FC = () => {
  const { isRTL } = useLanguage();

  return (
    <div className={cn(
      "min-h-screen bg-gradient-to-br from-blue-50 to-white",
      isRTL && "rtl:font-arabic"
    )}>
      {/* Header skeleton */}
      <div className="container mx-auto px-4 py-8">
        <div className={cn(
          "text-center mb-8",
          isRTL && "rtl:text-right"
        )}>
          <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-6 w-1/2 mx-auto" />
        </div>

        {/* Stats skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[1, 2, 3, 4].map((index) => (
            <Card key={index} className="text-center">
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mx-auto mb-2" />
                <Skeleton className="h-4 w-20 mx-auto" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Content skeleton */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="transition-all duration-300">
              <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-16 w-full" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2 mb-4">
                  <div className={cn(
                    "flex justify-between",
                    isRTL && "rtl:flex-row-reverse"
                  )}>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                  <div className={cn(
                    "flex justify-between",
                    isRTL && "rtl:flex-row-reverse"
                  )}>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                  <div className={cn(
                    "flex justify-between",
                    isRTL && "rtl:flex-row-reverse"
                  )}>
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Loading indicator */}
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            <span className="text-sm text-gray-600">Loading translations...</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranslationLoadingState;
