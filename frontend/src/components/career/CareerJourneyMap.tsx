
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getUserCareerPaths } from '@/services/careerPathService';
import { getPersonalGoals, PersonalGoal, GoalTemplate } from '@/services/personalGoalsService';
import { UserCareerPath } from '@/types/careerPath';
import ExportJourneyDialog from './ExportJourneyDialog';
import CareerPathComparison from './CareerPathComparison';
import JourneyMapHeader from './journey-map/JourneyMapHeader';
import JourneyMapLegend from './journey-map/JourneyMapLegend';
import CareerPathCard from './journey-map/CareerPathCard';
import PersonalGoalsPanel from './journey-map/PersonalGoalsPanel';
import { emiratiCareerPaths } from './journey-map/mockData';
import { CareerPath } from './journey-map/types';

const CareerJourneyMap: React.FC = () => {
  const { user } = useAuth();
  const [userCareerPaths, setUserCareerPaths] = useState<UserCareerPath[]>([]);
  const [userGoals, setUserGoals] = useState<PersonalGoal[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const [draggedGoal, setDraggedGoal] = useState<PersonalGoal | GoalTemplate | null>(null);
  const [isDragTemplate, setIsDragTemplate] = useState(false);
  const journeyMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const [paths, goals] = await Promise.all([
          getUserCareerPaths(user.id),
          getPersonalGoals(user.id)
        ]);
        setUserCareerPaths(paths);
        setUserGoals(goals);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  const filteredPaths = emiratiCareerPaths.filter(path => {
    if (selectedPath !== 'all' && path.id !== selectedPath) return false;
    if (selectedCategory !== 'all') {
      return path.stages.some(stage => stage.category === selectedCategory);
    }
    return true;
  });

  const exportData = {
    selectedPath,
    selectedCategory,
    filteredPaths,
    userCareerPaths,
    userGoals,
    exportedAt: new Date().toISOString()
  };

  const handleGoalDragStart = (goal: PersonalGoal | GoalTemplate, isTemplate: boolean) => {
    setDraggedGoal(goal);
    setIsDragTemplate(isTemplate);
  };

  const handleGoalDragEnd = () => {
    setDraggedGoal(null);
    setIsDragTemplate(false);
  };

  const handleGoalAssigned = async (stageId: string, goalId: string) => {
    // Refresh goals to get updated assignments
    if (user) {
      try {
        const updatedGoals = await getPersonalGoals(user.id);
        setUserGoals(updatedGoals);
      } catch (error) {
        console.error('Error refreshing goals:', error);
      }
    }
  };

  const handleGoalRemoved = async (stageId: string, goalId: string) => {
    // Refresh goals to get updated assignments
    if (user) {
      try {
        const updatedGoals = await getPersonalGoals(user.id);
        setUserGoals(updatedGoals);
      } catch (error) {
        console.error('Error refreshing goals:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <JourneyMapHeader
        selectedPath={selectedPath}
        setSelectedPath={setSelectedPath}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onOpenComparison={() => setIsComparisonOpen(true)}
        onOpenExport={() => setIsExportDialogOpen(true)}
        availablePaths={emiratiCareerPaths}
      />

      <JourneyMapLegend />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Personal Goals Panel */}
        <div className="lg:col-span-1">
          {user && (
            <PersonalGoalsPanel
              userId={user.id}
              onGoalDragStart={handleGoalDragStart}
              onGoalDragEnd={handleGoalDragEnd}
            />
          )}
        </div>

        {/* Career Journey Maps */}
        <div ref={journeyMapRef} className="lg:col-span-3 space-y-8">
          {filteredPaths.map(path => (
            <CareerPathCard 
              key={path.id} 
              path={path} 
              selectedCategory={selectedCategory}
              userGoals={userGoals}
              onGoalAssigned={handleGoalAssigned}
              onGoalRemoved={handleGoalRemoved}
            />
          ))}
        </div>
      </div>

      <ExportJourneyDialog
        isOpen={isExportDialogOpen}
        onOpenChange={setIsExportDialogOpen}
        elementRef={journeyMapRef}
        journeyData={exportData}
      />

      <CareerPathComparison
        availablePaths={emiratiCareerPaths}
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      />
    </div>
  );
};

export default CareerJourneyMap;
