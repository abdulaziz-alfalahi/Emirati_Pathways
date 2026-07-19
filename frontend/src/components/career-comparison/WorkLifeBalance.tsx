
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, Clock, Home, Briefcase, Plane, Users } from 'lucide-react';

export const WorkLifeBalance: React.FC = () => {
  const workLifeData = [
    {
      career: 'Software Engineer',
      overallScore: 75,
      flexibility: 85,
      remoteWork: 90,
      vacationTime: 70,
      stressLevel: 60, // Lower is better
      overtimeFreq: 40, // Lower is better
      benefits: ['Flexible hours', 'Remote work', 'Health insurance', 'Professional development'],
      workHours: '40-45 hours/week',
      ptoAverage: '20-25 days',
      companySize: 'Varies'
    },
    {
      career: 'Data Scientist',
      overallScore: 70,
      flexibility: 75,
      remoteWork: 80,
      vacationTime: 65,
      stressLevel: 65,
      overtimeFreq: 50,
      benefits: ['Research time', 'Conference attendance', 'Flexible schedule', 'Learning budget'],
      workHours: '42-48 hours/week',
      ptoAverage: '18-23 days',
      companySize: 'Large corps preferred'
    },
    {
      career: 'Product Manager',
      overallScore: 65,
      flexibility: 60,
      remoteWork: 70,
      vacationTime: 75,
      stressLevel: 75,
      overtimeFreq: 65,
      benefits: ['Strategic influence', 'Cross-team exposure', 'Leadership development', 'Stock options'],
      workHours: '45-55 hours/week',
      ptoAverage: '22-28 days',
      companySize: 'Tech companies'
    },
    {
      career: 'UX Designer',
      overallScore: 80,
      flexibility: 80,
      remoteWork: 85,
      vacationTime: 75,
      stressLevel: 45,
      overtimeFreq: 35,
      benefits: ['Creative freedom', 'Portfolio development', 'Design tools', 'Flexible hours'],
      workHours: '38-42 hours/week',
      ptoAverage: '20-25 days',
      companySize: 'Design-focused companies'
    }
  ];

  const factorCategories = [
    {
      title: 'Work Flexibility',
      icon: <Clock className="h-5 w-5" />,
      description: 'Ability to adjust work hours and schedule'
    },
    {
      title: 'Remote Work Options',
      icon: <Home className="h-5 w-5" />,
      description: 'Availability of work-from-home opportunities'
    },
    {
      title: 'Vacation & PTO',
      icon: <Plane className="h-5 w-5" />,
      description: 'Annual leave and paid time off policies'
    },
    {
      title: 'Stress Levels',
      icon: <Briefcase className="h-5 w-5" />,
      description: 'Typical job-related stress and pressure'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Work-Life Balance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-ehrdc-teal" />
            Work-Life Balance Comparison
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {factorCategories.map((category, index) => (
              <Card key={index} className="border border-ehrdc-neutral-light">
                <CardContent className="p-4 text-center">
                  <div className="flex justify-center mb-2 text-ehrdc-teal">
                    {category.icon}
                  </div>
                  <h4 className="font-medium mb-2">{category.title}</h4>
                  <p className="text-xs text-muted-foreground">{category.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="space-y-6">
            {workLifeData.map((career, index) => (
              <Card key={index} className="border border-ehrdc-neutral-light">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-semibold text-lg">{career.career}</h3>
                    <div className="text-end">
                      <div className="text-2xl font-bold text-ehrdc-teal">{career.overallScore}%</div>
                      <div className="text-sm text-muted-foreground">Overall Score</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                    {/* Work Details */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Work Details
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Hours/Week:</span>
                          <span className="ms-2 font-medium">{career.workHours}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">PTO Average:</span>
                          <span className="ms-2 font-medium">{career.ptoAverage}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Company Type:</span>
                          <span className="ms-2 font-medium">{career.companySize}</span>
                        </div>
                      </div>
                    </div>

                    {/* Flexibility Metrics */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        Flexibility
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Work Flexibility</span>
                            <span>{career.flexibility}%</span>
                          </div>
                          <Progress value={career.flexibility} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Remote Work</span>
                            <span>{career.remoteWork}%</span>
                          </div>
                          <Progress value={career.remoteWork} className="h-2" />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Vacation Time</span>
                            <span>{career.vacationTime}%</span>
                          </div>
                          <Progress value={career.vacationTime} className="h-2" />
                        </div>
                      </div>
                    </div>

                    {/* Stress Indicators */}
                    <div className="space-y-3">
                      <h4 className="font-medium flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Stress Factors
                      </h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Stress Level</span>
                            <span className={career.stressLevel > 70 ? 'text-red-600' : career.stressLevel > 50 ? 'text-yellow-600' : 'text-green-600'}>
                              {career.stressLevel > 70 ? 'High' : career.stressLevel > 50 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                          <Progress 
                            value={career.stressLevel} 
                            className={`h-2 ${career.stressLevel > 70 ? 'bg-red-100' : career.stressLevel > 50 ? 'bg-yellow-100' : 'bg-green-100'}`}
                          />
                        </div>
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Overtime Frequency</span>
                            <span className={career.overtimeFreq > 60 ? 'text-red-600' : career.overtimeFreq > 40 ? 'text-yellow-600' : 'text-green-600'}>
                              {career.overtimeFreq > 60 ? 'High' : career.overtimeFreq > 40 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                          <Progress 
                            value={career.overtimeFreq} 
                            className={`h-2 ${career.overtimeFreq > 60 ? 'bg-red-100' : career.overtimeFreq > 40 ? 'bg-yellow-100' : 'bg-green-100'}`}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Benefits */}
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Key Benefits
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {career.benefits.map((benefit) => (
                        <Badge key={benefit} variant="secondary" className="text-xs">
                          {benefit}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Work-Life Balance Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-ehrdc-teal" />
            Work-Life Balance Tips by Career
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border border-ehrdc-neutral-light">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-green-700">Maintaining Balance</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Set clear boundaries between work and personal time</li>
                  <li>• Negotiate flexible working arrangements when possible</li>
                  <li>• Take advantage of remote work opportunities</li>
                  <li>• Use all allocated vacation days</li>
                  <li>• Practice stress management techniques</li>
                </ul>
              </CardContent>
            </Card>
            
            <Card className="border border-ehrdc-neutral-light">
              <CardContent className="p-4">
                <h4 className="font-medium mb-3 text-blue-700">Questions to Ask Employers</h4>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• What are the typical working hours?</li>
                  <li>• How often is overtime required?</li>
                  <li>• What remote work policies exist?</li>
                  <li>• How is work-life balance supported?</li>
                  <li>• What employee wellness programs are available?</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
