
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { BookOpen } from 'lucide-react';

export const SkillsAnalysis: React.FC = () => {
  const skillsData = [
    {
      career: 'Software Engineer',
      technical: ['JavaScript', 'React', 'Node.js', 'Python'],
      soft: ['Problem Solving', 'Teamwork', 'Communication'],
      demandLevel: 95
    },
    {
      career: 'Data Scientist',
      technical: ['Python', 'SQL', 'Machine Learning', 'Statistics'],
      soft: ['Analytical Thinking', 'Presentation', 'Business Acumen'],
      demandLevel: 90
    },
    {
      career: 'Product Manager',
      technical: ['Analytics', 'SQL', 'Wireframing', 'A/B Testing'],
      soft: ['Leadership', 'Strategic Thinking', 'Stakeholder Management'],
      demandLevel: 85
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-ehrdc-teal" />
            Skills Analysis & Market Demand
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {skillsData.map((career, index) => (
              <Card key={index} className="border border-ehrdc-neutral-light">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">{career.career}</h3>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Market Demand</div>
                      <div className="flex items-center gap-2">
                        <Progress value={career.demandLevel} className="w-20 h-2" />
                        <span className="text-sm font-medium">{career.demandLevel}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-muted-foreground">Technical Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {career.technical.map((skill) => (
                          <Badge key={skill} variant="default" className="bg-blue-100 text-blue-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2 text-sm text-muted-foreground">Soft Skills</h4>
                      <div className="flex flex-wrap gap-2">
                        {career.soft.map((skill) => (
                          <Badge key={skill} variant="outline" className="border-green-200 text-green-800">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
