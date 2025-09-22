
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Crown, Target, Users, TrendingUp, CheckCircle, Lock, Play } from 'lucide-react';

export interface LeadershipModule {
  id: string;
  title: string;
  description: string;
  category: 'emotional_intelligence' | 'strategic_thinking' | 'team_management' | 'communication' | 'decision_making';
  level: 'foundation' | 'intermediate' | 'advanced' | 'executive';
  duration: string;
  format: 'self_paced' | 'instructor_led' | 'blended' | 'cohort';
  prerequisites: string[];
  learningObjectives: string[];
  assessments: {
    type: 'quiz' | 'project' | 'peer_review' | '360_feedback';
    title: string;
    completed: boolean;
    score?: number;
  }[];
  progress: {
    lessonsCompleted: number;
    totalLessons: number;
    timeSpent: string;
    lastAccessed: string;
  };
  skills: {
    name: string;
    currentLevel: number;
    targetLevel: number;
    progress: number;
  }[];
  mentorSupport: boolean;
  certification: {
    available: boolean;
    requirements: string[];
    creditsEarned: number;
    creditsRequired: number;
  };
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}

const categoryConfig = {
  emotional_intelligence: {
    color: 'bg-blue-100 text-blue-800',
    label: 'Emotional Intelligence'
  },
  strategic_thinking: {
    color: 'bg-purple-100 text-purple-800',
    label: 'Strategic Thinking'
  },
  team_management: {
    color: 'bg-green-100 text-green-800',
    label: 'Team Management'
  },
  communication: {
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Communication'
  },
  decision_making: {
    color: 'bg-red-100 text-red-800',
    label: 'Decision Making'
  }
};

const levelConfig = {
  foundation: { color: 'bg-gray-100 text-gray-800', label: 'Foundation' },
  intermediate: { color: 'bg-blue-100 text-blue-800', label: 'Intermediate' },
  advanced: { color: 'bg-orange-100 text-orange-800', label: 'Advanced' },
  executive: { color: 'bg-red-100 text-red-800', label: 'Executive' }
};

const formatConfig = {
  self_paced: 'Self-Paced',
  instructor_led: 'Instructor-Led',
  blended: 'Blended Learning',
  cohort: 'Cohort-Based'
};

export const LeadershipModuleInterface: React.FC<{ module: LeadershipModule }> = ({ module }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'progress' | 'skills' | 'assessments'>('overview');
  
  const categoryInfo = categoryConfig[module.category];
  const levelInfo = levelConfig[module.level];
  const moduleProgress = (module.progress.lessonsCompleted / module.progress.totalLessons) * 100;
  const certificationProgress = (module.certification.creditsEarned / module.certification.creditsRequired) * 100;

  const getStatusButton = () => {
    switch (module.status) {
      case 'locked':
        return (
          <Button disabled className="w-full">
            <Lock className="h-4 w-4 mr-2" />
            Complete Prerequisites
          </Button>
        );
      case 'available':
        return (
          <Button className="w-full">
            <Play className="h-4 w-4 mr-2" />
            Start Module
          </Button>
        );
      case 'in_progress':
        return (
          <Button className="w-full">
            Continue Learning
          </Button>
        );
      case 'completed':
        return (
          <Button variant="outline" className="w-full">
            <CheckCircle className="h-4 w-4 mr-2" />
            Review Module
          </Button>
        );
    }
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />
            <Badge className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          </div>
          <Badge className={levelInfo.color}>
            {levelInfo.label}
          </Badge>
        </div>
        
        <CardTitle className="text-lg">{module.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {module.description}
        </p>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
          <span>{module.duration}</span>
          <span>•</span>
          <span>{formatConfig[module.format]}</span>
          {module.mentorSupport && (
            <>
              <span>•</span>
              <span className="text-[rgb(var(--pg-secondary))]">Mentor Support</span>
            </>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progress Overview */}
        {module.status !== 'locked' && module.status !== 'available' && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Module Progress</span>
              <span>{Math.round(moduleProgress)}%</span>
            </div>
            <Progress value={moduleProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">
              {module.progress.lessonsCompleted} of {module.progress.totalLessons} lessons completed
            </p>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-muted p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'overview' 
                ? 'bg-white shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'progress' 
                ? 'bg-white shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Progress
          </button>
          <button
            onClick={() => setActiveTab('skills')}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'skills' 
                ? 'bg-white shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Skills
          </button>
          <button
            onClick={() => setActiveTab('assessments')}
            className={`flex-1 py-1 px-2 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'assessments' 
                ? 'bg-white shadow-sm text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Assessments
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium mb-2">Learning Objectives</h4>
              <ul className="space-y-1">
                {module.learningObjectives.slice(0, 3).map((objective, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <Target className="h-3 w-3" />
                    {objective}
                  </li>
                ))}
                {module.learningObjectives.length > 3 && (
                  <li className="text-xs italic text-muted-foreground">
                    +{module.learningObjectives.length - 3} more objectives
                  </li>
                )}
              </ul>
            </div>
            
            {module.prerequisites.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Prerequisites</h4>
                <div className="flex flex-wrap gap-1">
                  {module.prerequisites.map((prereq) => (
                    <Badge key={prereq} variant="outline" className="text-xs">
                      {prereq}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-[rgb(var(--pg-secondary))]">
                  {module.progress.timeSpent}
                </div>
                <div className="text-xs text-muted-foreground">Time Spent</div>
              </div>
              <div className="text-center p-2 bg-gray-50 rounded">
                <div className="text-lg font-bold text-[rgb(var(--pg-secondary))]">
                  {module.progress.lessonsCompleted}
                </div>
                <div className="text-xs text-muted-foreground">Lessons Done</div>
              </div>
            </div>
            
            {module.certification.available && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Certification Progress</h4>
                <Progress value={certificationProgress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {module.certification.creditsEarned} of {module.certification.creditsRequired} credits earned
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'skills' && (
          <div className="space-y-3">
            {module.skills.map((skill, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{skill.name}</span>
                  <span>{skill.currentLevel}/{skill.targetLevel}</span>
                </div>
                <Progress value={skill.progress} className="h-2" />
              </div>
            ))}
          </div>
        )}

        {activeTab === 'assessments' && (
          <div className="space-y-2">
            {module.assessments.map((assessment, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  {assessment.completed ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <div className="h-4 w-4 border rounded-full" />
                  )}
                  <span className="text-sm">{assessment.title}</span>
                </div>
                {assessment.score && (
                  <Badge variant="secondary">{assessment.score}%</Badge>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2">
          {getStatusButton()}
        </div>
      </CardContent>
    </Card>
  );
};
