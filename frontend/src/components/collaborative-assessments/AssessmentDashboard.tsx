
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AssessmentCard from './dashboard/AssessmentCard';
import { DashboardStats } from './dashboard/DashboardStats';
import { DashboardHeader } from './dashboard/DashboardHeader';
import { EmptyAssessmentsState } from './dashboard/EmptyAssessmentsState';
import { LoadingState } from './dashboard/LoadingState';
import { CollaborativeAssessment } from '@/types/collaborativeAssessments';

// Create a simple mock assessment interface for display purposes
interface MockAssessment {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'in_progress' | 'completed' | 'pending';
  dueDate: string;
  participants: {
    name: string;
    imageUrl: string;
  }[];
  progress: number;
}

const mockAssessments: MockAssessment[] = [
  {
    id: '1',
    title: 'Teamwork Assessment',
    description: 'Evaluate teamwork and collaboration skills.',
    status: 'draft' as const,
    dueDate: '2024-05-15',
    participants: [
      { name: 'Alice Smith', imageUrl: 'https://example.com/alice.jpg' },
      { name: 'Bob Johnson', imageUrl: 'https://example.com/bob.jpg' },
    ],
    progress: 25,
  },
  {
    id: '2',
    title: 'Leadership Skills Assessment',
    description: 'Assess leadership qualities and potential.',
    status: 'in_progress' as const,
    dueDate: '2024-06-01',
    participants: [
      { name: 'Charlie Brown', imageUrl: 'https://example.com/charlie.jpg' },
      { name: 'Diana Miller', imageUrl: 'https://example.com/diana.jpg' },
    ],
    progress: 50,
  },
  {
    id: '3',
    title: 'Communication Skills Assessment',
    description: 'Evaluate verbal and written communication skills.',
    status: 'completed' as const,
    dueDate: '2024-04-20',
    participants: [
      { name: 'Eve Williams', imageUrl: 'https://example.com/eve.jpg' },
      { name: 'Frank Davis', imageUrl: 'https://example.com/frank.jpg' },
    ],
    progress: 100,
  },
  {
    id: '4',
    title: 'Problem Solving Assessment',
    description: 'Assess abilities to solve complex problems.',
    status: 'pending' as const,
    dueDate: '2024-07-10',
    participants: [
      { name: 'Grace Taylor', imageUrl: 'https://example.com/grace.jpg' },
      { name: 'Harry Moore', imageUrl: 'https://example.com/harry.jpg' },
    ],
    progress: 0,
  },
];

interface AssessmentDashboardProps {
  onCreateAssessment?: () => void;
  onCreateTemplate?: () => void;
  onViewAssessment?: (assessment: any) => void;
  onEvaluateAssessment?: (assessment: any) => void;
}

const AssessmentDashboard: React.FC<AssessmentDashboardProps> = ({
  onCreateAssessment = () => {},
  onCreateTemplate,
  onViewAssessment = () => {},
  onEvaluateAssessment = () => {}
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      <DashboardHeader 
        onCreateAssessment={onCreateAssessment}
        onCreateTemplate={onCreateTemplate}
      />
      <DashboardStats assessments={mockAssessments} />
      
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All Assessments</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockAssessments.map((assessment) => (
              <AssessmentCard key={assessment.id} assessment={assessment} />
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockAssessments
              .filter((assessment) => assessment.status === 'in_progress')
              .map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="draft" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockAssessments
              .filter((assessment) => assessment.status === 'draft')
              .map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
          </div>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {mockAssessments
              .filter((assessment) => assessment.status === 'completed')
              .map((assessment) => (
                <AssessmentCard key={assessment.id} assessment={assessment} />
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AssessmentDashboard;
