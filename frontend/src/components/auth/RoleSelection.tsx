import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Building2, 
  GraduationCap, 
  Users, 
  ClipboardCheck,
  ArrowRight,
  CheckCircle2,
  Briefcase,
  Target,
  BookOpen,
  UserCheck,
  Award
} from 'lucide-react';

export interface RoleOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  color: string;
  popular?: boolean;
}

interface RoleSelectionProps {
  selectedRole: string;
  onRoleSelect: (roleId: string) => void;
  onContinue: () => void;
}

const roleOptions: RoleOption[] = [
  {
    id: 'job_seeker',
    title: 'Job Seeker',
    description: 'Find your dream career with AI-powered job matching and career development tools.',
    icon: <User className="h-8 w-8" />,
    features: [
      'AI-powered job matching',
      'CV builder and optimization',
      'Interview preparation',
      'Career pathway guidance',
      'Skills assessment'
    ],
    color: 'bg-blue-500',
    popular: true
  },
  {
    id: 'hr_recruiter',
    title: 'HR / Recruiter',
    description: 'Streamline your hiring process with advanced recruitment tools and candidate management.',
    icon: <Building2 className="h-8 w-8" />,
    features: [
      'Advanced candidate screening',
      'AI video interview analysis',
      'Talent pipeline management',
      'Educational opportunity posting',
      'Performance analytics'
    ],
    color: 'bg-green-500'
  },
  {
    id: 'educator',
    title: 'Educator',
    description: 'Enhance student outcomes with curriculum management and career guidance tools.',
    icon: <GraduationCap className="h-8 w-8" />,
    features: [
      'Curriculum management',
      'Student progress tracking',
      'Industry integration tools',
      'Career guidance system',
      'Educational analytics'
    ],
    color: 'bg-purple-500'
  },
  {
    id: 'mentor',
    title: 'Mentor',
    description: 'Share your expertise and guide the next generation of UAE professionals.',
    icon: <Users className="h-8 w-8" />,
    features: [
      'AI-powered mentee matching',
      'Mentorship program management',
      'Progress tracking tools',
      'Cultural intelligence support',
      'Impact analytics'
    ],
    color: 'bg-orange-500'
  },
  {
    id: 'assessor',
    title: 'Assessor',
    description: 'Evaluate and validate professional competencies with advanced assessment tools.',
    icon: <ClipboardCheck className="h-8 w-8" />,
    features: [
      'Competency validation system',
      'AI assessment intelligence',
      'Collaborative assessments',
      'Performance analytics',
      'Certification management'
    ],
    color: 'bg-red-500'
  }
];

const RoleSelection: React.FC<RoleSelectionProps> = ({
  selectedRole,
  onRoleSelect,
  onContinue
}) => {
  const [hoveredRole, setHoveredRole] = useState<string | null>(null);

  const selectedRoleData = roleOptions.find(role => role.id === selectedRole);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Choose Your Role</h2>
        <p className="text-gray-600">
          Select the role that best describes your professional identity on the platform
        </p>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roleOptions.map((role) => (
          <Card
            key={role.id}
            className={`relative cursor-pointer transition-all duration-300 hover:shadow-lg transform hover:-translate-y-1 ${
              selectedRole === role.id
                ? 'ring-2 ring-blue-500 shadow-lg'
                : 'hover:shadow-md'
            } ${
              hoveredRole === role.id ? 'scale-105' : ''
            }`}
            onClick={() => onRoleSelect(role.id)}
            onMouseEnter={() => setHoveredRole(role.id)}
            onMouseLeave={() => setHoveredRole(null)}
          >
            {/* Popular Badge */}
            {role.popular && (
              <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-white">
                Popular
              </Badge>
            )}

            {/* Selected Indicator */}
            {selectedRole === role.id && (
              <div className="absolute top-3 right-3">
                <CheckCircle2 className="h-6 w-6 text-blue-500" />
              </div>
            )}

            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${role.color} text-white`}>
                  {role.icon}
                </div>
                <div>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                </div>
              </div>
              <CardDescription className="text-sm leading-relaxed">
                {role.description}
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-gray-700">Key Features:</h4>
                <ul className="space-y-1">
                  {role.features.slice(0, 3).map((feature, index) => (
                    <li key={index} className="flex items-center text-xs text-gray-600">
                      <div className="h-1.5 w-1.5 bg-gray-400 rounded-full mr-2" />
                      {feature}
                    </li>
                  ))}
                  {role.features.length > 3 && (
                    <li className="text-xs text-gray-500 italic">
                      +{role.features.length - 3} more features
                    </li>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Role Summary */}
      {selectedRoleData && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${selectedRoleData.color} text-white`}>
                {selectedRoleData.icon}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg text-gray-900">
                  You selected: {selectedRoleData.title}
                </h3>
                <p className="text-gray-600 mt-1">{selectedRoleData.description}</p>
                <div className="mt-3">
                  <h4 className="font-medium text-sm text-gray-700 mb-2">
                    What you'll have access to:
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedRoleData.features.map((feature, index) => (
                      <div key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle2 className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          onClick={onContinue}
          disabled={!selectedRole}
          className="px-8 py-3 text-lg"
          size="lg"
        >
          Continue with {selectedRoleData?.title || 'Selected Role'}
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>

      {/* Help Text */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Don't worry, you can add additional roles or change your primary role later from your profile settings.
        </p>
      </div>
    </div>
  );
};

export default RoleSelection;
