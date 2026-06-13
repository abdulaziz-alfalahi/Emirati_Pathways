/**
 * Enhanced Analytics Type Definitions
 * 
 * Installation Location: emirati-journey-platform/src/types/enhancedAnalytics.ts
 * 
 * This file contains all TypeScript interfaces and types for the enhanced analytics system.
 * It provides type safety and IntelliSense support for analytics data structures.
 */

// ============================================================================
// CORE ANALYTICS TYPES
// ============================================================================

export type TimeWindow = '1m' | '5m' | '15m' | '1h' | '1d';

export type EventType = 
  | 'USER_ACTION' 
  | 'SYSTEM_EVENT' 
  | 'PERFORMANCE_METRIC' 
  | 'USER_JOURNEY' 
  | 'BUSINESS_INTELLIGENCE' 
  | 'ERROR_EVENT';

export type EventCategory = 
  | 'cv_parsing' 
  | 'jd_parsing' 
  | 'job_matching' 
  | 'user_management' 
  | 'system_performance' 
  | 'uae_analytics';

export type UAEMetricCategory = 
  | 'emiratization' 
  | 'cultural_fit' 
  | 'sector_analysis' 
  | 'skill_demand' 
  | 'career_progression' 
  | 'language_proficiency' 
  | 'government_private' 
  | 'regional_distribution';

export type Emirate = 
  | 'abu_dhabi' 
  | 'dubai' 
  | 'sharjah' 
  | 'ajman' 
  | 'umm_al_quwain' 
  | 'ras_al_khaimah' 
  | 'fujairah';

export type Sector = 
  | 'banking_finance' 
  | 'compliance_auditor' 
  | 'oil_gas' 
  | 'education' 
  | 'healthcare' 
  | 'technology' 
  | 'tourism_hospitality' 
  | 'manufacturing' 
  | 'retail_trade';

// ============================================================================
// ANALYTICS EVENT INTERFACES
// ============================================================================

export interface DeviceInfo {
  browser: string;
  os: string;
  device_type: 'desktop' | 'mobile' | 'tablet';
  screen_resolution: string;
  language: string;
  timezone: string;
}

export interface LocationInfo {
  emirate?: Emirate;
  city?: string;
  country: string;
  ip_address?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface PerformanceMetrics {
  response_time: number;
  processing_time: number;
  memory_usage?: number;
  cpu_usage?: number;
  cache_hit?: boolean;
  error_count?: number;
}

export interface UAEMetrics {
  emiratization_score?: number;
  cultural_fit_score?: number;
  arabic_proficiency?: 'native' | 'fluent' | 'intermediate' | 'basic' | 'none';
  uae_experience_years?: number;
  sector_preference?: Sector;
  emirate_preference?: Emirate;
  government_sector_interest?: boolean;
  local_education?: boolean;
}

export interface CulturalContext {
  language_used: 'ar' | 'en';
  cultural_references?: string[];
  local_context_score?: number;
  adaptation_indicators?: string[];
}

export interface EnhancedAnalyticsEvent {
  event_id?: string;
  user_id?: string;
  session_id?: string;
  event_type: EventType;
  category: EventCategory;
  action: string;
  label?: string;
  value?: number;
  timestamp?: string;
  device_info?: DeviceInfo;
  location_info?: LocationInfo;
  performance_metrics?: PerformanceMetrics;
  conversion_score?: number;
  uae_metrics?: UAEMetrics;
  cultural_context?: CulturalContext;
  data?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

// ============================================================================
// REAL-TIME METRICS INTERFACES
// ============================================================================

export interface MetricValue {
  value: number;
  timestamp: string;
  change_percentage?: number;
  trend: 'up' | 'down' | 'stable';
}

export interface RealTimeMetrics {
  timestamp: string;
  window: TimeWindow;
  
  // Core metrics
  active_users: MetricValue;
  total_events: MetricValue;
  avg_response_time: MetricValue;
  error_rate: MetricValue;
  
  // Performance metrics
  system_performance: {
    cpu_usage: MetricValue;
    memory_usage: MetricValue;
    cache_hit_rate: MetricValue;
    database_connections: MetricValue;
  };
  
  // User engagement metrics
  user_engagement: {
    session_duration: MetricValue;
    page_views: MetricValue;
    bounce_rate: MetricValue;
    conversion_rate: MetricValue;
  };
  
  // UAE-specific metrics
  uae_metrics: {
    emiratization_rate: MetricValue;
    cultural_fit_average: MetricValue;
    arabic_usage_rate: MetricValue;
    government_sector_interest: MetricValue;
  };
  
  // Business metrics
  business_metrics: {
    cv_parsing_success_rate: MetricValue;
    job_matching_accuracy: MetricValue;
    user_satisfaction_score: MetricValue;
    platform_adoption_rate: MetricValue;
  };
}

// ============================================================================
// UAE ANALYTICS DASHBOARD INTERFACES
// ============================================================================

export interface EmiratizationData {
  overall_progress: {
    current_rate: number;
    target_rate: number;
    progress_percentage: number;
    trend: 'improving' | 'declining' | 'stable';
  };
  
