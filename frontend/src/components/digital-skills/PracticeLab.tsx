
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Terminal, Database, Globe } from 'lucide-react';

const practiceEnvironments = [
  {
    title: 'Python Coding Lab',
    description: 'Interactive Python environment with real-time feedback',
    icon: Code,
    type: 'Programming',
    exercises: 45,
    difficulty: 'Beginner to Advanced'
  },
  {
    title: 'SQL Database Playground',
    description: 'Practice SQL queries on real datasets',
    icon: Database,
    type: 'Database',
    exercises: 30,
    difficulty: 'Intermediate'
  },
  {
    title: 'Web Development Sandbox',
    description: 'Build and test web applications in a live environment',
    icon: Globe,
    type: 'Web Development',
    exercises: 25,
    difficulty: 'Beginner to Advanced'
  },
  {
    title: 'Command Line Terminal',
    description: 'Learn Linux/Unix commands in a safe environment',
    icon: Terminal,
    type: 'System Administration',
    exercises: 20,
    difficulty: 'Beginner'
  }
];

export const PracticeLab: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        {practiceEnvironments.map((env, index) => {
          const IconComponent = env.icon;
          return (
            <Card key={index} className="p-6">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <IconComponent className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">{env.title}</h3>
                  <p className="text-muted-foreground mb-3">{env.description}</p>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    <Badge variant="outline">{env.type}</Badge>
                    <span>{env.exercises} exercises</span>
                    <span>{env.difficulty}</span>
                  </div>
                  <Button className="w-full">
                    Launch Lab Environment
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
