
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Download, Eye, Calendar, Award } from 'lucide-react';

export const CompletedTrainingTab: React.FC = () => {
  const completedPrograms = [
    {
      id: '1',
      title: 'Advanced Excel for Business',
      provider: 'Business Skills Academy',
      completedDate: '2024-05-15',
      grade: 'A',
      certificateAvailable: true,
      duration: '25 hours',
      skills: ['Data Analysis', 'Pivot Tables', 'Advanced Formulas']
    },
    {
      id: '2',
      title: 'Customer Service Excellence',
      provider: 'Service Quality Institute',
      completedDate: '2024-04-20',
      grade: 'B+',
      certificateAvailable: true,
      duration: '30 hours',
      skills: ['Communication', 'Problem Solving', 'Customer Relations']
    },
    {
      id: '3',
      title: 'Basic Web Development',
      provider: 'Tech Learning Hub',
      completedDate: '2024-03-10',
      grade: 'A-',
      certificateAvailable: false,
      duration: '45 hours',
      skills: ['HTML', 'CSS', 'JavaScript Basics']
    }
  ];

  const getGradeColor = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-green-100 text-green-800';
    if (grade.startsWith('B')) return 'bg-blue-100 text-blue-800';
    if (grade.startsWith('C')) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  if (completedPrograms.length === 0) {
    return (
      <div className="text-center py-12">
        <CheckCircle className="h-16 w-16 text-[rgb(var(--pg-accent))] mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Completed Programs Yet</h3>
        <p className="text-muted-foreground mb-6">
          Complete your first training program to see it here
        </p>
        <Button className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90] text-white">
          View Available Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {completedPrograms.map((program) => (
          <Card key={program.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg leading-tight">{program.title}</CardTitle>
                <CheckCircle className="h-5 w-5 text-[rgb(var(--pg-accent))] flex-shrink-0 mt-1" />
              </div>
              <p className="text-sm text-muted-foreground">{program.provider}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Completed {new Date(program.completedDate).toLocaleDateString()}</span>
                </div>
                <Badge className={getGradeColor(program.grade)}>
                  Grade: {program.grade}
                </Badge>
              </div>
              
              <div className="text-sm">
                <span className="text-muted-foreground">Duration:</span>
                <span className="ml-2 font-medium">{program.duration}</span>
              </div>
              
              <div>
                <p className="text-sm text-muted-foreground mb-2">Skills Gained:</p>
                <div className="flex flex-wrap gap-1">
                  {program.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Details
                </Button>
                {program.certificateAvailable && (
                  <Button 
                    size="sm"
                    className="flex-1 bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90] text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Certificate
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
