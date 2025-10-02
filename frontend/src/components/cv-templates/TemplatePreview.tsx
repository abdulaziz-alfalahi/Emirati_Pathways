import React from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Calendar,
  Building2,
  GraduationCap,
  Award,
  Zap
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
  // Sample data for preview
  const sampleData = {
    personalInfo: {
      firstName: cvData?.personalInfo?.firstName || 'Ahmed',
      lastName: cvData?.personalInfo?.lastName || 'Al Mansouri',
      email: cvData?.personalInfo?.email || 'ahmed.almansouri@email.com',
      phone: cvData?.personalInfo?.phone || '+971 50 123 4567',
      location: cvData?.personalInfo?.location || 'Dubai, UAE'
    },
    professionalSummary: cvData?.professionalSummary || 'Experienced professional with expertise in technology and leadership...',
    technicalSkills: cvData?.technicalSkills?.slice(0, 6) || ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
    softSkills: cvData?.softSkills?.slice(0, 4) || ['Leadership', 'Communication', 'Problem Solving', 'Team Management'],
    experience: cvData?.experience?.slice(0, 2) || [
      {
        jobTitle: 'Senior Software Engineer',
        company: 'Emirates NBD',
        startDate: '2020',
        endDate: 'Present'
      },
      {
        jobTitle: 'Software Engineer',
        company: 'Dubai Municipality',
        startDate: '2018',
        endDate: '2020'
      }
    ],
    education: cvData?.education?.slice(0, 1) || [
      {
        degree: 'Bachelor of Computer Science',
        institution: 'American University of Sharjah',
        graduationYear: '2018'
      }
    ]
  };

  const renderGovernmentExecutive = () => (
    <div className="bg-white border-2 border-blue-200 rounded-lg p-6 h-full">
      {/* Header with UAE Government styling */}
      <div className="text-center border-b-2 border-blue-600 pb-4 mb-4">
        <h1 className="text-2xl font-bold text-blue-900 mb-1">
          {sampleData.personalInfo.firstName} {sampleData.personalInfo.lastName}
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
          <div key={index} className="mb-2">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{exp.jobTitle}</h3>
                <p className="text-xs text-gray-700">{exp.company}</p>
              </div>
              <span className="text-xs text-gray-600">{exp.startDate} - {exp.endDate}</span>
            </div>
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
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-2 border-purple-200 rounded-lg p-6 h-full">
      {/* Modern Tech Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg p-4 mb-4">
        <h1 className="text-xl font-bold mb-2">
          {sampleData.personalInfo.firstName} {sampleData.personalInfo.lastName}
        </h1>
        <div className="text-sm opacity-90 space-y-1">
          <div>{sampleData.personalInfo.email} • {sampleData.personalInfo.phone}</div>
          <div>{sampleData.personalInfo.location}</div>
        </div>
      </div>

      {/* Skills Matrix */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
          <Zap className="w-4 h-4 mr-1" />
          TECHNICAL EXPERTISE
        </h2>
        <div className="grid grid-cols-3 gap-1">
          {sampleData.technicalSkills.slice(0, 6).map((skill, index) => (
            <span key={index} className="bg-purple-100 text-purple-800 px-2 py-1 rounded text-xs text-center">
              {skill}
            </span>
          ))}
        </div>
      </div>

      {/* Experience with modern layout */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-purple-800 mb-2 flex items-center">
          <Building2 className="w-4 h-4 mr-1" />
          EXPERIENCE
        </h2>
        {sampleData.experience.map((exp, index) => (
          <div key={index} className="bg-white rounded-lg p-3 mb-2 border-l-4 border-purple-500">
            <div className="flex justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.jobTitle}</h3>
                <p className="text-xs text-purple-700">{exp.company}</p>
              </div>
              <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">
                {exp.startDate} - {exp.endDate}
              </span>
            </div>
          </div>
        ))}
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
          {sampleData.personalInfo.firstName} {sampleData.personalInfo.lastName}
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
          <div key={index} className="mb-3 border-l-2 border-green-400 pl-3">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-bold text-gray-900">{exp.jobTitle}</h3>
                <p className="text-xs font-medium text-green-700">{exp.company}</p>
              </div>
              <span className="text-xs text-gray-600 font-medium">
                {exp.startDate} - {exp.endDate}
              </span>
            </div>
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
    <div className={`transform scale-75 origin-top-left ${className}`}>
      {renderTemplate()}
    </div>
  );
};

export default TemplatePreview;