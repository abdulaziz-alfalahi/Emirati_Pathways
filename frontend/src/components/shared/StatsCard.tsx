/**
 * @fileoverview Stats Card Component
 * 
 * A reusable statistics card component for displaying metrics consistently
 * across all dashboards. Supports various styles, trends, and loading states.
 * 
 * @module components/shared/StatsCard
 */

import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Info
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

/**
 * Trend direction type
 */
type TrendDirection = 'up' | 'down' | 'neutral';

/**
 * Color variant type
 */
type ColorVariant = 'default' | 'teal' | 'blue' | 'green' | 'red' | 'orange' | 'purple' | 'pink';

/**
 * Stats Card Props
 */
interface StatsCardProps {
  /** Card title */
  title: string;
  /** Main value to display */
  value: string | number;
  /** Optional subtitle or description */
  subtitle?: string;
  /** Icon to display */
  icon?: ReactNode;
  /** Trend percentage change */
  trend?: number;
  /** Trend direction override (auto-calculated from trend if not provided) */
  trendDirection?: TrendDirection;
  /** Trend label (e.g., "vs last month") */
  trendLabel?: string;
  /** Color variant for the card */
  variant?: ColorVariant;
  /** Whether the card is in loading state */
  isLoading?: boolean;
  /** Additional info tooltip */
  infoTooltip?: string;
  /** Click handler */
  onClick?: () => void;
  /** Additional CSS classes */
  className?: string;
  /** Compact mode for smaller displays */
  compact?: boolean;
  /** Footer content */
  footer?: ReactNode;
  /** Progress value (0-100) */
  progress?: number;
  /** Progress label */
  progressLabel?: string;
}

/**
 * Color configuration for variants
 */
const colorConfig: Record<ColorVariant, {
  bg: string;
  iconBg: string;
  iconColor: string;
  border: string;
  trendUp: string;
  trendDown: string;
}> = {
  default: {
    bg: 'bg-white',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    border: 'border-gray-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  teal: {
    bg: 'bg-white',
    iconBg: 'bg-teal-100',
    iconColor: 'text-teal-600',
    border: 'border-teal-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  blue: {
    bg: 'bg-white',
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    border: 'border-blue-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  green: {
    bg: 'bg-white',
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
    border: 'border-green-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  red: {
    bg: 'bg-white',
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    border: 'border-red-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  orange: {
    bg: 'bg-white',
    iconBg: 'bg-orange-100',
    iconColor: 'text-orange-600',
    border: 'border-orange-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  purple: {
    bg: 'bg-white',
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
    border: 'border-purple-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  },
  pink: {
    bg: 'bg-white',
    iconBg: 'bg-pink-100',
    iconColor: 'text-pink-600',
    border: 'border-pink-200',
    trendUp: 'text-green-600 bg-green-50',
    trendDown: 'text-red-600 bg-red-50'
  }
};

/**
 * Stats Card Skeleton Component
 */
const StatsCardSkeleton: React.FC<{ compact?: boolean }> = ({ compact }) => (
  <Card className="border shadow-sm">
    <CardContent className={cn("pt-6", compact && "pt-4")}>
      <div className="flex items-start justify-between">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className={cn("h-8 w-20", compact && "h-6")} />
          <Skeleton className="h-3 w-32" />
        </div>
        <Skeleton className={cn("h-10 w-10 rounded-lg", compact && "h-8 w-8")} />
      </div>
    </CardContent>
  </Card>
);

/**
 * Trend Badge Component
 */
const TrendBadge: React.FC<{
  trend: number;
  direction?: TrendDirection;
  label?: string;
  variant: ColorVariant;
}> = ({ trend, direction, label, variant }) => {
  const calculatedDirection = direction || (trend > 0 ? 'up' : trend < 0 ? 'down' : 'neutral');
  const colors = colorConfig[variant];
  
  const TrendIcon = calculatedDirection === 'up' 
    ? ArrowUpRight 
    : calculatedDirection === 'down' 
      ? ArrowDownRight 
      : Minus;
  
  const trendColor = calculatedDirection === 'up' 
    ? colors.trendUp 
    : calculatedDirection === 'down' 
      ? colors.trendDown 
      : 'text-gray-500 bg-gray-50';

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
      trendColor
    )}>
      <TrendIcon className="h-3 w-3" />
      <span>{Math.abs(trend)}%</span>
      {label && <span className="text-gray-500 ms-1">{label}</span>}
    </div>
  );
};

