import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Globe,
  ExternalLink,
  Edit,
  Download,
  Eye
} from 'lucide-react';
import { CVData } from '@/utils/api';

interface ReviewStepProps {
  data: CVData;
  onEdit: (section: string) => void;
  onBack: () => void;
  onSubmit: () => void;
  onPreview: () => void;
  onDownload: () => void;
}

// Named export to match the import in CVBuilderWizard
export const ReviewStep: React.FC<ReviewStepProps> = ({
  data,
  onEdit,
  onBack,
  onSubmit,
  onPreview,
  onDownload
}) => {
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Present';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const isComplete = (section: any) => {
    if (Array.isArray(section)) {
      return section.length > 0;
    }
    if (typeof section === 'object' && section !== null) {
      return Object.values(section).some(value => 
        value && (typeof value === 'string' ? value.trim() !== '' : true)
      );
    }
    return Boolean(section);
  };

  const getCompletionStatus = () => {
    const sections = [
      { name: 'Personal Info', complete: isComplete(data.personalInfo) },
      { name: 'Experience', complete: isComplete(data.experience) },
      { name: 'Education', complete: isComplete(data.education) },
      { name: 'Skills', complete: isComplete(data.skills) }
    ];
    
    const completed = sections.filter(s => s.complete).length;
    return { completed, total: sections.length, sections };
  };

  const { completed, total, sections } = getCompletionStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-gray-900">Review Your CV</h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Review all sections of your CV before finalizing. You can edit any section or preview how it will look.
        </p>
        
        {/* Completion Status */}
        <div className="flex items-center justify-center gap-4 p-4 bg-blue-50 rounded-lg">
          <div className="text-2xl font-bold text-blue-600">
            {Math.round((completed / total) * 100)}%
          </div>
          <div className="text-sm text-gray-700">
            <div className="font-medium">CV Completion</div>
            <div>{completed} of {total} sections completed</div>
          </div>
        </div>
      </div>

      {/* Section Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Section Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {sections.map((section, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-2 ${
                  section.complete
                    ? 'border-green-200 bg-green-50'
                    : 'border-yellow-200 bg-yellow-50'
                }`}
              >
                <div className="text-sm font-medium text-gray-900">
                  {section.name}
                </div>
                <Badge
                  variant={section.complete ? 'default' : 'secondary'}
                  className="mt-1"
                >
                  {section.complete ? 'Complete' : 'Incomplete'}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5 text-blue-600" />
            Personal Information
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('personal')}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <span>{data.personalInfo?.fullName || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-gray-500" />
              <span>{data.personalInfo?.email || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" />
              <span>{data.personalInfo?.phone || 'Not provided'}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" />
              <span>{data.personalInfo?.address || 'Not provided'}</span>
            </div>
          </div>
          {data.personalInfo?.summary && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <div className="text-sm font-medium text-gray-700 mb-1">Professional Summary</div>
              <div className="text-sm text-gray-600">{data.personalInfo.summary}</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Experience */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Work Experience ({data.experience?.length || 0})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('experience')}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {data.experience && data.experience.length > 0 ? (
            <div className="space-y-4">
              {data.experience.slice(0, 3).map((exp, index) => (
                <div key={index} className="border-s-2 border-blue-200 ps-4">
                  <div className="font-medium text-gray-900">{exp.position}</div>
                  <div className="text-sm text-gray-600">
                    {exp.company} • {exp.location}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                  </div>
                  {exp.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {exp.description}
                    </div>
                  )}
                </div>
              ))}
              {data.experience.length > 3 && (
                <div className="text-sm text-gray-500 text-center">
                  ... and {data.experience.length - 3} more positions
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No work experience added yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-blue-600" />
            Education ({data.education?.length || 0})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('education')}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          {data.education && data.education.length > 0 ? (
            <div className="space-y-4">
              {data.education.map((edu, index) => (
                <div key={index} className="border-s-2 border-green-200 ps-4">
                  <div className="font-medium text-gray-900">{edu.degree}</div>
                  <div className="text-sm text-gray-600">
                    {edu.institution} • {edu.fieldOfStudy}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDate(edu.endDate)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No education information added yet
            </div>
          )}
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Award className="w-5 h-5 text-blue-600" />
            Skills
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit('skills')}
          >
            <Edit className="w-4 h-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.skills?.technical && data.skills.technical.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Technical Skills</div>
                <div className="flex flex-wrap gap-2">
                  {data.skills.technical.slice(0, 10).map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                  {data.skills.technical.length > 10 && (
                    <Badge variant="outline">
                      +{data.skills.technical.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {data.skills?.soft && data.skills.soft.length > 0 && (
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">Soft Skills</div>
                <div className="flex flex-wrap gap-2">
                  {data.skills.soft.slice(0, 8).map((skill, index) => (
                    <Badge key={index} variant="outline">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {(!data.skills?.technical?.length && !data.skills?.soft?.length) && (
              <div className="text-center py-8 text-gray-500">
                No skills added yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Languages */}
      {data.languages && data.languages.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Languages ({data.languages.length})
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onEdit('languages')}
            >
              <Edit className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {data.languages.map((lang, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="font-medium">{lang.language}</span>
                  <Badge variant="outline" className="text-xs">
                    {lang.proficiency}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="space-y-4">
        {/* Preview and Download */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onPreview}
            className="flex-1"
          >
            <Eye className="w-4 h-4 me-2" />
            Preview CV
          </Button>
          <Button
            variant="outline"
            onClick={onDownload}
            className="flex-1"
          >
            <Download className="w-4 h-4 me-2" />
            Download PDF
          </Button>
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={onBack}
          >
            Back to Edit
          </Button>
          
          <Button
            onClick={onSubmit}
            className="bg-green-600 hover:bg-green-700"
            disabled={completed < total}
          >
            {completed < total ? 'Complete All Sections' : 'Finalize CV'}
          </Button>
        </div>
      </div>

      {/* Completion Warning */}
      {completed < total && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center gap-2 text-yellow-800">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <div className="font-medium">Incomplete Sections</div>
          </div>
          <div className="text-sm text-yellow-700 mt-1">
            Please complete all sections before finalizing your CV. Missing sections may impact the quality of your application.
          </div>
        </div>
      )}
    </div>
  );
};

// Also provide default export for flexibility
export default ReviewStep;

