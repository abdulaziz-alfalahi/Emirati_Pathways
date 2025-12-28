/**
 * @fileoverview Responsive Utility Components and Hooks
 * 
 * A collection of utilities for building mobile-responsive interfaces:
 * - useMediaQuery hook for responsive logic
 * - Responsive container components
 * - Mobile-friendly navigation components
 * - Responsive table alternatives
 * 
 * @module components/shared/ResponsiveUtils
 */

import React, { useState, useEffect, ReactNode, createContext, useContext } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Filter,
  Search,
  ArrowLeft
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// BREAKPOINT DEFINITIONS
// ============================================================================

export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536
} as const;

type Breakpoint = keyof typeof breakpoints;

// ============================================================================
// MEDIA QUERY HOOK
// ============================================================================

/**
 * Custom hook for responsive design
 * 
 * @example
 * const isMobile = useMediaQuery('(max-width: 768px)');
 * const isDesktop = useMediaQuery('(min-width: 1024px)');
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);

    const listener = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
  }, [query]);

  return matches;
}

/**
 * Hook for common breakpoint checks
 */
export function useBreakpoint() {
  const isMobile = useMediaQuery(`(max-width: ${breakpoints.md - 1}px)`);
  const isTablet = useMediaQuery(`(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`);
  const isDesktop = useMediaQuery(`(min-width: ${breakpoints.lg}px)`);
  const isLargeDesktop = useMediaQuery(`(min-width: ${breakpoints.xl}px)`);

  return {
    isMobile,
    isTablet,
    isDesktop,
    isLargeDesktop,
    breakpoint: isLargeDesktop ? 'xl' : isDesktop ? 'lg' : isTablet ? 'md' : 'sm'
  };
}

// ============================================================================
// RESPONSIVE CONTEXT
// ============================================================================

interface ResponsiveContextValue {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  breakpoint: string;
}

const ResponsiveContext = createContext<ResponsiveContextValue>({
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  breakpoint: 'lg'
});

export const useResponsive = () => useContext(ResponsiveContext);

