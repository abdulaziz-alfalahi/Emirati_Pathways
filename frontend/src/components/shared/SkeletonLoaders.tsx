/**
 * @fileoverview Skeleton Loader Components
 * 
 * A collection of skeleton loader components for various dashboard sections.
 * These provide visual feedback during data loading states.
 * 
 * @module components/shared/SkeletonLoaders
 */

import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';

/**
 * Stats Card Skeleton
 */
export const StatsCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn("border shadow-sm", className)}>
    <CardContent className="pt-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className="h-10 w-10 rounded-lg" />
      </div>
    </CardContent>
  </Card>
);

/**
 * Stats Grid Skeleton
 */
export const StatsGridSkeleton: React.FC<{ 
  count?: number;
  columns?: 2 | 3 | 4;
}> = ({ count = 4, columns = 4 }) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={cn("grid gap-4 lg:gap-6", gridCols[columns])}>
      {Array.from({ length: count }).map((_, i) => (
        <StatsCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Table Skeleton
 */
export const TableSkeleton: React.FC<{
  rows?: number;
  columns?: number;
  showHeader?: boolean;
  className?: string;
}> = ({ rows = 5, columns = 5, showHeader = true, className }) => (
  <Card className={cn("border shadow-sm", className)}>
    {showHeader && (
      <CardHeader className="border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
          </div>
        </div>
      </CardHeader>
    )}
    <CardContent className="p-0">
      {/* Table header */}
      <div className="border-b bg-gray-50/50 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-[80%]" />
          ))}
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton 
                  key={colIndex} 
                  className={cn(
                    "h-4",
                    colIndex === 0 ? "w-[90%]" : "w-[70%]"
                  )} 
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Chart Card Skeleton
 */
export const ChartCardSkeleton: React.FC<{
  height?: string;
  showLegend?: boolean;
  className?: string;
}> = ({ height = '300px', showLegend = true, className }) => (
  <Card className={cn("border shadow-sm", className)}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3 w-48" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>
    </CardHeader>
    <CardContent>
      <Skeleton className="w-full rounded-lg" style={{ height }} />
      {showLegend && (
        <div className="flex justify-center gap-4 mt-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-2">
              <Skeleton className="h-3 w-3 rounded-full" />
              <Skeleton className="h-3 w-16" />
            </div>
          ))}
        </div>
      )}
    </CardContent>
  </Card>
);

/**
 * List Item Skeleton
 */
export const ListItemSkeleton: React.FC<{
  showAvatar?: boolean;
  showActions?: boolean;
}> = ({ showAvatar = true, showActions = true }) => (
  <div className="flex items-center gap-4 p-4">
    {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
    <div className="flex-1 space-y-2">
      <Skeleton className="h-4 w-[60%]" />
      <Skeleton className="h-3 w-[40%]" />
    </div>
    {showActions && (
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded" />
        <Skeleton className="h-8 w-8 rounded" />
      </div>
    )}
  </div>
);

/**
 * List Skeleton
 */
export const ListSkeleton: React.FC<{
  count?: number;
  showAvatar?: boolean;
  showActions?: boolean;
  className?: string;
}> = ({ count = 5, showAvatar = true, showActions = true, className }) => (
  <Card className={cn("border shadow-sm divide-y", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <ListItemSkeleton key={i} showAvatar={showAvatar} showActions={showActions} />
    ))}
  </Card>
);

/**
 * Profile Card Skeleton
 */
export const ProfileCardSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn("border shadow-sm", className)}>
    <CardContent className="pt-6">
      <div className="flex flex-col items-center text-center">
        <Skeleton className="h-20 w-20 rounded-full mb-4" />
        <Skeleton className="h-6 w-32 mb-2" />
        <Skeleton className="h-4 w-24 mb-4" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      </div>
      <div className="mt-6 pt-6 border-t space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Form Skeleton
 */
