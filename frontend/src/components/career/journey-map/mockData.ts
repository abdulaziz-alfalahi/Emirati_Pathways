
import { 
  GraduationCap, 
  Briefcase, 
  TrendingUp, 
  Award, 
  Users, 
  Heart
} from 'lucide-react';
import { CareerPath } from './types';

export const emiratiCareerPaths: CareerPath[] = [
  {
    id: 'tech-professional',
    title: 'Technology Professional',
    industry: 'Technology',
    totalProgress: 45,
    stages: [
      {
        id: 'primary-education',
        title: 'Primary & Secondary Education',
        description: 'Complete foundational education in UAE schools',
        category: 'education',
        ageRange: '6-18',
        completed: true,
        current: false,
        recommended: false,
        icon: GraduationCap,
        duration: '12 years',
        requirements: ['UAE curriculum completion', 'EmSAT preparation']
      },
      {
        id: 'university-tech',
        title: 'Technology Degree',
        description: 'Bachelor\'s in Computer Science or related field',
        category: 'education',
        ageRange: '18-22',
        completed: true,
        current: false,
        recommended: false,
        icon: GraduationCap,
        duration: '4 years',
        requirements: ['High school completion', 'University entrance exam']
      },
      {
        id: 'internship',
        title: 'Technology Internship',
        description: 'Gain practical experience in tech companies',
        category: 'career',
        ageRange: '20-23',
        completed: false,
        current: true,
        recommended: true,
        icon: Briefcase,
        duration: '3-6 months',
        benefits: ['Industry experience', 'Professional network', 'Skill application']
      },
      {
        id: 'junior-developer',
        title: 'Junior Developer',
        description: 'Start career as entry-level developer',
        category: 'career',
        ageRange: '22-25',
        completed: false,
        current: false,
        recommended: true,
        icon: Briefcase,
        duration: '2-3 years'
      },
      {
        id: 'senior-developer',
        title: 'Senior Developer',
        description: 'Advanced technical role with leadership responsibilities',
        category: 'career',
        ageRange: '25-35',
        completed: false,
        current: false,
        recommended: false,
        icon: TrendingUp,
        duration: '5-10 years'
      },
      {
        id: 'tech-manager',
        title: 'Technology Manager',
        description: 'Lead technology teams and projects',
        category: 'career',
        ageRange: '30-45',
        completed: false,
        current: false,
        recommended: false,
        icon: Users,
        duration: '10+ years'
      },
      {
        id: 'family-planning',
        title: 'Family & Personal Development',
        description: 'Balance career with family life and personal growth',
        category: 'personal',
        ageRange: '25-40',
        completed: false,
        current: false,
        recommended: true,
        icon: Heart,
        duration: 'Ongoing'
      },
      {
        id: 'retirement-planning',
        title: 'Retirement Planning',
        description: 'Financial planning and career transition preparation',
        category: 'retirement',
        ageRange: '50-60',
        completed: false,
        current: false,
        recommended: false,
        icon: Award,
        duration: '10+ years'
      }
    ]
  },
  {
    id: 'business-leader',
    title: 'Business Leadership',
    industry: 'Business',
    totalProgress: 30,
    stages: [
      {
        id: 'primary-education-biz',
        title: 'Primary & Secondary Education',
        description: 'Complete foundational education in UAE schools',
        category: 'education',
        ageRange: '6-18',
        completed: true,
        current: false,
        recommended: false,
        icon: GraduationCap,
        duration: '12 years'
      },
      {
        id: 'business-degree',
        title: 'Business Administration Degree',
        description: 'Bachelor\'s in Business, Economics, or Management',
        category: 'education',
        ageRange: '18-22',
        completed: true,
        current: false,
        recommended: false,
        icon: GraduationCap,
        duration: '4 years'
      },
      {
        id: 'business-internship',
        title: 'Business Internship',
        description: 'Gain experience in UAE corporations',
        category: 'career',
        ageRange: '20-23',
        completed: false,
        current: true,
        recommended: true,
        icon: Briefcase,
        duration: '3-6 months'
      },
      {
        id: 'junior-analyst',
        title: 'Junior Business Analyst',
        description: 'Entry-level position in business analysis',
        category: 'career',
        ageRange: '22-26',
        completed: false,
        current: false,
        recommended: true,
        icon: Briefcase,
        duration: '2-4 years'
      },
      {
        id: 'manager',
        title: 'Department Manager',
        description: 'Lead business units and teams',
        category: 'career',
        ageRange: '26-35',
        completed: false,
        current: false,
        recommended: false,
        icon: TrendingUp,
        duration: '5-10 years'
      },
      {
        id: 'director',
        title: 'Executive Director',
        description: 'Senior leadership role in organization',
        category: 'career',
        ageRange: '35-50',
        completed: false,
        current: false,
        recommended: false,
        icon: Users,
        duration: '10+ years'
      }
    ]
  }
];