export const ResponsiveProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const value = useBreakpoint();
  return (
    <ResponsiveContext.Provider value={value}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// ============================================================================
// RESPONSIVE COMPONENTS
// ============================================================================

/**
 * Show/Hide components based on breakpoint
 */
interface ResponsiveShowProps {
  children: ReactNode;
  above?: Breakpoint;
  below?: Breakpoint;
  className?: string;
}

export const ResponsiveShow: React.FC<ResponsiveShowProps> = ({
  children,
  above,
  below,
  className
}) => {
  let displayClass = '';
  
  if (above) {
    displayClass = `hidden ${above}:block`;
  } else if (below) {
    displayClass = `${below}:hidden`;
  }

  return <div className={cn(displayClass, className)}>{children}</div>;
};

/**
 * Mobile Navigation Sheet
 */
interface MobileNavProps {
  trigger?: ReactNode;
  title?: string;
  children: ReactNode;
  className?: string;
}

export const MobileNav: React.FC<MobileNavProps> = ({
  trigger,
  title = 'Menu',
  children,
  className
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className={cn("w-[280px] sm:w-[320px]", className)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-6">
          {children}
        </div>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Mobile Filter Sheet
 */
interface MobileFiltersProps {
  trigger?: ReactNode;
  title?: string;
  children: ReactNode;
  onApply?: () => void;
  onReset?: () => void;
  className?: string;
}

export const MobileFilters: React.FC<MobileFiltersProps> = ({
  trigger,
  title = 'Filters',
  children,
  onApply,
  onReset,
  className
}) => {
  const [open, setOpen] = useState(false);

  const handleApply = () => {
    onApply?.();
    setOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" className="md:hidden">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className={cn("w-[300px] sm:w-[400px]", className)}>
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-4">
          {children}
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-white">
          <div className="flex gap-2">
            {onReset && (
              <Button variant="outline" className="flex-1" onClick={onReset}>
                Reset
              </Button>
            )}
            <Button className="flex-1" onClick={handleApply}>
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

/**
 * Responsive Table - Converts to cards on mobile
 */
interface ResponsiveTableProps<T> {
  data: T[];
  columns: {
    key: keyof T | string;
    header: string;
    render?: (item: T) => ReactNode;
    hideOnMobile?: boolean;
    primary?: boolean;
  }[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  className?: string;
}

export function ResponsiveTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data available',
  className
}: ResponsiveTableProps<T>) {
  const { isMobile } = useBreakpoint();

  if (data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        {emptyMessage}
      </div>
    );
  }

  // Mobile card view
  if (isMobile) {
    return (
      <div className={cn("space-y-3", className)}>
        {data.map((item) => (
          <Card 
            key={keyExtractor(item)}
            className={cn(
              "cursor-pointer hover:shadow-md transition-shadow",
              onRowClick && "cursor-pointer"
            )}
            onClick={() => onRowClick?.(item)}
          >
            <CardContent className="p-4">
              {columns.map((col) => {
                const value = col.render 
                  ? col.render(item) 
                  : String((item as any)[col.key] || '');
                
                if (col.primary) {
                  return (
                    <div key={String(col.key)} className="font-semibold text-lg mb-2">
                      {value}
                    </div>
                  );
                }

                return (
                  <div key={String(col.key)} className="flex justify-between py-1 text-sm">
                    <span className="text-gray-500">{col.header}</span>
                    <span className="text-gray-900 font-medium">{value}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Desktop table view
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b bg-gray-50">
            {columns.filter(col => !col.hideOnMobile).map((col) => (
              <th 
                key={String(col.key)} 
                className="px-4 py-3 text-left text-sm font-medium text-gray-500"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y">
          {data.map((item) => (
            <tr 
              key={keyExtractor(item)}
              className={cn(
                "hover:bg-gray-50 transition-colors",
                onRowClick && "cursor-pointer"
              )}
              onClick={() => onRowClick?.(item)}
            >
              {columns.filter(col => !col.hideOnMobile).map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-sm">
                  {col.render 
                    ? col.render(item) 
                    : String((item as any)[col.key] || '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/**
 * Collapsible Section for Mobile
 */
interface CollapsibleSectionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: string | number;
  className?: string;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  children,
  defaultOpen = false,
  badge,
  className
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isMobile } = useBreakpoint();

  // Always open on desktop
  if (!isMobile) {
    return (
      <div className={className}>
        <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          {title}
          {badge !== undefined && (
            <Badge variant="secondary">{badge}</Badge>
          )}
        </h3>
        {children}
      </div>
    );
  }

  return (
    <div className={cn("border rounded-lg", className)}>
      <button
        className="w-full flex items-center justify-between p-4 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-900 flex items-center gap-2">
          {title}
          {badge !== undefined && (
            <Badge variant="secondary">{badge}</Badge>
          )}
        </span>
        {isOpen ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

/**
 * Responsive Grid
 */
interface ResponsiveGridProps {
  children: ReactNode;
  cols?: {
    default: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
  };
  gap?: number;
  className?: string;
}

export const ResponsiveGrid: React.FC<ResponsiveGridProps> = ({
  children,
  cols = { default: 1, sm: 2, md: 3, lg: 4 },
  gap = 4,
  className
}) => {
  const gridCols = [
    `grid-cols-${cols.default}`,
    cols.sm && `sm:grid-cols-${cols.sm}`,
    cols.md && `md:grid-cols-${cols.md}`,
    cols.lg && `lg:grid-cols-${cols.lg}`,
    cols.xl && `xl:grid-cols-${cols.xl}`
  ].filter(Boolean).join(' ');

  return (
    <div className={cn(`grid gap-${gap}`, gridCols, className)}>
      {children}
    </div>
  );
};

/**
 * Mobile Page Header
 */
interface MobilePageHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  actions?: ReactNode;
  className?: string;
}

export const MobilePageHeader: React.FC<MobilePageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  actions,
  className
}) => (
  <div className={cn("sticky top-0 z-10 bg-white border-b px-4 py-3 md:hidden", className)}>
    <div className="flex items-center gap-3">
      {onBack && (
        <Button variant="ghost" size="sm" onClick={onBack} className="-ml-2">
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      <div className="flex-1 min-w-0">
        <h1 className="font-semibold text-gray-900 truncate">{title}</h1>
        {subtitle && (
          <p className="text-sm text-gray-500 truncate">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  </div>
);

/**
 * Responsive Stack - Horizontal on desktop, vertical on mobile
 */
interface ResponsiveStackProps {
  children: ReactNode;
  breakpoint?: Breakpoint;
  gap?: number;
  className?: string;
}

export const ResponsiveStack: React.FC<ResponsiveStackProps> = ({
  children,
  breakpoint = 'md',
  gap = 4,
  className
}) => (
  <div className={cn(
    `flex flex-col ${breakpoint}:flex-row gap-${gap}`,
    className
  )}>
    {children}
  </div>
);

/**
 * Touch-friendly Action Menu
 */
interface TouchActionMenuProps {
  actions: {
    label: string;
    icon?: ReactNode;
    onClick: () => void;
    variant?: 'default' | 'destructive';
  }[];
  trigger?: ReactNode;
}

export const TouchActionMenu: React.FC<TouchActionMenuProps> = ({
  actions,
  trigger
}) => {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <Button variant="ghost" size="sm">
            <MoreVertical className="h-4 w-4" />
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="bottom" className="h-auto">
        <div className="py-2">
          {actions.map((action, index) => (
            <button
              key={index}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-100 transition-colors",
                action.variant === 'destructive' && "text-red-600"
              )}
              onClick={() => {
                action.onClick();
                setOpen(false);
              }}
            >
              {action.icon}
              <span className="font-medium">{action.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default {
  useMediaQuery,
  useBreakpoint,
  useResponsive,
  ResponsiveProvider,
  ResponsiveShow,
  MobileNav,
  MobileFilters,
  ResponsiveTable,
  CollapsibleSection,
  ResponsiveGrid,
  MobilePageHeader,
  ResponsiveStack,
  TouchActionMenu
};
