
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  ArrowRight, Shield, Users, Cog, Heart, Building, 
  CheckCircle, Clock, Target, TrendingUp, Briefcase 
} from 'lucide-react';

export const ServiceToCareerPathway: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState('infantry');
  const [currentStep, setCurrentStep] = useState(0);

  const militaryRoles = [
    {
      id: 'infantry',
      name: 'Infantry/Ground Forces',
      civilianEquivalents: ['Security Management', 'Operations Management', 'Team Leadership', 'Emergency Response'],
      transferableSkills: ['Leadership', 'Discipline', 'Crisis Management', 'Teamwork', 'Physical Fitness'],
      averageSalary: 'AED 8,000 - 15,000'
    },
    {
      id: 'logistics',
      name: 'Military Logistics',
      civilianEquivalents: ['Supply Chain Management', 'Procurement', 'Warehouse Management', 'Project Management'],
      transferableSkills: ['Organization', 'Planning', 'Resource Management', 'Problem Solving', 'Attention to Detail'],
      averageSalary: 'AED 10,000 - 18,000'
    },
    {
      id: 'communications',
      name: 'Communications/IT',
      civilianEquivalents: ['IT Support', 'Network Administration', 'Cybersecurity', 'Technical Support'],
      transferableSkills: ['Technical Knowledge', 'Troubleshooting', 'Communication', 'Adaptability', 'Learning Agility'],
      averageSalary: 'AED 12,000 - 22,000'
    },
    {
      id: 'medical',
      name: 'Military Medical',
      civilianEquivalents: ['Healthcare Support', 'Emergency Medical Services', 'Medical Administration', 'Public Health'],
      transferableSkills: ['Medical Knowledge', 'Empathy', 'Stress Management', 'Precision', 'Ethical Decision Making'],
      averageSalary: 'AED 15,000 - 25,000'
    }
  ];

  const transitionSteps = [
    {
      title: 'Service Assessment',
      description: 'Evaluate your military experience and identify transferable skills',
      duration: '1-2 weeks',
      icon: Shield,
      status: 'completed'
    },
    {
      title: 'Skills Translation',
      description: 'Map military skills to civilian job requirements',
      duration: '1 week',
      icon: Cog,
      status: 'current'
    },
    {
      title: 'Education & Training',
      description: 'Complete any additional certifications or training needed',
      duration: '3-6 months',
      icon: Users,
      status: 'upcoming'
    },
    {
      title: 'Job Search',
      description: 'Apply to positions with veteran-friendly employers',
      duration: '2-4 months',
      icon: Target,
      status: 'upcoming'
    },
    {
      title: 'Career Success',
      description: 'Establish yourself in your new civilian career',
      duration: 'Ongoing',
      icon: TrendingUp,
      status: 'upcoming'
    }
  ];

  const selectedRoleData = militaryRoles.find(role => role.id === selectedRole) || militaryRoles[0];

  const getStepStatus = (index: number) => {
    if (index < currentStep) return 'completed';
    if (index === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Select Your Military Role</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-full md:w-80">
              <SelectValue placeholder="Choose your military role" />
            </SelectTrigger>
            <SelectContent>
              {militaryRoles.map((role) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Skills Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Skills Translation: {selectedRoleData.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Shield className="h-5 w-5 text-red-600" />
                Transferable Skills
              </h3>
              <div className="space-y-2">
                {selectedRoleData.transferableSkills.map((skill, index) => (
                  <Badge key={index} variant="outline" className="mr-2 mb-2">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-ehrdc-teal" />
                Civilian Career Options
              </h3>
              <div className="space-y-2">
                {selectedRoleData.civilianEquivalents.map((career, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-sm">{career}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-ehrdc-teal/10 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
              <span className="font-semibold">Expected Salary Range</span>
            </div>
            <p className="text-lg font-bold text-ehrdc-teal">{selectedRoleData.averageSalary}</p>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Your Transition Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {transitionSteps.map((step, index) => {
              const IconComponent = step.icon;
              const status = getStepStatus(index);
              
              return (
                <div key={index} className={`flex items-start gap-4 p-4 rounded-lg transition-all ${
                  status === 'current' ? 'bg-ehrdc-teal/10 border-l-4 border-ehrdc-teal' :
                  status === 'completed' ? 'bg-green-50 border-l-4 border-green-500' :
                  'bg-gray-50 border-l-4 border-gray-300'
                }`}>
                  <div className={`rounded-full p-2 ${
                    status === 'current' ? 'bg-ehrdc-teal text-white' :
                    status === 'completed' ? 'bg-green-500 text-white' :
                    'bg-gray-300 text-gray-600'
                  }`}>
                    <IconComponent className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className={`font-semibold ${
                        status === 'current' ? 'text-ehrdc-teal' :
                        status === 'completed' ? 'text-green-700' :
                        'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Clock className="h-4 w-4" />
                        {step.duration}
                      </div>
                    </div>
                    <p className="text-gray-600 mb-3">{step.description}</p>
                    
                    {status === 'current' && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Progress</span>
                          <span>65%</span>
                        </div>
                        <Progress value={65} className="h-2" />
                      </div>
                    )}
                    
                    {status === 'completed' && (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">Completed</span>
                      </div>
                    )}
                  </div>
                  
                  {index < transitionSteps.length - 1 && (
                    <ArrowRight className="h-5 w-5 text-gray-400 mt-8" />
                  )}
                </div>
              );
            })}
          </div>
          
          <div className="mt-6 flex gap-3">
            <Button 
              onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              variant="outline"
            >
              Previous Step
            </Button>
            <Button 
              onClick={() => setCurrentStep(Math.min(transitionSteps.length - 1, currentStep + 1))}
              disabled={currentStep === transitionSteps.length - 1}
              className="bg-ehrdc-teal hover:bg-ehrdc-teal/90"
            >
              Next Step
            </Button>
            <Button variant="outline">
              Download Transition Plan
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
