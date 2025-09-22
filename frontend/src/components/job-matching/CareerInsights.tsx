
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Lightbulb, BarChart3, Award, BookOpen } from 'lucide-react';

export const CareerInsights: React.FC = () => {
  const insights = [
    {
      type: 'Market Trend',
      title: 'AI & Machine Learning Skills in High Demand',
      description: 'Job postings requiring AI/ML skills have increased by 45% in the UAE market.',
      impact: 'High',
      relevance: 85
    },
    {
      type: 'Skill Gap',
      title: 'Cloud Computing Certification Recommended',
      description: 'Your profile shows strong technical skills. Adding AWS/Azure certification could increase match rates by 30%.',
      impact: 'Medium',
      relevance: 78
    },
    {
      type: 'Career Growth',
      title: 'Leadership Skills Development',
      description: 'Based on your experience level, developing leadership skills could open senior-level opportunities.',
      impact: 'High',
      relevance: 72
    }
  ];

  const careerMetrics = [
    { label: 'Profile Strength', value: 85, max: 100 },
    { label: 'Market Readiness', value: 78, max: 100 },
    { label: 'Skill Relevance', value: 92, max: 100 },
    { label: 'Network Score', value: 65, max: 100 }
  ];

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'High': return 'bg-red-100 text-red-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Career Metrics Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-ehrdc-teal" />
            Career Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {careerMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{metric.label}</span>
                  <span className="text-sm text-muted-foreground">{metric.value}%</span>
                </div>
                <Progress value={metric.value} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personalized Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-ehrdc-teal" />
            Personalized Career Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.map((insight, index) => (
              <Card key={index}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <Badge variant="outline" className="mb-2">
                        {insight.type}
                      </Badge>
                      <h3 className="font-semibold">{insight.title}</h3>
                    </div>
                    <Badge className={getImpactColor(insight.impact)}>
                      {insight.impact} Impact
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3">{insight.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-ehrdc-teal" />
                      <span className="text-sm font-medium">Relevance: {insight.relevance}%</span>
                    </div>
                    <Button size="sm" variant="outline">
                      Learn More
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
            Recommended Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="h-8 w-8 text-ehrdc-teal" />
                  <div>
                    <h3 className="font-semibold">Complete Certifications</h3>
                    <p className="text-sm text-muted-foreground">Boost your profile strength</p>
                  </div>
                </div>
                <Button className="w-full" size="sm">
                  View Courses
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <BookOpen className="h-8 w-8 text-ehrdc-teal" />
                  <div>
                    <h3 className="font-semibold">Skill Assessment</h3>
                    <p className="text-sm text-muted-foreground">Validate your expertise</p>
                  </div>
                </div>
                <Button className="w-full" size="sm" variant="outline">
                  Take Assessment
                </Button>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
