
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import CareerPathsList from './career-paths/CareerPathsList';
import PathDetailsView from './career-paths/PathDetailsView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { UserCareerPath } from '@/types/careerPath';

const UserCareerPaths = () => {
  const { user } = useAuth();
  const [selectedPath, setSelectedPath] = useState<UserCareerPath | null>(null);
  
  // Demo paths data - in a real app, this would come from your API
  const [availablePaths] = useState<UserCareerPath[]>([
    {
      id: '1',
      user_id: user?.id || '',
      career_path_id: '101',
      current_stage_id: null,
      started_at: new Date().toISOString(),
      updated_at: null,
      career_path: {
        id: '101',
        title: 'Web Development Fundamentals',
        description: 'Learn the basics of HTML, CSS, and JavaScript to build responsive websites.',
        industry: 'Technology',
        created_at: new Date().toISOString(),
        updated_at: null
      },
      steps: [
        { id: '101', title: 'HTML Structure', description: 'Learn the basic building blocks of web pages', completed: true },
        { id: '102', title: 'CSS Styling', description: 'Style your web pages with CSS', completed: true },
        { id: '103', title: 'JavaScript Basics', description: 'Add interactivity to your websites', completed: false },
        { id: '104', title: 'Building a Portfolio', description: 'Create your first web portfolio', completed: false }
      ],
      duration: '4 weeks',
      difficulty: 'beginner',
      completionPercentage: 50,
      isEnrolled: true
    },
    {
      id: '2',
      user_id: user?.id || '',
      career_path_id: '102',
      current_stage_id: null,
      started_at: new Date().toISOString(),
      updated_at: null,
      career_path: {
        id: '102',
        title: 'Data Science Career Path',
        description: 'Master data analysis, visualization, and machine learning algorithms.',
        industry: 'Technology',
        created_at: new Date().toISOString(),
        updated_at: null
      },
      steps: [
        { id: '201', title: 'Python for Data Analysis', description: 'Learn the fundamentals of Python for data science', completed: false },
        { id: '202', title: 'Data Visualization', description: 'Create compelling visualizations with matplotlib and seaborn', completed: false },
        { id: '203', title: 'Machine Learning Basics', description: 'Understand the fundamentals of ML algorithms', completed: false }
      ],
      duration: '8 weeks',
      difficulty: 'intermediate',
      completionPercentage: 0,
      isEnrolled: false
    },
    {
      id: '3',
      user_id: user?.id || '',
      career_path_id: '103',
      current_stage_id: null,
      started_at: new Date().toISOString(),
      updated_at: null,
      career_path: {
        id: '103',
        title: 'Cloud Architecture',
        description: 'Design and implement scalable cloud infrastructure on major platforms like AWS, Azure, and GCP.',
        industry: 'Technology',
        created_at: new Date().toISOString(),
        updated_at: null
      },
      steps: [
        { id: '301', title: 'Cloud Fundamentals', description: 'Understand cloud computing concepts', completed: false },
        { id: '302', title: 'AWS Services', description: 'Learn major AWS services and their use cases', completed: false },
        { id: '303', title: 'Infrastructure as Code', description: 'Automate infrastructure deployment with IaC tools', completed: false },
        { id: '304', title: 'Security Best Practices', description: 'Implement security controls in cloud environments', completed: false }
      ],
      duration: '10 weeks',
      difficulty: 'advanced',
      completionPercentage: 0,
      isEnrolled: false
    }
  ]);
  
  const [enrolledPaths, setEnrolledPaths] = useState<UserCareerPath[]>(() => {
    return availablePaths.filter(path => path.isEnrolled);
  });

  const handleViewPathDetails = (path: UserCareerPath) => {
    setSelectedPath(path);
  };

  const handleBackToList = () => {
    setSelectedPath(null);
  };

  const handleEnroll = (pathId: string) => {
    const path = availablePaths.find(p => p.id === pathId);
    if (!path) return;

    const updatedPath = { ...path, isEnrolled: true };
    
    // Update available paths
    const updatedAvailablePaths = availablePaths.map(p => 
      p.id === pathId ? updatedPath : p
    );

    // Update enrolled paths
    setEnrolledPaths([...enrolledPaths, updatedPath]);
  };

  // Fix the type issue - we need to adapt the UserCareerPath to match what PathDetailsView expects
  if (selectedPath) {
    // Create a compatible object that matches what PathDetailsView expects
    const adaptedPath = {
      id: selectedPath.id,
      title: selectedPath.career_path?.title || 'Career Path',
      description: selectedPath.career_path?.description || '',
      steps: selectedPath.steps || [],
      duration: selectedPath.duration || '',
      difficulty: selectedPath.difficulty || 'beginner',
      completionPercentage: selectedPath.completionPercentage || 0,
      isEnrolled: selectedPath.isEnrolled || false
    };
    
    return <PathDetailsView selectedPath={adaptedPath} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Career Paths</h2>
        <p className="text-muted-foreground">
          Explore and follow structured career paths to reach your professional goals
        </p>
      </div>

      <Separator />

      <Tabs defaultValue="enrolled">
        <TabsList>
          <TabsTrigger value="enrolled">My Paths ({enrolledPaths.length})</TabsTrigger>
          <TabsTrigger value="explore">Explore Paths</TabsTrigger>
        </TabsList>
        <TabsContent value="enrolled" className="mt-6">
          <CareerPathsList 
            userPaths={enrolledPaths} 
            onViewDetails={handleViewPathDetails}
            onDelete={() => {}}
            deletingId={null}
            emptyStateMessage="You haven't enrolled in any career paths yet."
            emptyStateAction="Explore available paths to get started."
          />
        </TabsContent>
        <TabsContent value="explore" className="mt-6">
          <CareerPathsList 
            userPaths={availablePaths.filter(path => !path.isEnrolled)}
            onViewDetails={handleViewPathDetails}
            onDelete={() => {}}
            deletingId={null}
            showEnrollButton={true}
            onEnroll={handleEnroll}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserCareerPaths;
