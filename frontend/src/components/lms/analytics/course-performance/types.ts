
export interface CoursePerformance {
  id: string;
  courseName: string;
  enrollments: number;
  completions: number;
  completionRate: number;
  averageScore: number;
  engagementRate: number;
  dropoffRate: number;
  trend: 'up' | 'down' | 'stable';
}

export type SortField = keyof CoursePerformance;
export type SortDirection = 'asc' | 'desc';
