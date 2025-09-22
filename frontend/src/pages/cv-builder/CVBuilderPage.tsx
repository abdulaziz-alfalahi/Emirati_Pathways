import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, Eye, Edit3, Sparkles, CheckCircle, AlertCircle, FileText, User, Briefcase, GraduationCap, Award, Languages, Phone, Mail, MapPin, Calendar, Plus, Trash2, Save } from 'lucide-react';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  nationality: string;
  emirate: string;
  professionalTitle: string;
  summary: string;
}

interface Experience {
  id: string;
  position: string;
  company: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  description: string;
  achievements: string[];
}

interface Education {
  id: string;
  degree: string;
  institution: string;
  location: string;
  startDate: string;
  endDate: string;
  gpa: string;
  honors: string;
}

interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';
  certified: boolean;
}

const CVBuilderPage: React.FC = () => {
  const { t } = useTranslation('cv-builder');
  const [activeTab, setActiveTab] = useState<string>('personal');
  const [cvTemplate, setCvTemplate] = useState<string>('professional');
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    location: '',
    nationality: 'UAE National',
    emirate: '',
    professionalTitle: '',
    summary: ''
  });

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [education, setEducation] = useState<Education[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);

  const templates = [
    {
      id: 'professional',
      name: 'Professional',
      description: 'Clean and modern design perfect for corporate roles',
      preview: '📄',
      popular: true
    },
    {
      id: 'executive',
      name: 'Executive',
      description: 'Sophisticated layout for senior leadership positions',
      preview: '📋',
      popular: false
    },
    {
      id: 'creative',
      name: 'Creative',
      description: 'Vibrant design for creative and design roles',
      preview: '🎨',
      popular: false
    },
    {
      id: 'technical',
      name: 'Technical',
      description: 'Structured format ideal for engineering and IT roles',
      preview: '⚙️',
      popular: false
    }
  ];

  const emirates = [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
  ];

  const skillCategories = [
    'Technical', 'Leadership', 'Communication', 'Language', 'Industry-Specific', 'Soft Skills'
  ];

  const tabs = [
    { id: 'personal', name: 'Personal Info', icon: User },
    { id: 'experience', name: 'Experience', icon: Briefcase },
    { id: 'education', name: 'Education', icon: GraduationCap },
    { id: 'skills', name: 'Skills', icon: Award },
    { id: 'template', name: 'Template', icon: FileText },
    { id: 'preview', name: 'Preview', icon: Eye }
  ];

  const addExperience = () => {
    const newExperience: Experience = {
      id: Date.now().toString(),
      position: '',
      company: '',
      location: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      achievements: ['']
    };
    setExperiences([...experiences, newExperience]);
  };

  const addEducation = () => {
    const newEducation: Education = {
      id: Date.now().toString(),
      degree: '',
      institution: '',
      location: '',
      startDate: '',
      endDate: '',
      gpa: '',
      honors: ''
    };
    setEducation([...education, newEducation]);
  };

  const addSkill = () => {
    const newSkill: Skill = {
      id: Date.now().toString(),
      name: '',
      category: 'Technical',
      proficiency: 'Intermediate',
      certified: false
    };
    setSkills([...skills, newSkill]);
  };

  const analyzeCV = async () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAnalysisResults({
        score: 85,
        strengths: [
          'Strong professional experience in UAE market',
          'Relevant technical skills for target roles',
          'Clear career progression'
        ],
        improvements: [
          'Add more quantified achievements',
          'Include relevant certifications',
          'Expand professional summary'
        ],
        keywords: ['Leadership', 'Project Management', 'UAE Experience', 'Digital Transformation']
      });
      setIsAnalyzing(false);
    }, 2000);
  };

  const renderPersonalInfo = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Full Name *</label>
          <input
            type="text"
            value={personalInfo.fullName}
            onChange={(e) => setPersonalInfo({...personalInfo, fullName: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ahmed Al Mansouri"
          />
        </div>
        <div>
          <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Professional Title *</label>
          <input
            type="text"
            value={personalInfo.professionalTitle}
            onChange={(e) => setPersonalInfo({...personalInfo, professionalTitle: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Senior Software Engineer"
          />
        </div>
        <div>
          <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Email *</label>
          <input
            type="email"
            value={personalInfo.email}
            onChange={(e) => setPersonalInfo({...personalInfo, email: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="ahmed.almansouri@email.com"
          />
        </div>
        <div>
          <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Phone *</label>
          <input
            type="tel"
            value={personalInfo.phone}
            onChange={(e) => setPersonalInfo({...personalInfo, phone: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="+971 50 123 4567"
          />
        </div>
        <div>
          <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Emirate *</label>
          <select
            value={personalInfo.emirate}
            onChange={(e) => setPersonalInfo({...personalInfo, emirate: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select Emirate</option>
            {emirates.map(emirate => (
              <option key={emirate} value={emirate}>{emirate}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Nationality</label>
          <input
            type="text"
            value={personalInfo.nationality}
            onChange={(e) => setPersonalInfo({...personalInfo, nationality: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            readOnly
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-dubai-medium text-gray-700 mb-2">Professional Summary</label>
        <textarea
          value={personalInfo.summary}
          onChange={(e) => setPersonalInfo({...personalInfo, summary: e.target.value})}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Write a compelling summary of your professional background and career objectives..."
        />
      </div>
    </div>
  );

  const renderExperience = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-dubai-bold text-gray-900">Work Experience</h3>
        <button
          onClick={addExperience}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Experience
        </button>
      </div>
      
      {experiences.map((exp, index) => (
        <div key={exp.id} className="bg-gray-50 rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <h4 className="font-dubai-medium text-gray-900">Experience {index + 1}</h4>
            <button
              onClick={() => setExperiences(experiences.filter(e => e.id !== exp.id))}
              className="text-red-600 hover:text-red-800"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input
              type="text"
              placeholder="Position Title"
              value={exp.position}
              onChange={(e) => {
                const updated = experiences.map(e => 
                  e.id === exp.id ? {...e, position: e.target.value} : e
                );
                setExperiences(updated);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Company Name"
              value={exp.company}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Location"
              value={exp.location}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={exp.current}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm text-gray-700">Current Position</label>
            </div>
          </div>
          
          <textarea
            placeholder="Job description and key responsibilities..."
            value={exp.description}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
          />
        </div>
      ))}
      
      {experiences.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Briefcase className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No work experience added yet. Click "Add Experience" to get started.</p>
        </div>
      )}
    </div>
  );

  const renderSkills = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-dubai-bold text-gray-900">Skills & Competencies</h3>
        <button
          onClick={addSkill}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Skill
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {skills.map((skill) => (
          <div key={skill.id} className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-start mb-3">
              <input
                type="text"
                placeholder="Skill name"
                value={skill.name}
                onChange={(e) => {
                  const updated = skills.map(s => 
                    s.id === skill.id ? {...s, name: e.target.value} : s
                  );
                  setSkills(updated);
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent mr-2"
              />
              <button
                onClick={() => setSkills(skills.filter(s => s.id !== skill.id))}
                className="text-red-600 hover:text-red-800"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <select
                value={skill.category}
                onChange={(e) => {
                  const updated = skills.map(s => 
                    s.id === skill.id ? {...s, category: e.target.value} : s
                  );
                  setSkills(updated);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                {skillCategories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              
              <select
                value={skill.proficiency}
                onChange={(e) => {
                  const updated = skills.map(s => 
                    s.id === skill.id ? {...s, proficiency: e.target.value as any} : s
                  );
                  setSkills(updated);
                }}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
                <option value="Expert">Expert</option>
              </select>
            </div>
            
            <div className="flex items-center mt-2">
              <input
                type="checkbox"
                checked={skill.certified}
                onChange={(e) => {
                  const updated = skills.map(s => 
                    s.id === skill.id ? {...s, certified: e.target.checked} : s
                  );
                  setSkills(updated);
                }}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 text-sm text-gray-700">Certified</label>
            </div>
          </div>
        ))}
      </div>
      
      {skills.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          <Award className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No skills added yet. Click "Add Skill" to showcase your competencies.</p>
        </div>
      )}
    </div>
  );

  const renderTemplate = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-dubai-bold text-gray-900 mb-4">Choose Your CV Template</h3>
        <p className="text-gray-600 mb-6">Select a professional template that best represents your career level and industry.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {templates.map((template) => (
          <div
            key={template.id}
            onClick={() => setCvTemplate(template.id)}
            className={`relative cursor-pointer rounded-lg border-2 p-6 hover:shadow-md transition-all ${
              cvTemplate === template.id 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {template.popular && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                Popular
              </span>
            )}
            
            <div className="text-center">
              <div className="text-4xl mb-4">{template.preview}</div>
              <h4 className="font-dubai-bold text-gray-900 mb-2">{template.name}</h4>
              <p className="text-sm text-gray-600">{template.description}</p>
            </div>
            
            {cvTemplate === template.id && (
              <div className="absolute top-2 left-2">
                <CheckCircle className="h-5 w-5 text-blue-500" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPreview = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-dubai-bold text-gray-900">CV Preview & Analysis</h3>
        <div className="flex space-x-3">
          <button
            onClick={analyzeCV}
            disabled={isAnalyzing}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center disabled:opacity-50"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
        </div>
      </div>
      
      {/* CV Preview */}
      <div className="bg-white border rounded-lg p-8 shadow-sm">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 border-b pb-6">
            <h1 className="text-3xl font-dubai-bold text-gray-900 mb-2">
              {personalInfo.fullName || 'Your Name'}
            </h1>
            <p className="text-xl text-gray-600 mb-4">
              {personalInfo.professionalTitle || 'Professional Title'}
            </p>
            <div className="flex justify-center items-center space-x-6 text-sm text-gray-600">
              <span className="flex items-center">
                <Mail className="h-4 w-4 mr-1" />
                {personalInfo.email || 'email@example.com'}
              </span>
              <span className="flex items-center">
                <Phone className="h-4 w-4 mr-1" />
                {personalInfo.phone || '+971 50 123 4567'}
              </span>
              <span className="flex items-center">
                <MapPin className="h-4 w-4 mr-1" />
                {personalInfo.emirate || 'UAE'}
              </span>
            </div>
          </div>
          
          {/* Summary */}
          {personalInfo.summary && (
            <div className="mb-8">
              <h2 className="text-lg font-dubai-bold text-gray-900 mb-3 border-l-4 border-blue-500 pl-3">
                Professional Summary
              </h2>
              <p className="text-gray-700 leading-relaxed">{personalInfo.summary}</p>
            </div>
          )}
          
          {/* Experience */}
          {experiences.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-dubai-bold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">
                Professional Experience
              </h2>
              <div className="space-y-4">
                {experiences.map((exp, index) => (
                  <div key={exp.id} className="border-l-2 border-gray-200 pl-4">
                    <h3 className="font-dubai-bold text-gray-900">{exp.position}</h3>
                    <p className="text-blue-600 font-dubai-medium">{exp.company}</p>
                    <p className="text-sm text-gray-600 mb-2">{exp.location}</p>
                    {exp.description && (
                      <p className="text-gray-700 text-sm">{exp.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Skills */}
          {skills.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-dubai-bold text-gray-900 mb-4 border-l-4 border-blue-500 pl-3">
                Skills & Competencies
              </h2>
              <div className="grid grid-cols-2 gap-4">
                {skillCategories.map(category => {
                  const categorySkills = skills.filter(skill => skill.category === category);
                  if (categorySkills.length === 0) return null;
                  
                  return (
                    <div key={category}>
                      <h4 className="font-dubai-medium text-gray-900 mb-2">{category}</h4>
                      <div className="space-y-1">
                        {categorySkills.map(skill => (
                          <div key={skill.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{skill.name}</span>
                            <span className="text-blue-600 text-xs">{skill.proficiency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI Analysis Results */}
      {analysisResults && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <Sparkles className="h-6 w-6 text-purple-600 mr-2" />
            <h3 className="text-lg font-dubai-bold text-gray-900">AI Analysis Results</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Score */}
            <div className="text-center">
              <div className="text-3xl font-dubai-bold text-purple-600 mb-2">
                {analysisResults.score}/100
              </div>
              <p className="text-sm text-gray-600">Overall CV Score</p>
            </div>
            
            {/* Strengths */}
            <div>
              <h4 className="font-dubai-bold text-green-700 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-1" />
                Strengths
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {analysisResults.strengths.map((strength: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-green-500 mr-2">•</span>
                    {strength}
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Improvements */}
            <div>
              <h4 className="font-dubai-bold text-orange-700 mb-2 flex items-center">
                <AlertCircle className="h-4 w-4 mr-1" />
                Improvements
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                {analysisResults.improvements.map((improvement: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-orange-500 mr-2">•</span>
                    {improvement}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 font-dubai">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-dubai-bold text-gray-900">CV Builder</h1>
              <p className="text-gray-600 mt-2">Create a professional CV tailored for UAE employers</p>
            </div>
            <div className="flex items-center space-x-2">
              <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🇦🇪 UAE Optimized
              </span>
              <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-dubai-medium">
                🤖 AI-Powered
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Navigation */}
          <div className="lg:w-64">
            <div className="bg-white rounded-lg shadow-sm border p-4 sticky top-8">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-3 py-2 text-sm font-dubai-medium rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      {tab.name}
                    </button>
                  );
                })}
              </nav>
              
              <div className="mt-6 pt-6 border-t">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center font-dubai-medium">
                  <Save className="h-4 w-4 mr-2" />
                  Save Progress
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm border p-8">
              {activeTab === 'personal' && renderPersonalInfo()}
              {activeTab === 'experience' && renderExperience()}
              {activeTab === 'education' && (
                <div className="text-center py-12 text-gray-500">
                  <GraduationCap className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Education section - Coming soon!</p>
                </div>
              )}
              {activeTab === 'skills' && renderSkills()}
              {activeTab === 'template' && renderTemplate()}
              {activeTab === 'preview' && renderPreview()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CVBuilderPage;