export const FormSkeleton: React.FC<{
  fields?: number;
  showSubmit?: boolean;
  className?: string;
}> = ({ fields = 4, showSubmit = true, className }) => (
  <Card className={cn("border shadow-sm", className)}>
    <CardHeader>
      <Skeleton className="h-6 w-32" />
      <Skeleton className="h-4 w-48" />
    </CardHeader>
    <CardContent className="space-y-6">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      {showSubmit && (
        <div className="flex justify-end gap-2 pt-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      )}
    </CardContent>
  </Card>
);

/**
 * Tabs Skeleton
 */
export const TabsSkeleton: React.FC<{
  tabCount?: number;
  className?: string;
}> = ({ tabCount = 4, className }) => (
  <div className={cn("space-y-4", className)}>
    <div className="flex gap-2 border-b pb-2">
      {Array.from({ length: tabCount }).map((_, i) => (
        <Skeleton key={i} className="h-9 w-24" />
      ))}
    </div>
    <div className="space-y-4">
      <StatsGridSkeleton count={4} />
      <TableSkeleton rows={5} />
    </div>
  </div>
);

/**
 * Dashboard Page Skeleton
 */
export const DashboardPageSkeleton: React.FC<{
  showStats?: boolean;
  showChart?: boolean;
  showTable?: boolean;
  className?: string;
}> = ({ 
  showStats = true, 
  showChart = true, 
  showTable = true,
  className 
}) => (
  <div className={cn("space-y-6", className)}>
    {/* Header */}
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div className="space-y-1">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>

    {/* Stats */}
    {showStats && <StatsGridSkeleton count={4} />}

    {/* Charts */}
    {showChart && (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    )}

    {/* Table */}
    {showTable && <TableSkeleton rows={5} columns={5} />}
  </div>
);

/**
 * Kanban Board Skeleton
 */
export const KanbanSkeleton: React.FC<{
  columns?: number;
  cardsPerColumn?: number;
  className?: string;
}> = ({ columns = 4, cardsPerColumn = 3, className }) => (
  <div className={cn("flex gap-4 overflow-x-auto pb-4", className)}>
    {Array.from({ length: columns }).map((_, colIndex) => (
      <div key={colIndex} className="min-w-[280px] flex-shrink-0">
        <Card className="bg-gray-50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-5 w-8 rounded-full" />
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {Array.from({ length: cardsPerColumn }).map((_, cardIndex) => (
              <Card key={cardIndex} className="p-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[80%]" />
                  <Skeleton className="h-3 w-[60%]" />
                  <div className="flex gap-1">
                    <Skeleton className="h-5 w-12 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      </div>
    ))}
  </div>
);

/**
 * Calendar Skeleton
 */
export const CalendarSkeleton: React.FC<{ className?: string }> = ({ className }) => (
  <Card className={cn("border shadow-sm", className)}>
    <CardHeader>
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>
    </CardHeader>
    <CardContent>
      {/* Days header */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 35 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </CardContent>
  </Card>
);

/**
 * Timeline Skeleton
 */
export const TimelineSkeleton: React.FC<{
  items?: number;
  className?: string;
}> = ({ items = 4, className }) => (
  <div className={cn("space-y-4", className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="flex gap-4">
        <div className="flex flex-col items-center">
          <Skeleton className="h-8 w-8 rounded-full" />
          {i < items - 1 && <Skeleton className="h-16 w-0.5 mt-2" />}
        </div>
        <div className="flex-1 pb-4">
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-3 w-full mb-1" />
          <Skeleton className="h-3 w-[80%]" />
        </div>
      </div>
    ))}
  </div>
);

/**
 * Notification List Skeleton
 */
export const NotificationSkeleton: React.FC<{
  count?: number;
  className?: string;
}> = ({ count = 5, className }) => (
  <div className={cn("space-y-2", className)}>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50">
        <Skeleton className="h-8 w-8 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-1">
          <Skeleton className="h-4 w-[70%]" />
          <Skeleton className="h-3 w-[50%]" />
        </div>
        <Skeleton className="h-3 w-12" />
      </div>
    ))}
  </div>
);

export default {
  StatsCardSkeleton,
  StatsGridSkeleton,
  TableSkeleton,
  ChartCardSkeleton,
  ListItemSkeleton,
  ListSkeleton,
  ProfileCardSkeleton,
  FormSkeleton,
  TabsSkeleton,
  DashboardPageSkeleton,
  KanbanSkeleton,
  CalendarSkeleton,
  TimelineSkeleton,
  NotificationSkeleton
};