  by_sector: Array<{
    sector: Sector;
    sector_name_en: string;
    sector_name_ar: string;
    current_rate: number;
    target_rate: number;
    gap: number;
    priority_level: 1 | 2 | 3;
  }>;
  
  by_emirate: Array<{
    emirate: Emirate;
    emirate_name_en: string;
    emirate_name_ar: string;
    rate: number;
    population: number;
    job_opportunities: number;
  }>;
  
  talent_pipeline: {
    graduates_per_year: number;
    job_seekers: number;
    skill_matched_candidates: number;
    placement_rate: number;
  };
}

export interface SectorData {
  distribution: Array<{
    sector: Sector;
    sector_name_en: string;
    sector_name_ar: string;
    job_count: number;
    candidate_count: number;
    match_rate: number;
    avg_salary_range: {
      min: number;
      max: number;
      currency: 'AED';
    };
    growth_rate: number;
    emiratization_target: number;
  }>;
  
  trending_sectors: Array<{
    sector: Sector;
    growth_percentage: number;
    job_increase: number;
    skill_demand_change: number;
  }>;
  
  skill_gaps: Array<{
    sector: Sector;
    missing_skills: string[];
    gap_severity: 'high' | 'medium' | 'low';
    training_programs_available: number;
  }>;
}

export interface SkillDemandData {
  by_emirate: Array<{
    emirate: Emirate;
    emirate_name_en: string;
    emirate_name_ar: string;
    top_skills: Array<{
      skill: string;
      demand_score: number;
      job_count: number;
      supply_gap: number;
    }>;
    economic_focus: string[];
  }>;
  
  trending_skills: Array<{
    skill: string;
    growth_rate: number;
    current_demand: number;
    projected_demand: number;
    related_sectors: Sector[];
  }>;
  
  skill_categories: Array<{
    category: string;
    category_ar: string;
    skills: string[];
    demand_level: 'high' | 'medium' | 'low';
    future_outlook: 'growing' | 'stable' | 'declining';
  }>;
}

export interface CulturalFitData {
  overall_metrics: {
    avg_cultural_fit_score: number;
    arabic_proficiency_distribution: Record<string, number>;
    uae_experience_distribution: Record<string, number>;
    local_education_percentage: number;
  };
  
  cultural_indicators: Array<{
    indicator: string;
    indicator_ar: string;
    score: number;
    importance_weight: number;
    trend: 'improving' | 'declining' | 'stable';
  }>;
  
  adaptation_factors: Array<{
    factor: string;
    factor_ar: string;
    impact_score: number;
    correlation_with_success: number;
  }>;
  
  recommendations: Array<{
    category: string;
    recommendation_en: string;
    recommendation_ar: string;
    priority: 'high' | 'medium' | 'low';
    implementation_difficulty: 'easy' | 'medium' | 'hard';
  }>;
}

export interface UAEAnalyticsDashboard {
  timestamp: string;
  emiratization_metrics: EmiratizationData;
  sector_distribution: SectorData;
  skill_demand_by_emirate: SkillDemandData;
  cultural_fit_analytics: CulturalFitData;
  
  summary_insights: {
    key_achievements: string[];
    areas_for_improvement: string[];
    strategic_recommendations: string[];
    performance_indicators: Array<{
      metric: string;
      current_value: number;
      target_value: number;
      status: 'on_track' | 'needs_attention' | 'critical';
    }>;
  };
}

// ============================================================================
// ANALYTICS HEALTH & STATUS INTERFACES
// ============================================================================

export interface AnalyticsHealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  service: string;
  
  features: {
    performance_monitoring: boolean;
    predictive_analytics: boolean;
    real_time_metrics: boolean;
    uae_specific_analytics: boolean;
    user_journey_tracking: boolean;
    cv_analytics: boolean;
    matching_optimizer: boolean;
  };
  
  integrations: {
    database_connection: boolean;
    redis_connection: boolean;
    analytics_engine: boolean;
    event_processing: boolean;
  };
  
  performance_summary: {
    avg_response_time: number;
    events_processed_last_hour: number;
    error_rate_percentage: number;
    cache_hit_rate_percentage: number;
  };
  
  system_resources: {
    memory_usage_percentage: number;
    cpu_usage_percentage: number;
    disk_usage_percentage: number;
    active_connections: number;
  };
}

// ============================================================================
// API RESPONSE INTERFACES
// ============================================================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    per_page: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

// ============================================================================
// CHART DATA INTERFACES
// ============================================================================

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
  category?: string;
  metadata?: Record<string, any>;
}

