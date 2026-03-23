import { NavGroup } from '@/components/layout/types';
import {
  GraduationCap,
  Briefcase,
  Users,
  BookOpen,
  Award,
  Calendar,
  Building2,
  Lightbulb,
  Heart,
  Trophy,
  UserCheck,
  FileText,
  MapPin,
  Monitor,
  Compass,
  Search,
  Shield,
  BarChart3,
  DollarSign,
  CheckSquare,
  User,
  GitCompare,
  Zap,
  Flag,
  Settings,
  Map,
  Stamp,
  Route
} from 'lucide-react';

export const navigationGroups: NavGroup[] = [
  {
    id: 'education',
    name: 'Education Pathway',
    description: 'Educational programs and learning opportunities',
    items: [
      {
        name: 'School Programs',
        href: '/school-programs',
        description: 'Discover innovative educational programs across Dubai schools',
        icon: BookOpen
      },
      {
        name: 'Knowledge Camps',
        href: '/knowledge-camps',
        description: 'Knowledge programs for youth development',
        icon: Calendar
      },
      {
        name: 'Scholarships',
        href: '/scholarships',
        description: 'Educational funding opportunities',
        icon: Award
      },
      {
        name: 'University Programs',
        href: '/university-programs',
        description: 'Higher education pathways',
        icon: GraduationCap
      },
      {
        name: 'Graduate Programs',
        href: '/graduate-programs',
        description: 'Master\'s, PhD, and advanced degree programs',
        icon: GraduationCap
      },
      {
        name: 'Learning Management System',
        href: '/lms',
        description: 'Online learning platform',
        icon: Monitor
      },
      {
        name: 'Youth Development',
        href: '/youth-development',
        description: 'Programs for youth empowerment and early career exposure',
        icon: Users
      }
    ]
  },
  {
    id: 'career',
    name: 'Career Entry',
    description: 'Career planning, job discovery, and entry tools',
    items: [
      {
        name: 'Career Hub',
        href: '/career-hub',
        description: 'Plan your career path, get advisory guidance, and simulate career trajectories',
        icon: Compass
      },
      {
        name: 'CV Builder',
        href: '/cv-builder',
        description: 'Create professional CVs tailored for the Dubai job market',
        icon: FileText
      },
      {
        name: 'Portfolio',
        href: '/portfolio',
        description: 'Create stunning digital portfolios to showcase your work',
        icon: User
      },
      {
        name: 'Job Matching',
        href: '/job-matching',
        description: 'Find opportunities that match your skills',
        icon: Search
      },
      {
        name: 'Interview Preparation',
        href: '/interview-preparation',
        description: 'Prepare for job interviews with AI-powered coaching',
        icon: Users
      },
      {
        name: 'Internships',
        href: '/internships',
        description: 'Professional internship opportunities',
        icon: Briefcase
      },
      {
        name: 'Gig Marketplace',
        href: '/gig-marketplace',
        description: 'Freelance opportunities and project-based work',
        icon: Zap
      },
      {
        name: 'Startup Launchpad',
        href: '/startup-launchpad',
        description: 'Launch your startup with Dubai government programs and funding',
        icon: Lightbulb
      }
    ]
  },
  {
    id: 'professional',
    name: 'Professional Growth',
    description: 'Skill development, credentials, and career advancement',
    items: [
      {
        name: 'Training & Digital Skills',
        href: '/training',
        description: 'Professional training programs and digital literacy courses',
        icon: BookOpen
      },
      {
        name: 'Assessments',
        href: '/assessments',
        description: 'Skill assessment and evaluation',
        icon: CheckSquare
      },
      {
        name: 'Credentials',
        href: '/credentials',
        description: 'Professional certifications, blockchain-verified credentials, and career passport',
        icon: Award
      },
      {
        name: 'Mentorship',
        href: '/mentorship',
        description: 'Connect with experienced mentors for career guidance',
        icon: Heart
      },
      {
        name: 'Communities',
        href: '/communities',
        description: 'Join professional communities, read thought leadership, and share success stories',
        icon: Users
      },
      {
        name: 'Analytics',
        href: '/analytics',
        description: 'View personal career insights and analytics',
        icon: BarChart3
      },
      {
        name: 'Financial Planning',
        href: '/financial-planning',
        description: 'Comprehensive financial wellness and planning tools',
        icon: DollarSign
      }
    ]
  },
  {
    id: 'lifelong',
    name: 'Lifelong Engagement',
    description: 'National service, alumni networks, and post-career opportunities',
    items: [
      {
        name: 'National Service',
        href: '/national-service',
        description: 'National service opportunities and civic engagement',
        icon: Building2
      },
      {
        name: 'Retiree Services',
        href: '/retiree',
        description: 'Post-career opportunities and retirement benefits',
        icon: Users
      },
      {
        name: 'Interactive Map',
        href: '/interactive-map',
        description: 'Explore jobs, training, and services across all Dubai districts',
        icon: Map
      }
    ]
  }
];

// Operator-only nav group — shown via role-based filtering in HybridGovernmentNavFixed
export const operationsNavGroup: NavGroup = {
  id: 'operations',
  name: 'Operations',
  description: 'Operator dashboards and management tools',
  items: [
    {
      name: 'Career Services',
      href: '/career-services-dashboard',
      description: 'Manage salary benchmarks, startups, internships & gigs',
      icon: DollarSign
    },
    {
      name: 'Growth Dashboard',
      href: '/growth-operator-dashboard',
      description: 'Operator dashboard for platform growth',
      icon: BarChart3
    },
    {
      name: 'Operations Center',
      href: '/operations-center',
      description: 'System monitoring and operations',
      icon: Settings
    }
  ]
};
