import React from 'react';
import { getDisplayName } from '@/utils/nameUtils';
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Building2,
  GraduationCap,
  Award,
  Zap,
  User,
  Users
} from 'lucide-react';

interface TemplatePreviewProps {
  templateId: string;
  cvData?: {
    personalInfo?: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      location?: string;
    };
    professionalSummary?: string;
    technicalSkills?: string[];
    softSkills?: string[];
    experience?: Array<{
      jobTitle?: string;
      company?: string;
      startDate?: string;
      endDate?: string;
      responsibilities?: string;
    }>;
    education?: Array<{
      degree?: string;
      institution?: string;
      graduationYear?: string;
    }>;
  };
  className?: string;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
  templateId,
  cvData,
  className = ''
}) => {
  // Sample data for preview using specific fallbacks or empty strings to avoid confusion
  const sampleData = {
    personalInfo: {
      firstName: cvData?.personalInfo?.firstName || '',
      lastName: cvData?.personalInfo?.lastName || '',
      email: cvData?.personalInfo?.email || '',
      phone: cvData?.personalInfo?.phone || '',
      location: cvData?.personalInfo?.location || ''
    },
    professionalSummary: cvData?.professionalSummary || '',
    technicalSkills: cvData?.technicalSkills || [],
    softSkills: cvData?.softSkills || [],
    experience: cvData?.experience || [],
    education: cvData?.education || []
  };

  const renderGovernmentExecutive = () => (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 h-full">
      {/* Header with UAE Government styling */}
      <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">
          {getDisplayName(sampleData.personalInfo)}
        </h1>
        <div className="text-sm text-gray-600 space-y-1">
          <div className="flex items-center justify-center space-x-4">
            <span className="flex items-center">
              <Mail className="w-3 h-3 mr-1" />
              {sampleData.personalInfo.email}
            </span>
            <span className="flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {sampleData.personalInfo.phone}
            </span>
          </div>
          <div className="flex items-center justify-center">
            <MapPin className="w-3 h-3 mr-1" />
            {sampleData.personalInfo.location}
          </div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-blue-800 mb-2 border-b border-blue-300">
          PROFESSIONAL SUMMARY
        </h2>
        <p className="text-xs text-gray-700 leading-relaxed">
          {sampleData.professionalSummary}
        </p>
      </div>

      {/* Skills */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-blue-800 mb-2 border-b border-blue-300">
          CORE COMPETENCIES
        </h2>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Technical</h3>
            <div className="flex flex-wrap gap-1">
              {sampleData.technicalSkills.slice(0, 4).map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-800 mb-1">Leadership</h3>
            <div className="flex flex-wrap gap-1">
              {sampleData.softSkills.slice(0, 3).map((skill, index) => (
                <span key={index} className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Experience */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-blue-800 mb-2 border-b border-blue-300">
          PROFESSIONAL EXPERIENCE
        </h2>
        {sampleData.experience.map((exp, index) => (
          <div key={index} className="mb-4">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.jobTitle}</h3>
                <p className="text-xs text-blue-700 font-medium">{exp.company}</p>
              </div>
              <span className="text-xs text-gray-600">{exp.startDate} - {exp.endDate}</span>
            </div>
            {exp.responsibilities && (
              <div className="text-xs text-gray-700 leading-relaxed pl-2">
                {exp.responsibilities.split('\n').map((line, i) => (
                  <p key={i} className="mb-0.5">• {line.replace(/^•\s*/, '')}</p>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <h2 className="text-lg font-bold text-blue-800 mb-2 border-b border-blue-300">
          EDUCATION
        </h2>
        {sampleData.education.map((edu, index) => (
          <div key={index} className="mb-2">
            <h3 className="text-sm font-semibold text-gray-900">{edu.degree}</h3>
            <p className="text-xs text-gray-700">{edu.institution} • {edu.graduationYear}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTechInnovator = () => (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 h-full font-sans">
      {/* Modern Tech Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-6 mb-6 shadow-md">
        <h1 className="text-2xl font-bold mb-2 tracking-wide">
          {getDisplayName(sampleData.personalInfo)}
        </h1>
        <div className="text-sm opacity-95 space-y-1 font-medium">
          <div className="flex items-center gap-4">
            <span>{sampleData.personalInfo.email}</span>
            <span>•</span>
            <span>{sampleData.personalInfo.phone}</span>
          </div>
          <div>{sampleData.personalInfo.location}</div>
        </div>
      </div>

      {/* Professional Summary */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm border border-purple-100">
        <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
          <User className="w-4 h-4 mr-2" />
          PROFESSIONAL SUMMARY
        </h2>
        <p className="text-xs text-gray-700 leading-relaxed text-justify">
          {sampleData.professionalSummary}
        </p>
      </div>

      {/* Skills Matrix */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <h2 className="text-sm font-bold text-purple-800 mb-3 flex items-center">
            <Zap className="w-4 h-4 mr-2" />
            TECHNICAL SKILLS
          </h2>
          <div className="flex flex-wrap gap-2">
            {sampleData.technicalSkills.map((skill, index) => (
              <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-purple-100">
          <h2 className="text-sm font-bold text-blue-800 mb-3 flex items-center">
            <Users className="w-4 h-4 mr-2" />
            SOFT SKILLS
          </h2>
          <div className="flex flex-wrap gap-2">
            {sampleData.softSkills.map((skill, index) => (
              <span key={index} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                {skill}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Experience with modern layout */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-purple-800 mb-3 flex items-center">
          <Building2 className="w-4 h-4 mr-2" />
          EXPERIENCE
        </h2>
        <div className="space-y-3">
          {sampleData.experience.map((exp, index) => (
            <div key={index} className="bg-white rounded-lg p-4 border-l-4 border-purple-500 shadow-sm">
              <div className="flex justify-between items-baseline mb-2">
                <div>
                  <h3 className="text-sm font-bold text-gray-900 leading-tight">{exp.jobTitle}</h3>
                  <p className="text-xs text-purple-700 font-medium">{exp.company}</p>
                </div>
                <span className="text-xs text-gray-500 font-medium bg-gray-50 px-2 py-1 rounded-full whitespace-nowrap ml-2">
                  {exp.startDate} - {exp.endDate}
                </span>
              </div>
              {exp.responsibilities && (
                <div className="text-xs text-gray-600 leading-relaxed mt-2 pl-2 border-l border-gray-100">
                  {exp.responsibilities.split('\n').map((line, i) => (
                    <p key={i} className="mb-1 last:mb-0 flex items-start">
                      <span className="mr-2 text-purple-400">•</span>
                      <span>{line.replace(/^•\s*/, '')}</span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Education */}
      <div>
        <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
          <GraduationCap className="w-4 h-4 mr-1" />
          EDUCATION
        </h2>
        {sampleData.education.map((edu, index) => (
          <div key={index} className="bg-white rounded-lg p-3 border-l-4 border-blue-500">
            <h3 className="text-sm font-semibold text-gray-900">{edu.degree}</h3>
            <p className="text-xs text-gray-700">{edu.institution} • {edu.graduationYear}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderBusinessLeader = () => (
    <div className="bg-white border-2 border-green-200 rounded-lg p-6 h-full">
      {/* Executive Header */}
      <div className="border-b-4 border-green-600 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-green-900 mb-1">
          {getDisplayName(sampleData.personalInfo)}
        </h1>
        <div className="text-sm text-gray-600 grid grid-cols-2 gap-2">
          <div className="flex items-center">
            <Mail className="w-3 h-3 mr-1" />
            {sampleData.personalInfo.email}
          </div>
          <div className="flex items-center">
            <Phone className="w-3 h-3 mr-1" />
            {sampleData.personalInfo.phone}
          </div>
          <div className="flex items-center col-span-2">
            <MapPin className="w-3 h-3 mr-1" />
            {sampleData.personalInfo.location}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">
          EXECUTIVE SUMMARY
        </h2>
        <p className="text-xs text-gray-700 leading-relaxed">
          {sampleData.professionalSummary}
        </p>
      </div>

      {/* Core Competencies */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">
          CORE COMPETENCIES
        </h2>
        <div className="grid grid-cols-2 gap-2">
          {[...sampleData.technicalSkills.slice(0, 4), ...sampleData.softSkills.slice(0, 4)].map((skill, index) => (
            <div key={index} className="flex items-center text-xs">
              <div className="w-2 h-2 bg-green-600 rounded-full mr-2"></div>
              {skill}
            </div>
          ))}
        </div>
      </div>

      {/* Professional Experience */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">
          PROFESSIONAL EXPERIENCE
        </h2>
        {sampleData.experience.map((exp, index) => (
          <div key={index} className="mb-4 border-l-2 border-green-400 pl-3">
            <div className="flex justify-between items-start mb-1">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.jobTitle}</h3>
                <p className="text-xs font-medium text-green-700">{exp.company}</p>
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {exp.startDate} - {exp.endDate}
              </span>
            </div>
            {exp.responsibilities && (
              <p className="text-xs text-gray-700 mt-1 whitespace-pre-line leading-relaxed">
                {exp.responsibilities}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Education */}
      <div>
        <h2 className="text-lg font-bold text-green-800 mb-2 bg-green-100 px-2 py-1 rounded">
          EDUCATION & QUALIFICATIONS
        </h2>
        {sampleData.education.map((edu, index) => (
          <div key={index} className="border-l-2 border-green-400 pl-3">
            <h3 className="text-sm font-semibold text-gray-900">{edu.degree}</h3>
            <p className="text-xs text-gray-700">{edu.institution} • {edu.graduationYear}</p>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTemplate = () => {
    switch (templateId) {
      case 'government-executive':
        return renderGovernmentExecutive();
      case 'tech-innovator':
        return renderTechInnovator();
      case 'business-leader':
        return renderBusinessLeader();
      default:
        return renderGovernmentExecutive();
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {renderTemplate()}
    </div>
  );
};

export default TemplatePreview;
