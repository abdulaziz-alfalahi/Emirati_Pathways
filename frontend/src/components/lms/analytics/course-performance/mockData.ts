
import { CoursePerformance } from './types';

export const mockCourseData: CoursePerformance[] = [
  {
    id: '1',
    courseName: 'React Fundamentals',
    enrollments: 120,
    completions: 107,
    completionRate: 89,
    averageScore: 85,
    engagementRate: 92,
    dropoffRate: 11,
    trend: 'up'
  },
  {
    id: '2',
    courseName: 'JavaScript Mastery',
    enrollments: 95,
    completions: 72,
    completionRate: 76,
    averageScore: 78,
    engagementRate: 84,
    dropoffRate: 24,
    trend: 'down'
  },
  {
    id: '3',
    courseName: 'UI/UX Design',
    enrollments: 88,
    completions: 72,
    completionRate: 82,
    averageScore: 87,
    engagementRate: 89,
    dropoffRate: 18,
    trend: 'up'
  },
  {
    id: '4',
    courseName: 'Data Analytics',
    enrollments: 110,
    completions: 72,
    completionRate: 65,
    averageScore: 75,
    engagementRate: 78,
    dropoffRate: 35,
    trend: 'stable'
  },
  {
    id: '5',
    courseName: 'Project Management',
    enrollments: 76,
    completions: 69,
    completionRate: 91,
    averageScore: 88,
    engagementRate: 94,
    dropoffRate: 9,
    trend: 'up'
  }
];
