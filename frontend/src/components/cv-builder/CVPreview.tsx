// src/components/cv-builder/CVPreview.tsx
import React, { forwardRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Github,
  Award,
  Globe,
  Star,
  Building
} from 'lucide-react';
import { CVData, CVTemplate } from '@/types/cv';

interface CVPreviewProps {
  data: CVData;
  template: CVTemplate;
  className?: string;
}

export const CVPreview = forwardRef<HTMLDivElement, CVPreviewProps>(
  ({ data, template, className = '' }, ref) => {
    const personal = (data.personalInfo ?? (data as any).personal_info) || {};
    const displayName =
      (personal as any).full_name ||
      [personal.firstName, personal.lastName].filter(Boolean).join(' ') ||
      '';
    const professionalTitle =
      (personal as any).professionalTitle ||
      data.experience?.[0]?.jobTitle ||
      data.experience?.[0]?.position ||
      'Professional';
    const location =
      (personal as any).location ||
      [personal.city, personal.emirate].filter(Boolean).join(', ');
    const summary =
      (data as any).professionalSummary ||
      (data as any).professional_summary ||
      (personal as any).profileSummary ||
      '';

    const renderPersonalInfo = () => (
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          {displayName || 'Unnamed Candidate'}
        </h1>
        <p className="text-lg text-gray-600">
          {professionalTitle}
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center text-sm text-gray-600">
          {personal.email && (
            <div className="flex items-center">
              <Mail className="h-4 w-4 mr-1" />
              {personal.email}
            </div>
          )}
          {personal.phone && (
            <div className="flex items-center">
              <Phone className="h-4 w-4 mr-1" />
              {personal.phone}
            </div>
          )}
          {location && (
            <div className="flex items-center">
              <MapPin className="h-4 w-4 mr-1" />
              {location}
            </div>
          )}
        </div>

        {summary && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Professional Summary</h3>
            <p className="text-gray-700 leading-relaxed">
              {summary}
            </p>
          </div>
        )}
      </div>
    );

    const renderExperience = () => {
      if (!data.experience || data.experience.length === 0) return null;

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-1">
            Professional Experience
          </h3>
          <div className="space-y-4">
            {data.experience.map((exp) => (
              <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{exp.jobTitle ?? exp.position}</h4>
                    <p className="text-blue-600 font-medium">{exp.company}</p>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {exp.startDate} - {exp.isCurrentJob || exp.isCurrentlyWorking ? 'Present' : exp.endDate}
                  </div>
                </div>
                
                {exp.location && (
                  <p className="text-sm text-gray-600 mb-2 flex items-center">
                    <MapPin className="h-4 w-4 mr-1" />
                    {exp.location}
                  </p>
                )}

                {exp.description && <p className="text-gray-700 mb-3">{exp.description}</p>}

                {exp.achievements && exp.achievements.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-800 mb-1">Key Achievements:</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {exp.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {exp.skills && exp.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {exp.skills.map((skill, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderEducation = () => {
      if (!data.education || data.education.length === 0) return null;

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-green-500 pb-1">
            Education
          </h3>
          <div className="space-y-3">
            {data.education.map((edu) => (
              <div key={edu.id} className="border-l-2 border-gray-2 00 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{edu.degree}</h4>
                    <p className="text-green-600 font-medium">{edu.institution}</p>
                    {edu.fieldOfStudy && (
                      <p className="text-gray-600">{edu.fieldOfStudy}</p>
                    )}
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {edu.startDate} - {edu.endDate}
                  </div>
                </div>
                
                {edu.gpa && (
                  <p className="text-sm text-gray-600 mt-1">GPA: {edu.gpa}</p>
                )}

                {edu.achievements && edu.achievements.length > 0 && (
                  <ul className="list-disc list-inside text-gray-700 text-sm mt-2 space-y-1">
                    {edu.achievements.map((achievement, index) => (
                      <li key={index}>{achievement}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderSkills = () => {
      if (!data.skills || data.skills.length === 0) return null;

      const skillsByCategory = data.skills.reduce((acc, skill) => {
        const key = skill.category || 'Other';
        if (!acc[key]) acc[key] = [];
        acc[key].push(skill);
        return acc;
      }, {} as Record<string, typeof data.skills>);

      const levels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'] as const;

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-purple-500 pb-1">
            Skills & Competencies
          </h3>
          <div className="space-y-4">
            {Object.entries(skillsByCategory).map(([category, skills]) => (
              <div key={category}>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">{category} Skills</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {skills.map((skill) => (
                    <div key={skill.id} className="flex items-center justify-between">
                      <span className="text-gray-700">{skill.name}</span>
                      <div className="flex items-center space-x-1">
                        {Array.from({ length: 4 }, (_, i) => (
                          <Star
                            key={i}
                            className={`h-3 w-3 ${
                              i < (levels.indexOf(skill.level) + 1)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                        <span className="text-xs text-gray-500 ml-1">{skill.level}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderLanguages = () => {
      if (!data.languages || data.languages.length === 0) return null;

      const profs = ['Basic', 'Conversational', 'Fluent', 'Native'] as const;

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-orange-500 pb-1">
            Languages
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {data.languages.map((language) => (
              <div key={language.id} className="flex items-center justify-between">
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-2 text-orange-500" />
                  <span className="font-medium text-gray-800">{language.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 4 }, (_, i) => (
                      <Star
                        key={i}
                        className={`h-3 w-3 ${
                          i < (profs.indexOf(language.proficiency) + 1)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-gray-500">{language.proficiency}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderCertifications = () => {
      if (!data.certifications || data.certifications.length === 0) return null;

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-red-500 pb-1">
            Certifications & Licenses
          </h3>
          <div className="space-y-3">
            {data.certifications.map((cert) => (
              <div key={cert.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Award className="h-4 w-4 mr-2 text-red-500" />
                      {cert.name}
                    </h4>
                    <p className="text-red-600 font-medium">{cert.issuer}</p>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {cert.issueDate}
                    {cert.expiryDate && ` - ${cert.expiryDate}`}
                  </div>
                </div>
                
                {cert.credentialId && (
                  <p className="text-sm text-gray-600 mt-1">
                    Credential ID: {cert.credentialId}
                  </p>
                )}

                {cert.credentialUrl && (
                  <a 
                    href={cert.credentialUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View Credential
                  </a>
                )}

                {cert.description && (
                  <p className="text-gray-700 text-sm mt-2">{cert.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderProjects = () => {
      if (!data.projects || data.projects.length === 0) return null;

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-indigo-500 pb-1">
            Projects & Portfolio
          </h3>
          <div className="space-y-4">
            {data.projects.map((project) => (
              <div key={project.id} className="border-l-2 border-gray-200 pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">{project.title}</h4>
                    <div className="flex items-center space-x-4 mt-1">
                      {project.url && (
                        <a 
                          href={project.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Live Demo
                        </a>
                      )}
                      {project.githubUrl && (
                        <a 
                          href={project.githubUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-800"
                        >
                          <Github className="h-3 w-3 mr-1" />
                          Source Code
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {project.startDate} - {project.isOngoing ? 'Present' : project.endDate}
                  </div>
                </div>

                {project.description && <p className="text-gray-700 mb-3">{project.description}</p>}

                {project.technologies?.length > 0 && (
                  <div className="mb-3">
                    <p className="font-medium text-gray-800 mb-1">Technologies:</p>
                    <div className="flex flex-wrap gap-1">
                      {project.technologies.map((tech, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {project.achievements?.length > 0 && (
                  <div>
                    <p className="font-medium text-gray-800 mb-1">Key Achievements:</p>
                    <ul className="list-disc list-inside text-gray-700 space-y-1">
                      {project.achievements.map((achievement, index) => (
                        <li key={index}>{achievement}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    const renderReferences = () => {
      const refs = (data as any).references as Array<{
        id: string; name: string; position?: string; company?: string; email?: string; phone?: string; relationship?: string
      }> | undefined;

      if (!refs || refs.length === 0) {
        return (
          <div className="mb-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-500 pb-1">
              References
            </h3>
            <p className="text-gray-600 italic">References available upon request</p>
          </div>
        );
      }

      return (
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-500 pb-1">
            Professional References
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {refs.map((ref) => (
              <div key={ref.id} className="border border-gray-200 rounded-lg p-3">
                <h4 className="font-semibold text-gray-900 flex items-center">
                  <Building className="h-4 w-4 mr-2" />
                  {ref.name}
                </h4>
                {ref.position && <p className="text-gray-600 text-sm">{ref.position}</p>}
                {ref.company && <p className="text-gray-600 text-sm">{ref.company}</p>}
                <div className="mt-2 space-y-1">
                  {ref.email && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Mail className="h-3 w-3 mr-1" />
                      {ref.email}
                    </div>
                  )}
                  {ref.phone && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Phone className="h-3 w-3 mr-1" />
                      {ref.phone}
                    </div>
                  )}
                </div>
                {ref.relationship && (
                  <p className="text-xs text-gray-500 mt-1">
                    Relationship: {ref.relationship}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };

    // Template-specific styling
    const getTemplateStyles = () => {
      switch (template as unknown as string) {
        case 'government':
          return 'bg-white border-2 border-blue-200';
        case 'corporate':
          return 'bg-white border border-gray-300';
        case 'creative':
          return 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200';
        case 'technical':
          return 'bg-gray-50 border border-gray-400';
        case 'academic':
          return 'bg-blue-50 border-2 border-blue-300';
        case 'modern':
          return 'bg-white border-l-4 border-l-green-500 border border-gray-200';
        default:
          return 'bg-white border border-gray-300';
      }
    };

    return (
      <div 
        ref={ref}
        className={`${getTemplateStyles()} p-8 max-w-4xl mx-auto ${className}`}
        style={{ minHeight: '297mm', width: '210mm' }} // A4 dimensions
      >
        {renderPersonalInfo()}
        {renderExperience()}
        {renderEducation()}
        {renderSkills()}
        {renderLanguages()}
        {renderCertifications()}
        {renderProjects()}
        {renderReferences()}
      </div>
    );
  }
);

CVPreview.displayName = 'CVPreview';
export default CVPreview;
