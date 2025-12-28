/**
 * @fileoverview Dashboard Layout Component
 * 
 * Provides a consistent layout wrapper for all dashboard pages with:
 * - Standardized header with title, description, and actions
 * - Consistent spacing and styling
 * - Mobile-responsive design
 * - Loading states and error boundaries
 * - Breadcrumb navigation
 * 
 * @module components/layout/DashboardLayout
 */

import React, { ReactNode, Suspense } from 'react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { LoadingSpinner, DashboardSkeleton } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  RefreshCw,
  Home,
  ChevronRight,
  Bell,
  Settings,
  HelpCircle,
  Menu,
  X
} from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Breadcrumb item configuration
 */
interface BreadcrumbItemConfig {
  label: string;
  href?: string;
}

/**
 * Action button configuration
 */
interface ActionButton {
  label: string;
  icon?: ReactNode;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'secondary' | 'ghost' | 'destructive';
  disabled?: boolean;
}

/**
 * Dashboard Layout Props
 */
interface DashboardLayoutProps {
  /** Page title displayed in the header */
  title: string;
  /** Optional description/subtitle */
  description?: string;
  /** Icon to display next to the title */
  icon?: ReactNode;
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItemConfig[];
  /** Action buttons in the header */
  actions?: ActionButton[];
  /** Whether to show the refresh button */
  showRefresh?: boolean;
  /** Refresh callback function */
  onRefresh?: () => void;
  /** Whether the dashboard is currently loading */
  isLoading?: boolean;
  /** Loading text to display */
  loadingText?: string;
  /** Badge content (e.g., status, count) */
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  };
  /** Additional header content */
  headerContent?: ReactNode;
  /** Sidebar content for desktop */
  sidebar?: ReactNode;
  /** Whether to show the sidebar on mobile */
  showMobileSidebar?: boolean;
  /** Mobile sidebar toggle callback */
  onToggleMobileSidebar?: () => void;
  /** Main content */
  children: ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Full width mode (no max-width constraint) */
  fullWidth?: boolean;
  /** Background color variant */
  bgVariant?: 'default' | 'gray' | 'white';
}

/**
 * Dashboard Header Component
 */
const DashboardHeader: React.FC<{
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: { text: string; variant?: 'default' | 'secondary' | 'destructive' | 'outline' };
  actions?: ActionButton[];
  showRefresh?: boolean;
  onRefresh?: () => void;
  isLoading?: boolean;
  headerContent?: ReactNode;
  showMobileSidebar?: boolean;
  onToggleMobileSidebar?: () => void;
}> = ({
  title,
  description,
  icon,
  badge,
  actions,
  showRefresh,
  onRefresh,
  isLoading,
  headerContent,
  showMobileSidebar,
  onToggleMobileSidebar
}) => {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Title Section */}
        <div className="flex items-start gap-3">
          {/* Mobile menu toggle */}
          {onToggleMobileSidebar && (
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden -ml-2"
              onClick={onToggleMobileSidebar}
            >
              {showMobileSidebar ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          {/* Icon */}
          {icon && (
            <div className="flex-shrink-0 p-2 bg-teal-100 rounded-lg text-teal-600">
              {icon}
            </div>
          )}
          
          {/* Title and description */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                {title}
              </h1>
              {badge && (
                <Badge variant={badge.variant || 'default'}>
                  {badge.text}
                </Badge>
              )}
            </div>
            {description && (
              <p className="mt-1 text-sm sm:text-base text-gray-500">
                {description}
              </p>
            )}
          </div>
        </div>
        
        {/* Actions Section */}
        <div className="flex items-center gap-2 flex-wrap">
          {showRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="hidden sm:flex"
            >
              <RefreshCw className={cn("h-4 w-4 mr-2", isLoading && "animate-spin")} />
              Refresh
            </Button>
          )}
          
          {actions?.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size="sm"
              onClick={action.onClick}
              disabled={action.disabled}
            >
              {action.icon && <span className="mr-2">{action.icon}</span>}
              <span className="hidden sm:inline">{action.label}</span>
              <span className="sm:hidden">{action.icon || action.label.charAt(0)}</span>
            </Button>
          ))}
        </div>
      </div>
      
      {/* Additional header content */}
      {headerContent && (
        <div className="mt-4">
          {headerContent}
        </div>
      )}
    </div>
  );
};

/**
 * Dashboard Breadcrumbs Component
 */
