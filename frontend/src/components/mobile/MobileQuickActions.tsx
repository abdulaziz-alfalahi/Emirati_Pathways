
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  FileText, 
  Briefcase, 
  GraduationCap, 
  Calendar,
  MessageSquare,
  Award,
  TrendingUp,
  Clock,
  ChevronRight
} from 'lucide-react';

const MobileQuickActions: React.FC = () => {
  const navigate = useNavigate();
  const { roles } = useAuth();

  const getQuickActions = () => {
    const baseActions = [
      {
        icon: FileText,
        label: 'Update CV',
        path: '/cv-builder',
        description: 'Keep your CV current',
        color: 'bg-blue-500'
      },
      {
        icon: Briefcase,
        label: 'Find Jobs',
        path: '/job-matching',
        description: 'Discover opportunities',
        color: 'bg-ehrdc-teal'
      },
    ];

    // Add role-specific actions
    if (roles.includes('school_student') || roles.includes('university_student')) {
      baseActions.push({
        icon: GraduationCap,
        label: 'Scholarships',
        path: '/scholarships',
        description: 'Apply for funding',
        color: 'bg-purple-500'
      });
    }

    if (roles.includes('jobseeker') || roles.includes('intern')) {
      baseActions.push({
        icon: TrendingUp,
        label: 'Assessments',
        path: '/assessments',
        description: 'Test your skills',
        color: 'bg-orange-500'
      });
    }

    baseActions.push(
      {
        icon: Calendar,
        label: 'Career Advisory',
        path: '/career-advisory',
        description: 'Book a session',
        color: 'bg-indigo-500'
      },
      {
        icon: Award,
        label: 'Training',
        path: '/training',
        description: 'Enhance skills',
        color: 'bg-pink-500'
      }
    );

    return baseActions.slice(0, 6); // Limit to 6 actions for mobile
  };

  const quickActions = getQuickActions();

  return (
    <Card className="border border-ehrdc-neutral-light shadow-md">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center text-ehrdc-neutral-dark">
          <Clock className="h-5 w-5 me-2 text-ehrdc-teal" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {quickActions.map((action) => (
            <Button
              key={action.path}
              variant="ghost"
              className={`
                w-full h-16 justify-between p-4 
                hover:bg-ehrdc-teal/10 hover:border-ehrdc-teal/20 
                border border-ehrdc-neutral-light
                min-h-[44px] touch-manipulation
                active:scale-98 transition-all duration-200
              `}
              onClick={() => navigate(action.path)}
            >
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${action.color} flex-shrink-0`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <div className="text-start">
                  <div className="text-sm font-medium text-ehrdc-neutral-dark">{action.label}</div>
                  <div className="text-xs text-ehrdc-neutral-dark/70">{action.description}</div>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-ehrdc-neutral-dark/40 flex-shrink-0" />
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileQuickActions;
