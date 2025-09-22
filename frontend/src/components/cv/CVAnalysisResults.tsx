import React, { useState } from 'react';
import { 
  User, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages, 
  MapPin, 
  Mail, 
  Phone,
  Calendar,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  Star,
  Download,
  Share2,
  Edit
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CVAnalysisResultsProps {
  cvData: any;
  onEdit?: () => void;
  onDownload?: () => void;
  onShare?: () => void;
}

const CVAnalysisResults: React.FC<CVAnalysisResultsProps> = ({
  cvData,
  onEdit,
  onDownload,
  onShare
}) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!cvData || !cvData.success) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          No CV data available or parsing failed.
        </AlertDescription>
      </Alert>
    );
  }

  const { data, analysis, metadata } = cvData;
  const personalInfo = data?.personal_info || {};
  const experience = data?.experience || [];
  const education = data?.education || [];
  const skills = data?.skills || [];
  const languages = data?.languages || [];
  const certifications = data?.certifications || [];

  const renderPersonalInfo = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {personalInfo.full_name && (
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              <span className="font-medium">{personalInfo.full_name}</span>
            </div>
          )}
          {personalInfo.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-gray-500" />
              <span>{personalInfo.email}</span>
            </div>
          )}
          {personalInfo.phone && (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{personalInfo.phone}</span>
            </div>
          )}
          {personalInfo.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span>{personalInfo.address}</span>
            </div>
          )}
          {personalInfo.nationality && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Nationality:</span>
              <Badge variant={personalInfo.nationality.toLowerCase().includes('uae') ? 'default' : 'secondary'}>
                {personalInfo.nationality}
              </Badge>
            </div>
          )}
          {personalInfo.emirate && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Emirate:</span>
              <Badge variant="outline">{personalInfo.emirate}</Badge>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  const renderExperience = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Work Experience ({experience.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {experience.length === 0 ? (
          <p className="text-gray-500">No work experience found</p>
        ) : (
          <div className="space-y-4">
            {experience.map((exp, index) => (
              <div key={index} className="border-l-2 border-blue-200 pl-4 pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold text-lg">{exp.position}</h4>
                    <p className="text-blue-600 font-medium">{exp.company}</p>
                    <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {exp.start_date} - {exp.end_date}
                      </span>
                      {exp.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {exp.location}
                        </span>
                      )}
                      {exp.duration && (
                        <Badge variant="outline" className="text-xs">
                          {exp.duration}
                        </Badge>
                      )}
                    </div>
                    {exp.is_uae_experience && (
                      <Badge className="mt-2 bg-green-100 text-green-800">
                        UAE Experience
                      </Badge>
                    )}
                  </div>
                </div>
                {exp.description && (
                  <p className="text-gray-700 mt-2 text-sm">{exp.description}</p>
                )}
                {exp.technologies && exp.technologies.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {exp.technologies.map((tech, techIndex) => (
                      <Badge key={techIndex} variant="secondary" className="text-xs">
                        {tech}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderEducation = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5" />
          Education ({education.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {education.length === 0 ? (
          <p className="text-gray-500">No education information found</p>
        ) : (
          <div className="space-y-4">
            {education.map((edu, index) => (
              <div key={index} className="border-l-2 border-green-200 pl-4 pb-4">
                <h4 className="font-semibold">{edu.degree}</h4>
                <p className="text-green-600 font-medium">{edu.institution}</p>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  {edu.field_of_study && <span>{edu.field_of_study}</span>}
                  {edu.end_date && (
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {edu.end_date}
                    </span>
                  )}
                  {edu.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {edu.location}
                    </span>
                  )}
                </div>
                {edu.is_uae_education && (
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    UAE Education
                  </Badge>
                )}
                {edu.grade && (
                  <Badge variant="outline" className="mt-2">
                    Grade: {edu.grade}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderSkills = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Skills & Competencies ({skills.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {skills.length === 0 ? (
          <p className="text-gray-500">No skills found</p>
        ) : (
          <div className="space-y-4">
            {['Technical', 'Soft', 'Industry', 'Language'].map(category => {
              const categorySkills = skills.filter(skill => 
                skill.category?.toLowerCase() === category.toLowerCase()
              );
              
              if (categorySkills.length === 0) return null;
              
              return (
                <div key={category}>
                  <h5 className="font-semibold mb-2">{category} Skills</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {categorySkills.map((skill, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{skill.name}</span>
                        <div className="flex items-center gap-2">
                          {skill.proficiency && (
                            <Badge 
                              variant={
                                skill.proficiency === 'Expert' ? 'default' :
                                skill.proficiency === 'Advanced' ? 'secondary' : 'outline'
                              }
                              className="text-xs"
                            >
                              {skill.proficiency}
                            </Badge>
                          )}
                          {skill.years_experience && (
                            <span className="text-xs text-gray-500">
                              {skill.years_experience}y
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderLanguages = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Languages className="h-5 w-5" />
          Languages ({languages.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {languages.length === 0 ? (
          <p className="text-gray-500">No language information found</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {languages.map((lang, index) => (
              <div key={index} className="p-3 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{lang.language}</span>
                  <Badge 
                    variant={lang.proficiency === 'Native' ? 'default' : 'secondary'}
                  >
                    {lang.proficiency}
                  </Badge>
                </div>
                {(lang.reading || lang.writing || lang.speaking) && (
                  <div className="text-sm text-gray-600 space-y-1">
                    {lang.reading && <div>Reading: {lang.reading}</div>}
                    {lang.writing && <div>Writing: {lang.writing}</div>}
                    {lang.speaking && <div>Speaking: {lang.speaking}</div>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderAnalysis = () => (
    <div className="space-y-4">
      {analysis?.cv_score && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              CV Score & Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Overall CV Score</span>
                  <span className="text-2xl font-bold text-blue-600">
                    {analysis.cv_score}/100
                  </span>
                </div>
                <Progress value={analysis.cv_score} className="w-full" />
              </div>
              
              {analysis.score_breakdown && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(analysis.score_breakdown).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <div className="text-lg font-semibold text-blue-600">{value}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {key.replace('_', ' ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {analysis?.strengths && analysis.strengths.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              Strengths
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.strengths.map((strength, index) => (
                <li key={index} className="flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{strength}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {analysis?.improvement_areas && analysis.improvement_areas.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              Areas for Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analysis.improvement_areas.map((area, index) => (
                <li key={index} className="flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{area}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {data?.uae_analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              UAE Market Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>UAE Experience</span>
                <Badge variant={data.uae_analysis.uae_experience_years > 0 ? 'default' : 'secondary'}>
                  {data.uae_analysis.uae_experience_years} years
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>UAE Education</span>
                <Badge variant={data.uae_analysis.has_uae_education ? 'default' : 'secondary'}>
                  {data.uae_analysis.has_uae_education ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Arabic Language</span>
                <Badge variant={data.uae_analysis.has_arabic_language ? 'default' : 'secondary'}>
                  {data.uae_analysis.has_arabic_language ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                <span>Emiratization Eligible</span>
                <Badge variant={data.uae_analysis.emiratization_eligible ? 'default' : 'secondary'}>
                  {data.uae_analysis.emiratization_eligible ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">CV Analysis Results</h2>
          <p className="text-gray-600">
            Processed on {new Date(metadata?.parsed_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-2">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
          )}
          {onDownload && (
            <Button variant="outline" onClick={onDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          )}
          {onShare && (
            <Button variant="outline" onClick={onShare}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="experience">Experience</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
          <TabsTrigger value="languages">Languages</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {renderPersonalInfo()}
          {data?.professional_summary && (
            <Card>
              <CardHeader>
                <CardTitle>Professional Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{data.professional_summary}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="experience">
          {renderExperience()}
        </TabsContent>

        <TabsContent value="education">
          {renderEducation()}
        </TabsContent>

        <TabsContent value="skills">
          {renderSkills()}
        </TabsContent>

        <TabsContent value="languages">
          {renderLanguages()}
        </TabsContent>

        <TabsContent value="analysis">
          {renderAnalysis()}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CVAnalysisResults;
