
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  GraduationCap,
  FileText,
  MessageSquare,
  Bell,
  User,
  TrendingUp,
  Calendar,
  ChevronRight
} from 'lucide-react';

interface MobileDashboardProps {
  user: any;
  roles: string[];
}

const MobileDashboard: React.FC<MobileDashboardProps> = ({ user, roles }) => {
  const navigate = useNavigate();

  const quickActions = [
    {
      icon: FileText,
      label: 'CV Builder',
      path: '/cv-builder',
      color: 'bg-blue-500'
    },
    {
      icon: Briefcase,
      label: 'Jobs',
      path: '/job-matching',
      color: 'bg-ehrdc-teal'
    },
    {
      icon: GraduationCap,
      label: 'Training',
      path: '/training',
      color: 'bg-purple-500'
    },
    {
      icon: MessageSquare,
      label: 'Messages',
      path: '/candidate-dashboard?tab=messages',
      color: 'bg-orange-500'
    },
  ];

  const stats = [
    { label: 'Profile Complete', value: '85%', icon: User },
    { label: 'Job Matches', value: '12', icon: TrendingUp },
    { label: 'Next Session', value: 'Tomorrow', icon: Calendar },
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-ehrdc-teal to-ehrdc-dark-teal text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <h2 className="text-xl font-bold mb-2">
            Welcome back, {user?.user_metadata?.full_name?.split(' ')[0] || 'User'}
          </h2>
          <p className="text-white/80 mb-4">Your Emirati Journey continues</p>
          <div className="flex flex-wrap gap-2">
            {roles.slice(0, 2).map((role) => (
              <Badge key={role} variant="secondary" className="bg-white/20 text-white border-0">
                {role.replace('_', ' ')}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="border border-ehrdc-neutral-light shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-ehrdc-neutral-dark">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action) => (
              <Button
                key={action.path}
                variant="outline"
                className={`
                  h-20 flex-col space-y-2 p-3
                  min-h-[44px] touch-manipulation
                  border-ehrdc-neutral-light hover:border-ehrdc-teal 
                  hover:bg-ehrdc-teal/10 hover:text-ehrdc-teal
                  active:scale-98 transition-all duration-200
                `}
                onClick={() => navigate(action.path)}
              >
                <div className={`p-2 rounded-lg ${action.color} self-center`}>
                  <action.icon className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">{action.label}</span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <Card className="border border-ehrdc-neutral-light shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg text-ehrdc-neutral-dark">Your Progress</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center justify-between py-2">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-ehrdc-teal/10 rounded-lg">
                    <stat.icon className="h-4 w-4 text-ehrdc-teal" />
                  </div>
                  <span className="text-sm font-medium text-ehrdc-neutral-dark">{stat.label}</span>
                </div>
                <span className="text-sm font-bold text-ehrdc-teal">{stat.value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MobileDashboard;
