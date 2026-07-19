
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Calendar, 
  Clock, 
  ExternalLink, 
  GraduationCap, 
  MapPin, 
  DollarSign, 
  Users, 
  BookOpen,
  Award,
  Microscope,
  Globe
} from 'lucide-react';

interface GraduateProgram {
  id: string;
  university_name: string;
  program_name: string;
  degree_level: string;
  field_of_study: string;
  description: string | null;
  duration_years: number | null;
  application_deadline: string | null;
  program_url: string | null;
  is_active: boolean;
  created_at: string;
}

interface GraduateProgramCardProps {
  program: GraduateProgram;
}

const GraduateProgramCard: React.FC<GraduateProgramCardProps> = ({ program }) => {
  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return null;
    return new Date(deadline).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isDeadlineApproaching = (deadline: string | null) => {
    if (!deadline) return false;
    const deadlineDate = new Date(deadline);
    const today = new Date();
    const daysUntilDeadline = Math.ceil((deadlineDate.getTime() - today.getTime()) / (1000 * 3600 * 24));
    return daysUntilDeadline <= 30 && daysUntilDeadline > 0;
  };

  const getDegreeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'master\'s':
      case 'masters':
        return 'bg-blue-100 text-blue-800';
      case 'phd':
      case 'doctorate':
        return 'bg-purple-100 text-purple-800';
      case 'professional':
        return 'bg-green-100 text-green-800';
      case 'executive':
        return 'bg-amber-100 text-amber-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getFieldIcon = (field: string) => {
    const fieldLower = field.toLowerCase();
    if (fieldLower.includes('engineering') || fieldLower.includes('technology')) {
      return <Microscope className="h-3 w-3" />;
    }
    if (fieldLower.includes('business') || fieldLower.includes('management')) {
      return <Users className="h-3 w-3" />;
    }
    if (fieldLower.includes('medicine') || fieldLower.includes('health')) {
      return <Award className="h-3 w-3" />;
    }
    return <BookOpen className="h-3 w-3" />;
  };

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2 text-gray-900">{program.program_name}</CardTitle>
            <CardDescription className="flex items-center mt-2 text-gray-600">
              <MapPin className="h-4 w-4 me-1" />
              {program.university_name}
            </CardDescription>
          </div>
          <Badge className={`ms-2 ${getDegreeColor(program.degree_level)}`}>
            {program.degree_level}
          </Badge>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-3">
          <Badge variant="outline" className="flex items-center bg-blue-50 border-blue-200 text-blue-700">
            {getFieldIcon(program.field_of_study)}
            <span className="ms-1">{program.field_of_study}</span>
          </Badge>
          {program.duration_years && (
            <Badge variant="outline" className="flex items-center bg-gray-50 border-gray-200">
              <Clock className="h-3 w-3 me-1" />
              {program.duration_years} year{program.duration_years > 1 ? 's' : ''}
            </Badge>
          )}
          <Badge variant="outline" className="flex items-center bg-green-50 border-green-200 text-green-700">
            <Globe className="h-3 w-3 me-1" />
            International
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        {program.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-3">
            {program.description}
          </p>
        )}

        {/* Program Details */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Program Format:</span>
            <span className="font-medium">Full-time</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Language:</span>
            <span className="font-medium">English</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">Funding:</span>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <DollarSign className="h-3 w-3 me-1" />
              Scholarships Available
            </Badge>
          </div>
        </div>
        
        {program.application_deadline && (
          <div className="flex items-center text-sm mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <Calendar className="h-4 w-4 me-2 text-blue-600" />
            <span className="text-gray-700">Application Deadline: </span>
            <span 
              className={`ms-1 font-medium ${
                isDeadlineApproaching(program.application_deadline) 
                  ? 'text-orange-600' 
                  : 'text-blue-700'
              }`}
            >
              {formatDeadline(program.application_deadline)}
            </span>
            {isDeadlineApproaching(program.application_deadline) && (
              <Badge variant="outline" className="ms-2 text-orange-600 border-orange-200 bg-orange-50">
                Deadline Soon
              </Badge>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          {program.program_url && (
            <Button variant="outline" size="sm" className="flex-1" asChild>
              <a href={program.program_url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4 me-2" />
                View Details
              </a>
            </Button>
          )}
          <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
            <GraduationCap className="h-4 w-4 me-2" />
            Apply Now
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraduateProgramCard;