const DashboardBreadcrumbs: React.FC<{
  items: BreadcrumbItemConfig[];
}> = ({ items }) => {
  if (items.length === 0) return null;
  
  return (
    <Breadcrumb className="mb-4">
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/" className="flex items-center">
            <Home className="h-4 w-4" />
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <BreadcrumbSeparator>
              <ChevronRight className="h-4 w-4" />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {index === items.length - 1 ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href || '#'}>
                  {item.label}
                </BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </React.Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

/**
 * Dashboard Loading State Component
 */
const DashboardLoading: React.FC<{
  text?: string;
}> = ({ text = 'Loading dashboard...' }) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};

/**
 * Dashboard Error Fallback Component
 */
const DashboardErrorFallback: React.FC<{
  title: string;
  onRetry?: () => void;
}> = ({ title, onRetry }) => {
  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center text-center p-6">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
        <HelpCircle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">
        Error Loading {title}
      </h2>
      <p className="text-gray-500 mb-4 max-w-md">
        We encountered an error while loading this dashboard. Please try again or contact support if the problem persists.
      </p>
      {onRetry && (
        <Button onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
};

/**
 * Main Dashboard Layout Component
 * 
 * Provides a consistent layout structure for all dashboard pages with:
 * - Responsive header with title, description, and actions
 * - Optional breadcrumb navigation
 * - Loading states with skeleton loaders
 * - Error boundary with fallback UI
 * - Mobile-responsive sidebar support
 * 
 * @example
 * ```tsx
 * <DashboardLayout
 *   title="Admin Dashboard"
 *   description="Manage users and system settings"
 *   icon={<Settings className="h-6 w-6" />}
 *   breadcrumbs={[{ label: 'Admin' }, { label: 'Dashboard' }]}
 *   showRefresh
 *   onRefresh={handleRefresh}
 *   isLoading={isLoading}
 * >
 *   <DashboardContent />
 * </DashboardLayout>
 * ```
 */
const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  title,
  description,
  icon,
  breadcrumbs = [],
  actions,
  showRefresh = false,
  onRefresh,
  isLoading = false,
  loadingText,
  badge,
  headerContent,
  sidebar,
  showMobileSidebar = false,
  onToggleMobileSidebar,
  children,
  className,
  fullWidth = false,
  bgVariant = 'gray'
}) => {
  const bgClasses = {
    default: 'bg-gray-50',
    gray: 'bg-gray-50',
    white: 'bg-white'
  };

  return (
    <ErrorBoundary
      fallback={<DashboardErrorFallback title={title} onRetry={onRefresh} />}
    >
      <div className={cn(
        'min-h-screen',
        bgClasses[bgVariant],
        className
      )}>
        {/* Main content area */}
        <div className="flex">
          {/* Sidebar (desktop) */}
          {sidebar && (
            <aside className="hidden md:block w-64 flex-shrink-0 border-r bg-white">
              {sidebar}
            </aside>
          )}
          
          {/* Mobile sidebar overlay */}
          {sidebar && showMobileSidebar && (
            <div className="fixed inset-0 z-40 md:hidden">
              <div 
                className="fixed inset-0 bg-black/50"
                onClick={onToggleMobileSidebar}
              />
              <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl z-50">
                {sidebar}
              </aside>
            </div>
          )}
          
          {/* Main content */}
          <main className={cn(
            'flex-1 min-w-0',
            'px-4 sm:px-6 lg:px-8',
            'py-6 sm:py-8'
          )}>
            <div className={cn(
              'mx-auto',
              !fullWidth && 'max-w-7xl'
            )}>
              {/* Breadcrumbs */}
              {breadcrumbs.length > 0 && (
                <DashboardBreadcrumbs items={breadcrumbs} />
              )}
              
              {/* Header */}
              <DashboardHeader
                title={title}
                description={description}
                icon={icon}
                badge={badge}
                actions={actions}
                showRefresh={showRefresh}
                onRefresh={onRefresh}
                isLoading={isLoading}
                headerContent={headerContent}
                showMobileSidebar={showMobileSidebar}
                onToggleMobileSidebar={onToggleMobileSidebar}
              />
              
              {/* Content */}
              <Suspense fallback={<DashboardSkeleton />}>
                {isLoading ? (
                  <DashboardLoading text={loadingText} />
                ) : (
                  children
                )}
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default DashboardLayout;
export { DashboardHeader, DashboardBreadcrumbs, DashboardLoading, DashboardErrorFallback };
