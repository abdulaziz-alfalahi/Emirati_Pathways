
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, DollarSign, Star, Bookmark, ExternalLink } from 'lucide-react';

interface UniversityProgram {
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

interface ProgramCardProps {
  program: UniversityProgram;
  onSave?: (programId: string) => void;
  onApply?: (programId: string) => void;
  isSaved?: boolean;
}

const ProgramCard: React.FC<ProgramCardProps> = ({ 
  program, 
  onSave, 
  onApply, 
  isSaved = false 
}) => {
  const getDegreeLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'bachelor': return 'bg-blue-100 text-blue-800';
      case 'master': return 'bg-green-100 text-green-800';
      case 'phd': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getUniversityType = (universityName: string) => {
    const internationalKeywords = ['Cambridge', 'MIT', 'Harvard', 'Oxford', 'Stanford'];
    return internationalKeywords.some(keyword => universityName.includes(keyword)) 
      ? 'International' 
      : 'UAE';
  };

  const formatDeadline = (deadline: string | null) => {
    if (!deadline) return 'Rolling admissions';
    return new Date(deadline).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const universityType = getUniversityType(program.university_name);
  const isInternational = universityType === 'International';

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start mb-2">
          <div className="flex gap-2">
            <Badge className={getDegreeLevelColor(program.degree_level)}>
              {program.degree_level}
            </Badge>
            <Badge variant={isInternational ? "default" : "secondary"}>
              {universityType}
            </Badge>
          </div>
          {onSave && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSave(program.id)}
              className={isSaved ? "text-yellow-600" : "text-gray-400"}
            >
              <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-current' : ''}`} />
            </Button>
          )}
        </div>
        <CardTitle className="text-lg line-clamp-2 mb-2">{program.program_name}</CardTitle>
        <p className="text-sm text-muted-foreground font-medium">{program.university_name}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3">
          {program.description || `${program.degree_level} program in ${program.field_of_study}`}
        </p>

        <div className="space-y-2 text-sm">
          <div className="flex items-center text-muted-foreground">
            <Star className="h-4 w-4 me-2 text-blue-600" />
            <span className="font-medium">{program.field_of_study}</span>
          </div>
          
          {program.duration_years && (
            <div className="flex items-center text-muted-foreground">
              <Clock className="h-4 w-4 me-2 text-green-600" />
              <span>{program.duration_years} year{program.duration_years > 1 ? 's' : ''}</span>
            </div>
          )}

          <div className="flex items-center text-muted-foreground">
            <MapPin className="h-4 w-4 me-2 text-purple-600" />
            <span>{universityType} University</span>
          </div>

          <div className="flex items-center text-muted-foreground">
            <Calendar className="h-4 w-4 me-2 text-orange-600" />
            <span className="text-xs">Deadline: {formatDeadline(program.application_deadline)}</span>
          </div>
        </div>

        {/* Estimated tuition placeholder */}
        <div className="flex items-center text-sm">
          <DollarSign className="h-4 w-4 me-2 text-green-600" />
          <span className="font-medium text-green-700">
            {isInternational ? 'From $25,000/year' : 'From AED 30,000/year'}
          </span>
        </div>

        <div className="flex gap-2 pt-4">
          <Button 
            variant="outline" 
            size="sm"
            className="flex-1"
            onClick={() => program.program_url && window.open(program.program_url, '_blank')}
          >
            <ExternalLink className="h-4 w-4 me-1" />
            Details
          </Button>
          {onApply && (
            <Button 
              size="sm"
              className="flex-1 bg-blue-600 hover:bg-blue-700"
              onClick={() => onApply(program.id)}
            >
              Apply Now
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramCard;
