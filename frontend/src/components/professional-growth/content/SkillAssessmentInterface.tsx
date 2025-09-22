
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, BookOpen, ArrowRight, Star } from 'lucide-react';

export interface AssessmentQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

export interface ProgressMetrics {
  currentScore: number;
  targetScore: number;
  improvement: number;
  timeSpent: string;
}

export interface Resource {
  id: string;
  title: string;
  type: 'course' | 'article' | 'video' | 'practice';
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  url: string;
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: string;
}

export interface SkillAssessmentComponent {
  skillName: string;
  currentLevel: number;
  targetLevel: number;
  assessmentQuestions?: AssessmentQuestion[];
  progressTracking: ProgressMetrics;
  recommendedResources: Resource[];
  nextSteps: ActionItem[];
}

const levelNames = {
  1: 'Beginner',
  2: 'Basic',
  3: 'Intermediate',
  4: 'Advanced',
  5: 'Expert'
};

const priorityColors = {
  high: 'bg-red-100 text-red-800',
  medium: 'bg-yellow-100 text-yellow-800',
  low: 'bg-green-100 text-green-800'
};

export const SkillAssessmentInterface: React.FC<SkillAssessmentComponent> = ({
  skillName,
  currentLevel,
  targetLevel,
  progressTracking,
  recommendedResources,
  nextSteps
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'resources' | 'nextSteps'>('overview');

  const progressPercentage = (currentLevel / targetLevel) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />
                {skillName} Assessment
              </CardTitle>
              <p className="text-muted-foreground mt-1">
                Track your progress and develop this skill
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-[rgb(var(--pg-secondary))]">
                {currentLevel}/5
              </div>
              <p className="text-sm text-muted-foreground">
                {levelNames[currentLevel as keyof typeof levelNames]}
              </p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between text-sm">
              <span>Current Level: {levelNames[currentLevel as keyof typeof levelNames]}</span>
              <span>Target: {levelNames[targetLevel as keyof typeof levelNames]}</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="text-center">
                <div className="text-lg font-semibold">{progressTracking.currentScore}%</div>
                <div className="text-xs text-muted-foreground">Current Score</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-green-600">+{progressTracking.improvement}%</div>
                <div className="text-xs text-muted-foreground">Improvement</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold">{progressTracking.timeSpent}</div>
                <div className="text-xs text-muted-foreground">Time Spent</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview' 
              ? 'bg-white shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'resources' 
              ? 'bg-white shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Resources
        </button>
        <button
          onClick={() => setActiveTab('nextSteps')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'nextSteps' 
              ? 'bg-white shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Next Steps
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Progress Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="text-6xl font-bold text-[rgb(var(--pg-secondary))] mb-2">
                {progressTracking.currentScore}%
              </div>
              <p className="text-muted-foreground mb-4">Current Skill Level</p>
              <Button>Take Assessment</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'resources' && (
        <div className="grid gap-4">
          {recommendedResources.map((resource) => (
            <Card key={resource.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />
                    <div>
                      <h4 className="font-medium">{resource.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        {resource.type} • {resource.duration}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{resource.difficulty}</Badge>
                    <Button size="sm" variant="outline">
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'nextSteps' && (
        <div className="space-y-4">
          {nextSteps.map((step, index) => (
            <Card key={step.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-[rgb(var(--pg-secondary))] text-white rounded-full flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{step.title}</h4>
                      <Badge className={priorityColors[step.priority]}>{step.priority}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                    <p className="text-xs text-muted-foreground">
                      Estimated time: {step.estimatedTime}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
