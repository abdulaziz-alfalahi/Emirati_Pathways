
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { BarChart3, Target, CheckCircle } from 'lucide-react';

export const ProgressTracker: React.FC = () => {
  const goals = [
    { goal: 'Improve Leadership Skills', progress: 75, status: 'In Progress' },
    { goal: 'Learn Machine Learning', progress: 90, status: 'Near Completion' },
    { goal: 'Build Professional Network', progress: 40, status: 'In Progress' },
    { goal: 'Career Transition Planning', progress: 100, status: 'Completed' }
  ];

  const milestones = [
    { milestone: 'Completed Leadership Assessment', date: '2024-01-15', achieved: true },
    { milestone: 'ML Certification Obtained', date: '2024-01-20', achieved: true },
    { milestone: 'Networking Event Attendance', date: '2024-01-25', achieved: false },
    { milestone: 'Career Plan Finalization', date: '2024-02-01', achieved: false }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ehrdc-teal" />
            Progress Tracker
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="font-semibold mb-4">Goal Progress</h3>
            <div className="space-y-4">
              {goals.map((goal, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{goal.goal}</span>
                    <Badge variant={goal.status === 'Completed' ? 'default' : 
                                  goal.status === 'Near Completion' ? 'secondary' : 'outline'}>
                      {goal.status}
                    </Badge>
                  </div>
                  <Progress value={goal.progress} className="h-2" />
                  <div className="text-xs text-muted-foreground text-right">
                    {goal.progress}% Complete
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Milestones</h3>
            <div className="space-y-3">
              {milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-3 p-3 border rounded-lg">
                  <CheckCircle className={`h-5 w-5 ${milestone.achieved ? 'text-green-600' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <div className="font-medium">{milestone.milestone}</div>
                    <div className="text-sm text-muted-foreground">{milestone.date}</div>
                  </div>
                  <Badge variant={milestone.achieved ? 'default' : 'outline'}>
                    {milestone.achieved ? 'Achieved' : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
