
import { useMemo } from 'react';
import {
  LayoutDashboard,
  User,
  FileText,
  MapPin,
  Calendar,
  GraduationCap,
  Briefcase,
  BookOpen,
  Monitor,
  CheckSquare,
  Users,
  UserCheck,
  Search,
  Award,
  Shield,
  BarChart3
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const useNavItems = () => {
  const { user } = useAuth();

  const navItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Profile', href: '/profile', icon: User },
    { name: 'Portfolio', href: '/portfolio', icon: FileText },
    { name: 'Resume Builder', href: '/resume-builder', icon: FileText },
    { name: 'Career Journey', href: '/career-journey', icon: MapPin },
    { name: 'Knowledge Camps', href: '/knowledge-camps', icon: Calendar },
    { name: 'Scholarships', href: '/scholarships', icon: GraduationCap },
    { name: 'Internships', href: '/internships', icon: Briefcase },
    { name: 'Training', href: '/training', icon: BookOpen },
    { name: 'LMS', href: '/lms', icon: Monitor },
    { name: 'Assessments', href: '/assessments', icon: CheckSquare },
    { name: 'Collaborative Assessments', href: '/collaborative-assessments', icon: Users },
    { name: 'Career Advisory', href: '/career-advisory', icon: UserCheck },
    { name: 'Job Matching', href: '/job-matching', icon: Search },
    { name: 'Communities', href: '/communities', icon: Users },
    { name: 'Mentorship', href: '/mentorship', icon: UserCheck },
    { name: 'Skills Marketplace', href: '/skills-marketplace', icon: Users },
    { name: 'Credentials', href: '/credentials', icon: Award },
    { name: 'Blockchain Credentials', href: '/blockchain-credentials', icon: Shield },
    { name: 'Share Success Stories', href: '/share-success-stories', icon: Award },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Recruiter Jobs', href: '/recruiter/jobs', icon: Briefcase },
    { name: 'Recruiter Candidates', href: '/recruiter/candidates', icon: Users },
    { name: 'Recruiter Offers', href: '/recruiter/offers', icon: Briefcase },
    { name: 'Recruiter Approvals', href: '/recruiter/approvals', icon: CheckSquare },
    { name: 'Recruiter Distribution', href: '/recruiter/distribution', icon: Users },
    { name: 'Recruiter Interviews', href: '/recruiter/interviews/schedule', icon: Calendar },
    { name: 'Interview Details', href: '/recruiter/interviews/details', icon: Calendar },
    { name: 'Recruiter Analytics', href: '/recruiter/analytics', icon: BarChart3 }
  ];

  const authenticatedNavItems = useMemo(() => {
    if (!user) {
      return [];
    }

    return navItems;
  }, [user]);

  return authenticatedNavItems;
};

export default useNavItems;
