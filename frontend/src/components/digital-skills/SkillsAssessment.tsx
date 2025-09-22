
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

const skillsData = [
  { name: 'Data Analysis', level: 'Intermediate', progress: 75, status: 'in_progress' },
  { name: 'Digital Marketing', level: 'Beginner', progress: 30, status: 'in_progress' },
  { name: 'Cloud Computing', level: 'Advanced', progress: 90, status: 'completed' },
  { name: 'Cybersecurity', level: 'Beginner', progress: 15, status: 'not_started' },
];

export const SkillsAssessment: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        {skillsData.map((skill, index) => (
          <Card key={index} className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">{skill.name}</h3>
              <Badge variant={skill.level === 'Advanced' ? 'default' : 'secondary'}>
                {skill.level}
              </Badge>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Progress</span>
                <span>{skill.progress}%</span>
              </div>
              <Progress value={skill.progress} className="h-2" />
              <div className="flex items-center gap-2 text-sm">
                {skill.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                {skill.status === 'in_progress' && <Clock className="h-4 w-4 text-blue-500" />}
                {skill.status === 'not_started' && <AlertCircle className="h-4 w-4 text-gray-400" />}
                <span className="capitalize">{skill.status.replace('_', ' ')}</span>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="text-center">
        <Button>Take Full Skills Assessment</Button>
      </div>
    </div>
  );
};