/**
 * Progress Bar Component
 */
const ProgressBar: React.FC<{
  value: number;
  label?: string;
  variant: ColorVariant;
}> = ({ value, label, variant }) => {
  const colors = colorConfig[variant];
  
  return (
    <div className="mt-3">
      {label && (
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{label}</span>
          <span>{value}%</span>
        </div>
      )}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all duration-500", colors.iconBg)}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};

/**
 * Stats Card Component
 * 
 * A versatile card component for displaying statistics and metrics.
 * 
 * @example
 * ```tsx
 * <StatsCard
 *   title="Total Users"
 *   value={1234}
 *   icon={<Users className="h-5 w-5" />}
 *   trend={12.5}
 *   trendLabel="vs last month"
 *   variant="teal"
 * />
 * ```
 */
const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendDirection,
  trendLabel,
  variant = 'default',
  isLoading = false,
  infoTooltip,
  onClick,
  className,
  compact = false,
  footer,
  progress,
  progressLabel
}) => {
  const colors = colorConfig[variant];

  if (isLoading) {
    return <StatsCardSkeleton compact={compact} />;
  }

  return (
    <TooltipProvider>
      <Card 
        className={cn(
          "border shadow-sm transition-all duration-200",
          colors.bg,
          colors.border,
          onClick && "cursor-pointer hover:shadow-md hover:border-teal-300",
          className
        )}
        onClick={onClick}
      >
        <CardContent className={cn("pt-6", compact && "pt-4 pb-4")}>
          <div className="flex items-start justify-between">
            {/* Content */}
            <div className="space-y-1 flex-1 min-w-0">
              {/* Title with optional info tooltip */}
              <div className="flex items-center gap-1">
                <p className={cn(
                  "font-medium text-gray-500 truncate",
                  compact ? "text-xs" : "text-sm"
                )}>
                  {title}
                </p>
                {infoTooltip && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 text-gray-400 cursor-help flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs text-sm">{infoTooltip}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              
              {/* Value */}
              <p className={cn(
                "font-bold text-gray-900 truncate",
                compact ? "text-xl" : "text-2xl lg:text-3xl"
              )}>
                {typeof value === 'number' ? value.toLocaleString() : value}
              </p>
              
              {/* Subtitle or Trend */}
              <div className="flex items-center gap-2 flex-wrap">
                {trend !== undefined && (
                  <TrendBadge 
                    trend={trend} 
                    direction={trendDirection}
                    label={trendLabel}
                    variant={variant}
                  />
                )}
                {subtitle && (
                  <p className="text-xs text-gray-500 truncate">
                    {subtitle}
                  </p>
                )}
              </div>
            </div>
            
            {/* Icon */}
            {icon && (
              <div className={cn(
                "flex-shrink-0 rounded-lg flex items-center justify-center",
                colors.iconBg,
                colors.iconColor,
                compact ? "h-8 w-8" : "h-10 w-10 lg:h-12 lg:w-12"
              )}>
                {icon}
              </div>
            )}
          </div>
          
          {/* Progress bar */}
          {progress !== undefined && (
            <ProgressBar value={progress} label={progressLabel} variant={variant} />
          )}
          
          {/* Footer */}
          {footer && (
            <div className="mt-3 pt-3 border-t border-gray-100">
              {footer}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  );
};

/**
 * Stats Grid Component
 * 
 * A responsive grid container for StatsCard components.
 */
interface StatsGridProps {
  children: ReactNode;
  columns?: 2 | 3 | 4 | 5 | 6;
  className?: string;
}

const StatsGrid: React.FC<StatsGridProps> = ({
  children,
  columns = 4,
  className
}) => {
  const gridCols = {
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
  };

  return (
    <div className={cn(
      "grid gap-4 lg:gap-6",
      gridCols[columns],
      className
    )}>
      {children}
    </div>
  );
};

export default StatsCard;
export { StatsCard, StatsGrid, StatsCardSkeleton, TrendBadge, ProgressBar };
