/**
 * @fileoverview Shared Components Index
 * 
 * Central export point for all shared UI components.
 * 
 * @module components/shared
 */

// Stats Card
export {
  default as StatsCard,
  StatsGrid,
  StatsCardSkeleton,
  TrendBadge,
  ProgressBar
} from './StatsCard';

// Skeleton Loaders
export {
  StatsCardSkeleton as StatsSkeleton,
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
} from './SkeletonLoaders';

// Error Handling
export {
  SectionErrorBoundary,
  ErrorDisplay,
  NetworkError,
  ServerError,
  NotFoundError,
  AccessDeniedError,
  EmptyState,
  NoResults,
  NoData,
  InlineAlert,
  ApiError
} from './ErrorHandling';

// Responsive Utilities
export {
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
  TouchActionMenu,
  breakpoints
} from './ResponsiveUtils';
