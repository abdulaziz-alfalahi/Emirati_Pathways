
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Award, ArrowRight, Clock, DollarSign, TrendingUp } from 'lucide-react';

export const CertificationRoadmaps: React.FC = () => {
  const [selectedField, setSelectedField] = useState('cloud-computing');

  const roadmaps = {
    'cloud-computing': {
      title: 'Cloud Computing Career Path',
      description: 'Progress from cloud fundamentals to architect-level expertise',
      estimatedDuration: '18-24 months',
      totalInvestment: 'AED 12,000 - 18,000',
      stages: [
        {
          level: 'Foundation',
          certifications: [
            {
              name: 'AWS Cloud Practitioner',
              provider: 'Amazon Web Services',
              studyTime: '4-6 weeks',
              cost: 'AED 750',
              salaryImpact: '+15%',
              prerequisites: 'None',
              description: 'Foundational understanding of AWS cloud services'
            }
          ]
        },
        {
          level: 'Associate',
          certifications: [
            {
              name: 'AWS Solutions Architect - Associate',
              provider: 'Amazon Web Services',
              studyTime: '8-12 weeks',
              cost: 'AED 1,500',
              salaryImpact: '+35%',
              prerequisites: 'Cloud Practitioner (recommended)',
              description: 'Design and deploy scalable systems on AWS'
            },
            {
              name: 'Azure Administrator Associate',
              provider: 'Microsoft',
              studyTime: '8-10 weeks',
              cost: 'AED 1,200',
              salaryImpact: '+30%',
              prerequisites: 'Basic Azure knowledge',
              description: 'Implement, manage, and monitor Azure environments'
            }
          ]
        },
        {
          level: 'Professional',
          certifications: [
            {
              name: 'AWS Solutions Architect - Professional',
              provider: 'Amazon Web Services',
              studyTime: '16-20 weeks',
              cost: 'AED 2,500',
              salaryImpact: '+55%',
              prerequisites: 'Associate level certification',
              description: 'Advanced architectural design on AWS'
            }
          ]
        }
      ]
    },
    'data-science': {
      title: 'Data Science & Analytics Path',
      description: 'Build expertise in data analysis, machine learning, and business intelligence',
      estimatedDuration: '15-20 months',
      totalInvestment: 'AED 8,000 - 15,000',
      stages: [
        {
          level: 'Foundation',
          certifications: [
            {
              name: 'Google Data Analytics Certificate',
              provider: 'Google',
              studyTime: '6-8 weeks',
              cost: 'AED 500',
              salaryImpact: '+20%',
              prerequisites: 'None',
              description: 'Foundational data analysis skills'
            }
          ]
        },
        {
          level: 'Intermediate',
          certifications: [
            {
              name: 'Microsoft Certified: Azure Data Scientist Associate',
              provider: 'Microsoft',
              studyTime: '12-16 weeks',
              cost: 'AED 1,800',
              salaryImpact: '+40%',
              prerequisites: 'Basic programming knowledge',
              description: 'Machine learning and data science on Azure'
            }
          ]
        }
      ]
    }
  };

  const currentRoadmap = roadmaps[selectedField as keyof typeof roadmaps];

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Certification Roadmaps</h2>
          <p className="text-muted-foreground">Structured career paths showing certification progression</p>
        </CardContent>
      </Card>

      {/* Field Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium mb-2 block">Choose Your Career Field</label>
              <Select value={selectedField} onValueChange={setSelectedField}>
                <SelectTrigger className="max-w-md">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cloud-computing">Cloud Computing & DevOps</SelectItem>
                  <SelectItem value="data-science">Data Science & Analytics</SelectItem>
                  <SelectItem value="cybersecurity">Cybersecurity</SelectItem>
                  <SelectItem value="project-management">Project Management</SelectItem>
                  <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline">
              Compare Paths
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">{currentRoadmap.title}</h3>
              <p className="text-muted-foreground">{currentRoadmap.description}</p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-600" />
                <span className="text-sm">Duration: {currentRoadmap.estimatedDuration}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-slate-600" />
                <span className="text-sm">Investment: {currentRoadmap.totalInvestment}</span>
              </div>
            </div>
            <div className="text-right">
              <Button className="bg-slate-800 hover:bg-slate-700">
                Start This Path
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Roadmap Stages */}
      <div className="space-y-6">
        {currentRoadmap.stages.map((stage, stageIndex) => (
          <Card key={stageIndex}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-800 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-semibold">
                    {stageIndex + 1}
                  </div>
                  <CardTitle className="text-lg">{stage.level} Level</CardTitle>
                </div>
                <Badge variant="outline">
                  {stage.certifications.length} certification{stage.certifications.length > 1 ? 's' : ''}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stage.certifications.map((cert, certIndex) => (
                  <div key={certIndex} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg mb-1">{cert.name}</h4>
                            <p className="text-sm text-muted-foreground mb-2">{cert.provider}</p>
                            <p className="text-sm">{cert.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                              <TrendingUp className="h-4 w-4" />
                              {cert.salaryImpact}
                            </div>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="font-medium">Study Time:</span>
                            <div className="text-muted-foreground">{cert.studyTime}</div>
                          </div>
                          <div>
                            <span className="font-medium">Cost:</span>
                            <div className="text-muted-foreground">{cert.cost}</div>
                          </div>
                          <div>
                            <span className="font-medium">Prerequisites:</span>
                            <div className="text-muted-foreground">{cert.prerequisites}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Learn More
                        </Button>
                        <Button size="sm" className="bg-slate-800 hover:bg-slate-700">
                          Add to Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {stageIndex < currentRoadmap.stages.length - 1 && (
                <div className="flex justify-center mt-6">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <div className="h-px bg-border flex-1 w-16"></div>
                    <ArrowRight className="h-5 w-5" />
                    <div className="h-px bg-border flex-1 w-16"></div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Progress Tracking */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Your Progress on This Path</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Overall Completion</span>
                <span>2 of 5 certifications (40%)</span>
              </div>
              <Progress value={40} className="h-2" />
            </div>
            <div className="grid md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Estimated Time Remaining:</span>
                <div className="text-muted-foreground">12-16 months</div>
              </div>
              <div>
                <span className="font-medium">Investment Remaining:</span>
                <div className="text-muted-foreground">AED 8,500 - 12,000</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
