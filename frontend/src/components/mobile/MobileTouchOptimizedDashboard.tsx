
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import PersonalizationSettings from '@/components/personalization/PersonalizationSettings';
import { UserRole } from '@/types/auth';
import MobileNotifications from './MobileNotifications';
import MobileOfflineIndicator from './MobileOfflineIndicator';
import {
  Briefcase,
  FileText,
  GraduationCap,
  Award,
  TrendingUp,
  Bell,
  Settings,
  ChevronRight,
  Sparkles
} from 'lucide-react';

interface MobileTouchOptimizedDashboardProps {
  user: User | null;
  roles: UserRole[];
}

const MobileTouchOptimizedDashboard: React.FC<MobileTouchOptimizedDashboardProps> = ({
  user,
  roles
}) => {
  const [activeSection, setActiveSection] = useState<string>('overview');

  const quickActions = [
    {
      id: 'job-search',
      icon: Briefcase,
      title: 'Find Jobs',
      description: 'Search for opportunities',
      color: 'bg-blue-500',
      path: '/job-matching'
    },
    {
      id: 'cv-builder',
      icon: FileText,
      title: 'Build CV',
      description: 'Create your CV',
      color: 'bg-green-500',
      path: '/cv-builder'
    },
    {
      id: 'training',
      icon: GraduationCap,
      title: 'Training',
      description: 'Skill development',
      color: 'bg-purple-500',
      path: '/training'
    },
    {
      id: 'achievements',
      icon: Award,
      title: 'Achievements',
      description: 'Track progress',
      color: 'bg-orange-500',
      path: '/achievements'
    }
  ];

  const stats = [
    { label: 'Applications', value: '12', change: '+3' },
    { label: 'Profile Views', value: '48', change: '+15%' },
    { label: 'Skills Completed', value: '8', change: '+2' },
    { label: 'Opportunities', value: '24', change: '+5' }
  ];

  return (
    <div className="space-y-6 p-4">
      {/* Connection Status */}
      <MobileOfflineIndicator />

      {/* Welcome Section */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-none">
        <CardContent className="p-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.user_metadata?.full_name?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold text-gray-900">
                Welcome back, {user?.user_metadata?.full_name || 'User'}!
              </h2>
              <p className="text-sm text-gray-600">
                Continue your journey to success
              </p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" className="bg-white/80 hover:bg-white shadow-sm border-gray-200">
                  <Settings className="h-5 w-5 text-gray-700" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto w-[90vw] max-w-lg p-4">
                <DialogTitle className="sr-only">Settings</DialogTitle>
                <PersonalizationSettings />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat, index) => (
          <Card key={index}>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
              <div className="text-xs text-green-600 font-medium">{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5" />
            <span>Quick Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={action.id}
                  className="p-4 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 active:scale-95 transition-all duration-200 text-start"
                  onClick={() => window.location.href = action.path}
                >
                  <div className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mb-3`}>
                    <IconComponent className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 mb-1">
                    {action.title}
                  </h3>
                  <p className="text-xs text-gray-600">
                    {action.description}
                  </p>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5" />
              <span>Recent Activity</span>
            </div>
            <Button size="sm" variant="ghost">
              View All
              <ChevronRight className="h-4 w-4 ms-1" />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                <Briefcase className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Applied to Software Developer role</p>
                <p className="text-xs text-gray-500">2 hours ago</p>
              </div>
              <Badge variant="outline" className="text-xs">New</Badge>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <Award className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Completed React Fundamentals course</p>
                <p className="text-xs text-gray-500">1 day ago</p>
              </div>
              <Badge variant="secondary" className="text-xs">Completed</Badge>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center">
                <FileText className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Updated CV with new skills</p>
                <p className="text-xs text-gray-500">3 days ago</p>
              </div>
              <Badge variant="outline" className="text-xs">Updated</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <MobileNotifications />
    </div>
  );
};

export default MobileTouchOptimizedDashboard;
