
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, TrendingUp, Plus, Award, BookOpen, Clock } from 'lucide-react';

export const SkillsTracker: React.FC = () => {
  const [showAddGoal, setShowAddGoal] = useState(false);

  const skillCategories = [
    'Leadership', 'Technology', 'Communication', 'Creativity', 'Problem Solving', 'Teamwork'
  ];

  const currentGoals = [
    {
      id: '1',
      title: 'Master Public Speaking',
      category: 'Communication',
      progress: 75,
      target: '100',
      current: '75',
      unit: 'points',
      deadline: '2024-06-01',
      description: 'Develop confidence and skills in public presentations',
      milestones: [
        { title: 'Complete basic course', completed: true },
        { title: 'Give 5 practice speeches', completed: true },
        { title: 'Present to large audience', completed: false },
        { title: 'Receive advanced certification', completed: false }
      ]
    },
    {
      id: '2',
      title: 'Learn Python Programming',
      category: 'Technology',
      progress: 45,
      target: '10',
      current: '4.5',
      unit: 'projects',
      deadline: '2024-08-15',
      description: 'Build proficiency in Python for data science and automation',
      milestones: [
        { title: 'Complete Python basics', completed: true },
        { title: 'Build first web app', completed: true },
        { title: 'Create data analysis project', completed: false },
        { title: 'Contribute to open source', completed: false }
      ]
    },
    {
      id: '3',
      title: 'Develop Team Leadership',
      category: 'Leadership',
      progress: 60,
      target: '8',
      current: '5',
      unit: 'team projects',
      deadline: '2024-05-30',
      description: 'Lead diverse teams effectively in various project scenarios',
      milestones: [
        { title: 'Lead first team project', completed: true },
        { title: 'Manage conflict resolution', completed: true },
        { title: 'Mentor junior members', completed: false },
        { title: 'Complete leadership assessment', completed: false }
      ]
    }
  ];

  const achievements = [
    { id: '1', title: 'Goal Setter', description: 'Created your first skill development goal', icon: '🎯' },
    { id: '2', title: 'Consistent Learner', description: 'Maintained learning streak for 30 days', icon: '🔥' },
    { id: '3', title: 'Milestone Master', description: 'Completed 10 skill milestones', icon: '⭐' },
    { id: '4', title: 'Well Rounded', description: 'Active goals in 3+ skill categories', icon: '🌟' }
  ];

  const skillsOverview = skillCategories.map(category => {
    const categoryGoals = currentGoals.filter(goal => goal.category === category);
    const avgProgress = categoryGoals.length > 0 
      ? categoryGoals.reduce((sum, goal) => sum + goal.progress, 0) / categoryGoals.length 
      : 0;
    return {
      category,
      progress: Math.round(avgProgress),
      goals: categoryGoals.length
    };
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-ehrdc-teal/10 to-ehrdc-light-teal/5">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-ehrdc-teal mb-2">Skills Development Tracker</h2>
              <p className="text-muted-foreground">Set goals, track progress, and celebrate achievements</p>
            </div>
            <Button 
              onClick={() => setShowAddGoal(true)}
              className="ehrdc-button-primary"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skills Overview */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {skillsOverview.map((skill) => (
          <Card key={skill.category}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium">{skill.category}</h3>
                <Badge variant="outline">{skill.goals} goals</Badge>
              </div>
              <Progress value={skill.progress} className="h-2 mb-2" />
              <div className="text-sm text-muted-foreground">{skill.progress}% average progress</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Current Goals */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-ehrdc-teal" />
                Active Goals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentGoals.map((goal) => (
                <div key={goal.id} className="p-4 rounded-lg border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{goal.title}</h3>
                      <p className="text-sm text-muted-foreground mt-1">{goal.description}</p>
                    </div>
                    <Badge variant="outline">{goal.category}</Badge>
                  </div>
                  
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Progress</span>
                      <span className="text-sm text-muted-foreground">
                        {goal.current}/{goal.target} {goal.unit}
                      </span>
                    </div>
                    <Progress value={goal.progress} className="h-2" />
                  </div>

                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Milestones</div>
                    <div className="space-y-2">
                      {goal.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <div className={`w-4 h-4 rounded-full flex items-center justify-center text-xs ${
                            milestone.completed 
                              ? 'bg-ehrdc-teal text-white' 
                              : 'bg-gray-200 text-gray-500'
                          }`}>
                            {milestone.completed ? '✓' : index + 1}
                          </div>
                          <span className={milestone.completed ? 'line-through text-muted-foreground' : ''}>
                            {milestone.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      Due: {new Date(goal.deadline).toLocaleDateString()}
                    </div>
                    <Button size="sm" variant="outline">
                      Update Progress
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
                Your Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-ehrdc-teal">60%</div>
                <div className="text-sm text-muted-foreground">Average Progress</div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Goals Completed</span>
                  <span className="font-medium">2</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active Goals</span>
                  <span className="font-medium">3</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Milestones</span>
                  <span className="font-medium">12</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-ehrdc-teal" />
                Achievements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-3 p-2 rounded-lg bg-ehrdc-teal/5">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div>
                    <div className="font-medium text-sm">{achievement.title}</div>
                    <div className="text-xs text-muted-foreground">{achievement.description}</div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full ehrdc-button-primary">
                <BookOpen className="h-4 w-4 mr-2" />
                Find Learning Resources
              </Button>
              <Button variant="outline" className="w-full">
                Join Study Group
              </Button>
              <Button variant="outline" className="w-full">
                Book Skill Assessment
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