export interface TimeSeriesData {
  metric_name: string;
  data_points: ChartDataPoint[];
  aggregation_type: 'sum' | 'avg' | 'count' | 'max' | 'min';
  time_window: TimeWindow;
}

export interface DistributionData {
  category: string;
  value: number;
  percentage: number;
  color?: string;
  label_en: string;
  label_ar: string;
}

export interface HeatmapData {
  x_axis: string;
  y_axis: string;
  value: number;
  intensity: number;
  tooltip?: string;
}

// ============================================================================
// FILTER & SEARCH INTERFACES
// ============================================================================

export interface AnalyticsFilters {
  date_range?: {
    start_date: string;
    end_date: string;
  };
  time_window?: TimeWindow;
  event_types?: EventType[];
  categories?: EventCategory[];
  emirates?: Emirate[];
  sectors?: Sector[];
  user_segments?: string[];
  custom_filters?: Record<string, any>;
}

export interface SearchCriteria {
  query?: string;
  filters: AnalyticsFilters;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  page?: number;
  per_page?: number;
}

// ============================================================================
// EXPORT & REPORTING INTERFACES
// ============================================================================

export interface ReportConfig {
  title: string;
  description?: string;
  date_range: {
    start_date: string;
    end_date: string;
  };
  metrics: string[];
  charts: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  language: 'en' | 'ar' | 'both';
  include_raw_data: boolean;
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
}

export interface ExportOptions {
  format: 'csv' | 'excel' | 'json' | 'pdf';
  include_headers: boolean;
  date_format: string;
  language: 'en' | 'ar';
  filters?: AnalyticsFilters;
}

// ============================================================================
// WEBSOCKET & REAL-TIME INTERFACES
// ============================================================================

export interface WebSocketMessage {
  type: 'metrics_update' | 'event_notification' | 'system_alert' | 'health_check';
  payload: any;
  timestamp: string;
  source: string;
}

export interface RealTimeSubscription {
  metrics: string[];
  time_window: TimeWindow;
  update_frequency: number; // seconds
  filters?: AnalyticsFilters;
}

// ============================================================================
// ERROR HANDLING INTERFACES
// ============================================================================

export interface AnalyticsError {
  code: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  context?: Record<string, any>;
  stack_trace?: string;
  user_id?: string;
  session_id?: string;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// ============================================================================
// CONSTANTS
// ============================================================================

export const TIME_WINDOWS: TimeWindow[] = ['1m', '5m', '15m', '1h', '1d'];

export const EMIRATES: Record<Emirate, { name_en: string; name_ar: string; code: string }> = {
  abu_dhabi: { name_en: 'Abu Dhabi', name_ar: 'أبو ظبي', code: 'AD' },
  dubai: { name_en: 'Dubai', name_ar: 'دبي', code: 'DU' },
  sharjah: { name_en: 'Sharjah', name_ar: 'الشارقة', code: 'SH' },
  ajman: { name_en: 'Ajman', name_ar: 'عجمان', code: 'AJ' },
  umm_al_quwain: { name_en: 'Umm Al Quwain', name_ar: 'أم القيوين', code: 'UQ' },
  ras_al_khaimah: { name_en: 'Ras Al Khaimah', name_ar: 'رأس الخيمة', code: 'RK' },
  fujairah: { name_en: 'Fujairah', name_ar: 'الفجيرة', code: 'FU' }
};

export const SECTORS: Record<Sector, { name_en: string; name_ar: string; code: string }> = {
  banking_finance: { name_en: 'Banking & Finance', name_ar: 'المصارف والتمويل', code: 'BANK' },
  government: { name_en: 'Government', name_ar: 'الحكومة', code: 'GOV' },
  oil_gas: { name_en: 'Oil & Gas', name_ar: 'النفط والغاز', code: 'OIL' },
  education: { name_en: 'Education', name_ar: 'التعليم', code: 'EDU' },
  healthcare: { name_en: 'Healthcare', name_ar: 'الرعاية الصحية', code: 'HEALTH' },
  technology: { name_en: 'Technology', name_ar: 'التكنولوجيا', code: 'TECH' },
  tourism_hospitality: { name_en: 'Tourism & Hospitality', name_ar: 'السياحة والضيافة', code: 'TOUR' },
  manufacturing: { name_en: 'Manufacturing', name_ar: 'التصنيع', code: 'MFG' },
  retail_trade: { name_en: 'Retail & Trade', name_ar: 'التجارة والبيع بالتجزئة', code: 'RETAIL' }
};

export const DEFAULT_FILTERS: AnalyticsFilters = {
  time_window: '1h',
  date_range: {
    start_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    end_date: new Date().toISOString()
  }
};

export const REFRESH_INTERVALS = {
  REAL_TIME: 30000, // 30 seconds
  DASHBOARD: 60000, // 1 minute
  REPORTS: 300000, // 5 minutes
  HEALTH_CHECK: 15000 // 15 seconds
} as const;

