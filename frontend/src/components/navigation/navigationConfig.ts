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
    featureFlagKey: 'nav_education_pathway',
    items: [
      {
        name: 'School Programs',
        href: '/school-programs',
        description: 'Discover innovative educational programs across Dubai schools',
        icon: BookOpen,
        featureFlagKey: 'page_school_programs'
      },
      {
        name: 'Knowledge Camps',
        href: '/knowledge-camps',
        description: 'Knowledge programs for youth development',
        icon: Calendar,
        featureFlagKey: 'page_knowledge_camps'
      },
      {
        name: 'Scholarships',
        href: '/scholarships',
        description: 'Educational funding opportunities',
        icon: Award,
        featureFlagKey: 'page_scholarships'
      },
      {
        name: 'University Programs',
        href: '/university-programs',
        description: 'Higher education pathways',
        icon: GraduationCap,
        featureFlagKey: 'page_university_programs'
      },
      {
        name: 'Graduate Programs',
        href: '/graduate-programs',
        description: 'Master\'s, PhD, and advanced degree programs',
        icon: GraduationCap,
        featureFlagKey: 'page_graduate_programs'
      },
      {
        name: 'Learning Management System',
        href: '/lms',
        description: 'Online learning platform',
        icon: Monitor,
        featureFlagKey: 'page_lms'
      },
      {
        name: 'Youth Development',
        href: '/youth-development',
        description: 'Programs for youth empowerment and early career exposure',
        icon: Users,
        featureFlagKey: 'page_youth_development'
      }
    ]
  },
  {
    id: 'career',
    name: 'Career Entry',
    description: 'Career planning, job discovery, and entry tools',
    featureFlagKey: 'nav_career_entry',
    items: [
      {
        name: 'Career Hub',
        href: '/career-hub',
        description: 'Plan your career path, get advisory guidance, and simulate career trajectories',
        icon: Compass,
        featureFlagKey: 'page_career_hub'
      },
      {
        name: 'CV Builder',
        href: '/cv-builder',
        description: 'Create professional CVs tailored for the Dubai job market',
        icon: FileText,
        featureFlagKey: 'page_cv_builder'
      },
      {
        name: 'Portfolio',
        href: '/portfolio',
        description: 'Create stunning digital portfolios to showcase your work',
        icon: User,
        featureFlagKey: 'page_portfolio'
      },
      {
        name: 'Job Matching',
        href: '/job-matching',
        description: 'Find opportunities that match your skills',
        icon: Search,
        featureFlagKey: 'page_job_matching'
      },
      {
        name: 'Interview Preparation',
        href: '/interview-preparation',
        description: 'Prepare for job interviews with AI-powered coaching',
        icon: Users,
        featureFlagKey: 'page_interview_preparation'
      },
      {
        name: 'Internships',
        href: '/internships',
        description: 'Professional internship opportunities',
        icon: Briefcase,
        featureFlagKey: 'page_internships'
      },
      {
        name: 'Gig Marketplace',
        href: '/gig-marketplace',
        description: 'Freelance opportunities and project-based work',
        icon: Zap,
        featureFlagKey: 'page_gig_marketplace'
      },
      {
        name: 'Startup Launchpad',
        href: '/startup-launchpad',
        description: 'Launch your startup with Dubai government programs and funding',
        icon: Lightbulb,
        featureFlagKey: 'page_startup_launchpad'
      }
    ]
  },
  {
    id: 'professional',
    name: 'Professional Growth',
    description: 'Skill development, credentials, and career advancement',
    featureFlagKey: 'nav_professional_growth',
    items: [
      {
        name: 'Training & Digital Skills',
        href: '/training',
        description: 'Professional training programs and digital literacy courses',
        icon: BookOpen,
        featureFlagKey: 'page_training'
      },
      {
        name: 'Assessments',
        href: '/assessments',
        description: 'Skill assessment and evaluation',
        icon: CheckSquare,
        featureFlagKey: 'page_assessments'
      },
      {
        name: 'Credentials',
        href: '/credentials',
        description: 'Professional certifications, blockchain-verified credentials, and career passport',
        icon: Award,
        featureFlagKey: 'page_credentials'
      },
      {
        name: 'Mentorship',
        href: '/mentorship',
        description: 'Connect with experienced mentors for career guidance',
        icon: Heart,
        featureFlagKey: 'page_mentorship'
      },
      {
        name: 'Communities',
        href: '/communities',
        description: 'Join professional communities, read thought leadership, and share success stories',
        icon: Users,
        featureFlagKey: 'page_communities'
      },
      {
        name: 'Analytics',
        href: '/analytics',
        description: 'View personal career insights and analytics',
        icon: BarChart3,
        featureFlagKey: 'page_analytics'
      },
      {
        name: 'Financial Planning',
        href: '/financial-planning',
        description: 'Comprehensive financial wellness and planning tools',
        icon: DollarSign,
        featureFlagKey: 'page_financial_planning'
      }
    ]
  },
  {
    id: 'lifelong',
    name: 'Lifelong Engagement',
    description: 'National service, alumni networks, and post-career opportunities',
    featureFlagKey: 'nav_lifelong_engagement',
    items: [
      {
        name: 'National Service',
        href: '/national-service',
        description: 'National service opportunities and civic engagement',
        icon: Building2,
        featureFlagKey: 'page_national_service'
      },
      {
        name: 'Retiree Services',
        href: '/retiree',
        description: 'Post-career opportunities and retirement benefits',
        icon: Users,
        featureFlagKey: 'page_retiree'
      },
      {
        name: 'Interactive Map',
        href: '/interactive-map',
        description: 'Explore jobs, training, and services across all Dubai districts',
        icon: Map,
        featureFlagKey: 'page_interactive_map'
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
      href: '/career-services-crm',
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
      name: 'Demographics Analytics',
      href: '/demographics',
      description: 'Deep-dive analysis of the talent pool',
      icon: Users
    },
    {
      name: 'Operations Monitoring',
      href: '/operations-center',
      description: 'System monitoring and live operational activity',
      icon: Settings
    },
    {
      name: 'Executive Impact',
      href: '/executive',
      description: 'High-level KPI tracking for Board Members',
      icon: Award
    }
  ]
};
