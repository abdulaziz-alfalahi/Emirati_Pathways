
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Assessment, Program, TrainingMetrics } from '@/types/training-center';
import AssessmentsTab from './training-center/AssessmentsTab';
import ProgramsTab from './training-center/ProgramsTab';
import TraineesTab from './training-center/TraineesTab';
import OverviewTab from './training-center/OverviewTab';
import { Separator } from '@/components/ui/separator';
import { CalendarRange, GraduationCap, BarChart, FileText, Users } from 'lucide-react';

interface TrainingCenterDashboardProps {
  activeTab?: string;
}

const TrainingCenterDashboard: React.FC<TrainingCenterDashboardProps> = ({ activeTab = 'overview' }) => {
  const [currentTab, setCurrentTab] = useState(activeTab);

  // Sample data for demonstration purposes
  const [samplePrograms, setSamplePrograms] = useState<Program[]>([
    {
      id: 1,
      title: 'Advanced Leadership Development',
      trainees: 48,
      startDate: '2025-04-15',
      status: 'active',
      description: 'A comprehensive program designed to develop leadership skills in mid-career professionals.',
      category: 'Professional Development',
      instructor: 'Dr. Ahmed Al Mansouri',
      location: 'Dubai Training Center - Main Campus',
      progress: 65
    },
    {
      id: 2,
      title: 'Technical Skills Bootcamp',
      trainees: 35,
      startDate: '2025-05-01',
      status: 'planned',
      description: 'Intensive training focusing on essential technical skills for the modern workplace.',
      category: 'Technical Training',
      instructor: 'Eng. Fatima Al Zaabi',
      location: 'Abu Dhabi Technology Hub',
      progress: 0
    },
    {
      id: 3,
      title: 'Professional Certification Program',
      trainees: 22,
      startDate: '2025-03-10',
      status: 'completed',
      description: 'Prepare participants for industry-recognized professional certifications.',
      category: 'Certification',
      instructor: 'Prof. Mohammed Al Hashimi',
      location: 'Virtual Training Platform',
      progress: 100
    },
    {
      id: 4,
      title: 'Data Analytics Fundamentals',
      trainees: 40,
      startDate: '2025-05-15',
      status: 'planned',
      description: 'Essential data analysis skills for the modern business environment.',
      category: 'Data Science',
      instructor: 'Dr. Layla Ibrahim',
      location: 'Sharjah Innovation Center',
      progress: 0
    }
  ]);

  const sampleAssessments: Assessment[] = [
    {
      id: 1,
      title: 'Leadership Capability Assessment',
      candidates: 64,
      date: '2025-04-20',
      type: 'capabilities',
      passingScore: 75,
      duration: 90
    },
    {
      id: 2,
      title: 'Technical Competency Evaluation',
      candidates: 48,
      date: '2025-04-25',
      type: 'skills',
      passingScore: 70,
      duration: 120
    },
    {
      id: 3,
      title: 'Behavioral Assessment',
      candidates: 37,
      date: '2025-05-05',
      type: 'behaviors',
      passingScore: 65,
      duration: 60
    }
  ];

  const trainingMetrics: TrainingMetrics = {
    totalTrainees: 245,
    activePrograms: 18,
    completionRate: 87,
    satisfactionScore: 4.6,
    employmentRate: 78
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Training Center Dashboard</h2>
          <p className="text-muted-foreground">
            Manage your training programs, assessments, and certifications
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <CalendarRange className="h-10 w-10 text-emirati-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Active Programs</p>
                <p className="text-2xl font-bold">{trainingMetrics.activePrograms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Users className="h-10 w-10 text-emirati-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Total Trainees</p>
                <p className="text-2xl font-bold">{trainingMetrics.totalTrainees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <GraduationCap className="h-10 w-10 text-emirati-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{trainingMetrics.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <BarChart className="h-10 w-10 text-emirati-teal" />
              <div>
                <p className="text-sm text-muted-foreground">Job Placement</p>
                <p className="text-2xl font-bold">{trainingMetrics.employmentRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      <Tabs defaultValue={currentTab} onValueChange={setCurrentTab} className="space-y-4">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="assessments">Assessments</TabsTrigger>
          <TabsTrigger value="trainees">Trainees</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <OverviewTab programs={samplePrograms} assessments={sampleAssessments} />
        </TabsContent>
        
        <TabsContent value="programs" className="space-y-4">
          <ProgramsTab programs={samplePrograms} setPrograms={setSamplePrograms} />
        </TabsContent>
        
        <TabsContent value="assessments" className="space-y-4">
          <AssessmentsTab />
        </TabsContent>
        
        <TabsContent value="trainees" className="space-y-4">
          <TraineesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TrainingCenterDashboard;
