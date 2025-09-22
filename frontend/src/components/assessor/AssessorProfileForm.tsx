import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ClipboardCheck, 
  Award, 
  Users, 
  BookOpen,
  Calendar,
  Clock,
  Target,
  Bell,
  Shield,
  Save,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  FileText,
  BarChart,
  Settings,
  Zap,
  Eye,
  TrendingUp
} from 'lucide-react';

interface AssessorProfileData {
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  linkedIn: string;
  professionalId: string;
  
  // Professional Background
  organization: string;
  department: string;
  position: string;
  yearsOfExperience: string;
  assessmentExperience: string;
  
  // Certifications & Credentials
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    expiryYear?: string;
    credentialId?: string;
    level: string;
  }>;
  
  // Assessment Specializations
  assessmentTypes: string[];
  subjectAreas: string[];
  skillDomains: string[];
  assessmentLevels: string[];
  languages: string[];
  
  // Assessment Methodologies
  methodologies: string[];
  assessmentTools: string[];
  evaluationFrameworks: string[];
  qualityStandards: string[];
  
  // Technology & Tools
  softwareTools: string[];
  platforms: string[];
  analyticsTools: string[];
  reportingTools: string[];
  
  // Assessment Preferences
  preferredAssessmentDuration: string;
  maxCandidatesPerSession: string;
  assessmentEnvironment: string[];
  accommodationSupport: string[];
  
  // Quality Assurance
  qaProcesses: string[];
  reviewMethods: string[];
  calibrationFrequency: string;
  accuracyTargets: {
    reliability: string;
    validity: string;
    consistency: string;
  };
  
  // Professional Development
  continuingEducation: Array<{
    course: string;
    provider: string;
    year: string;
    hours: string;
  }>;
  professionalMemberships: string[];
  conferences: Array<{
    name: string;
    year: string;
    role: string;
  }>;
  
  // Collaboration & Communication
  collaborationStyle: string;
  communicationPreferences: string[];
  feedbackApproach: string;
  reportingStyle: string;
  
  // Availability & Schedule
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  timeZone: string;
  availabilityType: string;
  
  // Notification Settings
  notifications: {
    newAssessments: boolean;
    candidateUpdates: boolean;
    deadlineReminders: boolean;
    qualityAlerts: boolean;
    systemUpdates: boolean;
    professionalUpdates: boolean;
  };
  
  // Privacy Settings
  profileVisibility: string;
  contactVisibility: string;
  assessmentHistoryVisibility: string;
}

interface AssessorProfileFormProps {
  onProfileUpdate?: () => void;
  initialData?: Partial<AssessorProfileData>;
}

const AssessorProfileForm: React.FC<AssessorProfileFormProps> = ({ 
  onProfileUpdate,
  initialData 
}) => {
  const [profileData, setProfileData] = useState<AssessorProfileData>({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    linkedIn: '',
    professionalId: '',
    organization: '',
    department: '',
    position: '',
    yearsOfExperience: '',
    assessmentExperience: '',
    certifications: [],
    assessmentTypes: [],
    subjectAreas: [],
    skillDomains: [],
    assessmentLevels: [],
    languages: [],
    methodologies: [],
    assessmentTools: [],
    evaluationFrameworks: [],
    qualityStandards: [],
    softwareTools: [],
    platforms: [],
    analyticsTools: [],
    reportingTools: [],
    preferredAssessmentDuration: '',
    maxCandidatesPerSession: '',
    assessmentEnvironment: [],
    accommodationSupport: [],
    qaProcesses: [],
    reviewMethods: [],
    calibrationFrequency: '',
    accuracyTargets: {
      reliability: '',
      validity: '',
      consistency: ''
    },
    continuingEducation: [],
    professionalMemberships: [],
    conferences: [],
    collaborationStyle: '',
    communicationPreferences: [],
    feedbackApproach: '',
    reportingStyle: '',
    workingHours: {
      start: '08:00',
      end: '17:00',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    },
    timeZone: 'Asia/Dubai',
    availabilityType: '',
    notifications: {
      newAssessments: true,
      candidateUpdates: true,
      deadlineReminders: true,
      qualityAlerts: true,
      systemUpdates: true,
      professionalUpdates: false
    },
    profileVisibility: 'professional',
    contactVisibility: 'verified',
    assessmentHistoryVisibility: 'organization',
    ...initialData
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newItem, setNewItem] = useState('');

  const assessmentTypeOptions = [
    'Technical Skills Assessment',
    'Behavioral Assessment',
    'Cognitive Assessment',
    'Personality Assessment',
    'Language Proficiency',
    'Professional Competency',
    'Leadership Assessment',
    'Cultural Fit Assessment',
    'Performance Evaluation',
    'Certification Exam',
    'Aptitude Test',
    'Knowledge Assessment',
    'Practical Skills Test',
    'Portfolio Review',
    'Interview Assessment'
  ];

  const subjectAreaOptions = [
    'Information Technology',
    'Engineering',
    'Business & Management',
    'Finance & Accounting',
    'Healthcare',
    'Education',
    'Marketing & Sales',
    'Human Resources',
    'Operations',
    'Project Management',
    'Data Science',
    'Cybersecurity',
    'Digital Marketing',
    'Customer Service',
    'Quality Assurance',
    'Research & Development',
    'Legal & Compliance',
    'Supply Chain',
    'Manufacturing',
    'Construction'
  ];

  const skillDomainOptions = [
    'Technical Skills',
    'Soft Skills',
    'Leadership Skills',
    'Communication Skills',
    'Problem Solving',
    'Critical Thinking',
    'Analytical Skills',
    'Creativity & Innovation',
    'Teamwork & Collaboration',
    'Time Management',
    'Adaptability',
    'Decision Making',
    'Emotional Intelligence',
    'Customer Focus',
    'Digital Literacy',
    'Cultural Awareness',
    'Entrepreneurship',
    'Strategic Thinking',
    'Change Management',
    'Conflict Resolution'
  ];

  const assessmentLevelOptions = [
    'Entry Level',
    'Junior (1-3 years)',
    'Mid-level (3-7 years)',
    'Senior (7-12 years)',
    'Lead/Manager (10+ years)',
    'Executive (15+ years)',
    'C-Level',
    'Board Level',
    'Student/Graduate',
    'Professional Certification',
    'Expert Level',
    'Master Level'
  ];

  const methodologyOptions = [
    'Competency-Based Assessment',
    'Behavioral Event Interview',
    'Situational Judgment Test',
    'Case Study Analysis',
    'Role Playing',
    'Simulation Exercises',
    'Psychometric Testing',
    '360-Degree Feedback',
    'Assessment Center Method',
    'Portfolio Assessment',
    'Peer Assessment',
    'Self Assessment',
    'Performance-Based Assessment',
    'Adaptive Testing',
    'Gamified Assessment'
  ];

  const assessmentToolOptions = [
    'Online Assessment Platforms',
    'Video Interview Tools',
    'Psychometric Test Software',
    'Coding Assessment Tools',
    'Simulation Software',
    'Portfolio Management Systems',
    'Proctoring Software',
    'Analytics Dashboards',
    'Reporting Tools',
    'Feedback Systems',
    'Scheduling Tools',
    'Collaboration Platforms',
    'Document Management',
    'Quality Assurance Tools',
    'Calibration Systems'
  ];

  const qualityStandardOptions = [
    'ISO 10667 (Assessment Service Delivery)',
    'AERA Standards',
    'ITC Guidelines',
    'EFPA Standards',
    'SIOP Principles',
    'NCCA Standards',
    'IEEE Standards',
    'GDPR Compliance',
    'UAE Data Protection',
    'Industry Best Practices',
    'Internal Quality Standards',
    'Peer Review Standards',
    'Academic Standards',
    'Professional Ethics',
    'Accessibility Standards'
  ];

  const accommodationOptions = [
    'Extended Time',
    'Alternative Format',
    'Assistive Technology',
    'Sign Language Interpreter',
    'Large Print Materials',
    'Audio Instructions',
    'Separate Testing Room',
    'Frequent Breaks',
    'Flexible Scheduling',
    'Modified Instructions',
    'Scribe Services',
    'Reader Services',
    'Ergonomic Equipment',
    'Language Support',
    'Cultural Accommodations'
  ];

  const handleInputChange = (field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (parent: string, field: string, value: any) => {
    setProfileData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent as keyof AssessorProfileData],
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setProfileData(prev => {
      const currentArray = prev[field as keyof AssessorProfileData] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addToArray = (field: string, value: string) => {
    if (value.trim() && !profileData[field as keyof AssessorProfileData]?.includes(value.trim())) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof AssessorProfileData] as string[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field as keyof AssessorProfileData] as string[]).filter(item => item !== value)
    }));
  };

  const addCertification = () => {
    setProfileData(prev => ({
      ...prev,
      certifications: [...prev.certifications, {
        name: '',
        issuer: '',
        year: '',
        expiryYear: '',
        credentialId: '',
        level: ''
      }]
    }));
  };

  const updateCertification = (index: number, field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.map((cert, i) => 
        i === index ? { ...cert, [field]: value } : cert
      )
    }));
  };

  const removeCertification = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      certifications: prev.certifications.filter((_, i) => i !== index)
    }));
  };

  const addContinuingEducation = () => {
    setProfileData(prev => ({
      ...prev,
      continuingEducation: [...prev.continuingEducation, {
        course: '',
        provider: '',
        year: '',
        hours: ''
      }]
    }));
  };

  const updateContinuingEducation = (index: number, field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      continuingEducation: prev.continuingEducation.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeContinuingEducation = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      continuingEducation: prev.continuingEducation.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving assessor profile data:', profileData);
      
      setSaveStatus('success');
      onProfileUpdate?.();
    } catch (error) {
      console.error('Error saving profile:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateProfileCompletion = () => {
    const requiredFields = [
      'firstName', 'lastName', 'title', 'email', 'organization', 
      'position', 'yearsOfExperience'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profileData[field as keyof AssessorProfileData]
    ).length;
    
    const hasCertifications = profileData.certifications.length > 0;
    const hasSpecializations = profileData.assessmentTypes.length > 0;
    
    return Math.round(((completedFields + (hasCertifications ? 1 : 0) + (hasSpecializations ? 1 : 0)) / (requiredFields.length + 2)) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Profile Completion Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Profile Completion
          </CardTitle>
          <CardDescription>
            Complete your assessor profile to showcase your expertise and capabilities
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{calculateProfileCompletion()}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${calculateProfileCompletion()}%` }}
                />
              </div>
            </div>
            {calculateProfileCompletion() === 100 && (
              <CheckCircle className="h-6 w-6 text-green-500" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Save Status Alert */}
      {saveStatus !== 'idle' && (
        <Alert className={saveStatus === 'success' ? 'border-green-500' : 'border-red-500'}>
          {saveStatus === 'success' ? (
            <CheckCircle className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-500" />
          )}
          <AlertDescription>
            {saveStatus === 'success' 
              ? 'Profile saved successfully!' 
              : 'Failed to save profile. Please try again.'
            }
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="personal" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="certifications">Certifications</TabsTrigger>
          <TabsTrigger value="specializations">Specializations</TabsTrigger>
          <TabsTrigger value="methodology">Methodology</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Your professional details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={profileData.firstName}
                      onChange={(e) => handleInputChange('firstName', e.target.value)}
                      placeholder="Dr. Mariam"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={profileData.lastName}
                      onChange={(e) => handleInputChange('lastName', e.target.value)}
                      placeholder="Al Rashid"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="title">Professional Title *</Label>
                  <Input
                    id="title"
                    value={profileData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Senior Assessment Specialist / Psychometrician"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={profileData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="mariam.alrashid@organization.ae"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={profileData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+971 50 123 4567"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                    <Input
                      id="linkedIn"
                      value={profileData.linkedIn}
                      onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                      placeholder="https://linkedin.com/in/your-profile"
                    />
                  </div>
                  <div>
                    <Label htmlFor="professionalId">Professional ID</Label>
                    <Input
                      id="professionalId"
                      value={profileData.professionalId}
                      onChange={(e) => handleInputChange('professionalId', e.target.value)}
                      placeholder="Assessment Professional License #"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Professional Background</CardTitle>
                <CardDescription>
                  Your current organization and professional experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="organization">Organization *</Label>
                  <Input
                    id="organization"
                    value={profileData.organization}
                    onChange={(e) => handleInputChange('organization', e.target.value)}
                    placeholder="UAE Ministry of Human Resources / Assessment Company"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="department">Department/Division</Label>
                    <Input
                      id="department"
                      value={profileData.department}
                      onChange={(e) => handleInputChange('department', e.target.value)}
                      placeholder="Assessment & Evaluation"
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      value={profileData.position}
                      onChange={(e) => handleInputChange('position', e.target.value)}
                      placeholder="Senior Assessment Specialist"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="yearsOfExperience">Years of Experience *</Label>
                    <Select 
                      value={profileData.yearsOfExperience} 
                      onValueChange={(value) => handleInputChange('yearsOfExperience', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-15">11-15 years</SelectItem>
                        <SelectItem value="16-20">16-20 years</SelectItem>
                        <SelectItem value="20+">20+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="assessmentExperience">Assessment Experience</Label>
                    <Select 
                      value={profileData.assessmentExperience} 
                      onValueChange={(value) => handleInputChange('assessmentExperience', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select assessment experience" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-2">1-2 years</SelectItem>
                        <SelectItem value="3-5">3-5 years</SelectItem>
                        <SelectItem value="6-10">6-10 years</SelectItem>
                        <SelectItem value="11-15">11-15 years</SelectItem>
                        <SelectItem value="15+">15+ years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Certifications Tab */}
        <TabsContent value="certifications">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Professional Certifications
                </CardTitle>
                <CardDescription>
                  Your assessment-related certifications and credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Certifications & Credentials</Label>
                  <Button onClick={addCertification} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Certification
                  </Button>
                </div>
                
                {profileData.certifications.map((cert, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Certification Name</Label>
                        <Input
                          value={cert.name}
                          onChange={(e) => updateCertification(index, 'name', e.target.value)}
                          placeholder="Certified Assessment Professional"
                        />
                      </div>
                      <div>
                        <Label>Issuing Organization</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          placeholder="International Assessment Institute"
                        />
                      </div>
                      <div>
                        <Label>Year Obtained</Label>
                        <Input
                          value={cert.year}
                          onChange={(e) => updateCertification(index, 'year', e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <Label>Expiry Year (Optional)</Label>
                        <Input
                          value={cert.expiryYear || ''}
                          onChange={(e) => updateCertification(index, 'expiryYear', e.target.value)}
                          placeholder="2026"
                        />
                      </div>
                      <div>
                        <Label>Credential ID</Label>
                        <Input
                          value={cert.credentialId || ''}
                          onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                          placeholder="CAP-2023-001234"
                        />
                      </div>
                      <div>
                        <Label>Level</Label>
                        <Select 
                          value={cert.level} 
                          onValueChange={(value) => updateCertification(index, 'level', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="foundation">Foundation</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                            <SelectItem value="expert">Expert</SelectItem>
                            <SelectItem value="master">Master</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={() => removeCertification(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Continuing Education
                </CardTitle>
                <CardDescription>
                  Professional development courses and training
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Professional Development</Label>
                  <Button onClick={addContinuingEducation} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Course
                  </Button>
                </div>
                
                {profileData.continuingEducation.map((edu, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Course/Training Name</Label>
                        <Input
                          value={edu.course}
                          onChange={(e) => updateContinuingEducation(index, 'course', e.target.value)}
                          placeholder="Advanced Psychometric Analysis"
                        />
                      </div>
                      <div>
                        <Label>Training Provider</Label>
                        <Input
                          value={edu.provider}
                          onChange={(e) => updateContinuingEducation(index, 'provider', e.target.value)}
                          placeholder="Assessment Training Institute"
                        />
                      </div>
                      <div>
                        <Label>Year Completed</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateContinuingEducation(index, 'year', e.target.value)}
                          placeholder="2023"
                        />
                      </div>
                      <div>
                        <Label>Training Hours</Label>
                        <Input
                          value={edu.hours}
                          onChange={(e) => updateContinuingEducation(index, 'hours', e.target.value)}
                          placeholder="40"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={() => removeContinuingEducation(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}

                <div>
                  <Label>Professional Memberships</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add professional membership..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('professionalMemberships', newItem);
                          setNewItem('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('professionalMemberships', newItem);
                        setNewItem('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.professionalMemberships.map(membership => (
                      <Badge key={membership} variant="secondary" className="flex items-center gap-1">
                        {membership}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFromArray('professionalMemberships', membership)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Specializations Tab */}
        <TabsContent value="specializations">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ClipboardCheck className="h-5 w-5" />
                  Assessment Specializations
                </CardTitle>
                <CardDescription>
                  Your areas of expertise in assessment and evaluation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assessment Types</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {assessmentTypeOptions.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={type}
                          checked={profileData.assessmentTypes.includes(type)}
                          onChange={() => handleArrayToggle('assessmentTypes', type)}
                          className="rounded"
                        />
                        <Label htmlFor={type} className="text-sm">{type}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Subject Areas</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {subjectAreaOptions.map(area => (
                      <div key={area} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={area}
                          checked={profileData.subjectAreas.includes(area)}
                          onChange={() => handleArrayToggle('subjectAreas', area)}
                          className="rounded"
                        />
                        <Label htmlFor={area} className="text-sm">{area}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Skill Domains</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {skillDomainOptions.map(domain => (
                      <div key={domain} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={domain}
                          checked={profileData.skillDomains.includes(domain)}
                          onChange={() => handleArrayToggle('skillDomains', domain)}
                          className="rounded"
                        />
                        <Label htmlFor={domain} className="text-sm">{domain}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Assessment Levels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {assessmentLevelOptions.map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={level}
                          checked={profileData.assessmentLevels.includes(level)}
                          onChange={() => handleArrayToggle('assessmentLevels', level)}
                          className="rounded"
                        />
                        <Label htmlFor={level} className="text-sm">{level}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Languages</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add language..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('languages', newItem);
                          setNewItem('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('languages', newItem);
                        setNewItem('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.languages.map(lang => (
                      <Badge key={lang} variant="secondary" className="flex items-center gap-1">
                        {lang}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFromArray('languages', lang)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Methodology Tab */}
        <TabsContent value="methodology">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Assessment Methodologies
                </CardTitle>
                <CardDescription>
                  Your preferred assessment methods and approaches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Assessment Methodologies</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {methodologyOptions.map(method => (
                      <div key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={method}
                          checked={profileData.methodologies.includes(method)}
                          onChange={() => handleArrayToggle('methodologies', method)}
                          className="rounded"
                        />
                        <Label htmlFor={method} className="text-sm">{method}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Assessment Tools & Platforms</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {assessmentToolOptions.map(tool => (
                      <div key={tool} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={tool}
                          checked={profileData.assessmentTools.includes(tool)}
                          onChange={() => handleArrayToggle('assessmentTools', tool)}
                          className="rounded"
                        />
                        <Label htmlFor={tool} className="text-sm">{tool}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Evaluation Frameworks</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add evaluation framework..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('evaluationFrameworks', newItem);
                          setNewItem('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('evaluationFrameworks', newItem);
                        setNewItem('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.evaluationFrameworks.map(framework => (
                      <Badge key={framework} variant="secondary" className="flex items-center gap-1">
                        {framework}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFromArray('evaluationFrameworks', framework)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Assessment Preferences</CardTitle>
                <CardDescription>
                  Your preferred assessment settings and accommodations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDuration">Preferred Assessment Duration</Label>
                    <Select 
                      value={profileData.preferredAssessmentDuration} 
                      onValueChange={(value) => handleInputChange('preferredAssessmentDuration', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30min">30 minutes</SelectItem>
                        <SelectItem value="1hour">1 hour</SelectItem>
                        <SelectItem value="2hours">2 hours</SelectItem>
                        <SelectItem value="3hours">3 hours</SelectItem>
                        <SelectItem value="halfday">Half day</SelectItem>
                        <SelectItem value="fullday">Full day</SelectItem>
                        <SelectItem value="flexible">Flexible</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="maxCandidates">Max Candidates Per Session</Label>
                    <Select 
                      value={profileData.maxCandidatesPerSession} 
                      onValueChange={(value) => handleInputChange('maxCandidatesPerSession', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select capacity" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 candidate</SelectItem>
                        <SelectItem value="2-5">2-5 candidates</SelectItem>
                        <SelectItem value="6-10">6-10 candidates</SelectItem>
                        <SelectItem value="11-20">11-20 candidates</SelectItem>
                        <SelectItem value="21-50">21-50 candidates</SelectItem>
                        <SelectItem value="50+">50+ candidates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Assessment Environment</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {['In-person', 'Virtual/Online', 'Hybrid', 'Controlled Environment', 'Workplace Setting', 'Home/Remote'].map(env => (
                      <div key={env} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={env}
                          checked={profileData.assessmentEnvironment.includes(env)}
                          onChange={() => handleArrayToggle('assessmentEnvironment', env)}
                          className="rounded"
                        />
                        <Label htmlFor={env} className="text-sm">{env}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Accommodation Support</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {accommodationOptions.map(accommodation => (
                      <div key={accommodation} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={accommodation}
                          checked={profileData.accommodationSupport.includes(accommodation)}
                          onChange={() => handleArrayToggle('accommodationSupport', accommodation)}
                          className="rounded"
                        />
                        <Label htmlFor={accommodation} className="text-sm">{accommodation}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Quality Assurance Tab */}
        <TabsContent value="quality">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart className="h-5 w-5" />
                  Quality Assurance
                </CardTitle>
                <CardDescription>
                  Your quality standards and assurance processes
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Quality Standards</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {qualityStandardOptions.map(standard => (
                      <div key={standard} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={standard}
                          checked={profileData.qualityStandards.includes(standard)}
                          onChange={() => handleArrayToggle('qualityStandards', standard)}
                          className="rounded"
                        />
                        <Label htmlFor={standard} className="text-sm">{standard}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label htmlFor="calibrationFrequency">Calibration Frequency</Label>
                  <Select 
                    value={profileData.calibrationFrequency} 
                    onValueChange={(value) => handleInputChange('calibrationFrequency', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="biannually">Bi-annually</SelectItem>
                      <SelectItem value="annually">Annually</SelectItem>
                      <SelectItem value="as-needed">As needed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Accuracy Targets</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
                    <div>
                      <Label htmlFor="reliability">Reliability (%)</Label>
                      <Input
                        id="reliability"
                        value={profileData.accuracyTargets.reliability}
                        onChange={(e) => handleNestedChange('accuracyTargets', 'reliability', e.target.value)}
                        placeholder="95"
                      />
                    </div>
                    <div>
                      <Label htmlFor="validity">Validity (%)</Label>
                      <Input
                        id="validity"
                        value={profileData.accuracyTargets.validity}
                        onChange={(e) => handleNestedChange('accuracyTargets', 'validity', e.target.value)}
                        placeholder="90"
                      />
                    </div>
                    <div>
                      <Label htmlFor="consistency">Consistency (%)</Label>
                      <Input
                        id="consistency"
                        value={profileData.accuracyTargets.consistency}
                        onChange={(e) => handleNestedChange('accuracyTargets', 'consistency', e.target.value)}
                        placeholder="92"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Communication & Collaboration</CardTitle>
                <CardDescription>
                  Your approach to feedback and collaboration
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="collaborationStyle">Collaboration Style</Label>
                  <Select 
                    value={profileData.collaborationStyle} 
                    onValueChange={(value) => handleInputChange('collaborationStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="independent">Independent - Work autonomously</SelectItem>
                      <SelectItem value="collaborative">Collaborative - Team-based approach</SelectItem>
                      <SelectItem value="consultative">Consultative - Seek input from others</SelectItem>
                      <SelectItem value="directive">Directive - Lead assessment processes</SelectItem>
                      <SelectItem value="adaptive">Adaptive - Flexible based on needs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="feedbackApproach">Feedback Approach</Label>
                  <Select 
                    value={profileData.feedbackApproach} 
                    onValueChange={(value) => handleInputChange('feedbackApproach', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select approach" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="detailed">Detailed - Comprehensive feedback</SelectItem>
                      <SelectItem value="concise">Concise - Key points only</SelectItem>
                      <SelectItem value="developmental">Developmental - Growth-focused</SelectItem>
                      <SelectItem value="objective">Objective - Data-driven</SelectItem>
                      <SelectItem value="balanced">Balanced - Strengths and areas for improvement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="reportingStyle">Reporting Style</Label>
                  <Select 
                    value={profileData.reportingStyle} 
                    onValueChange={(value) => handleInputChange('reportingStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="executive">Executive Summary</SelectItem>
                      <SelectItem value="detailed">Detailed Analysis</SelectItem>
                      <SelectItem value="visual">Visual/Graphical</SelectItem>
                      <SelectItem value="narrative">Narrative Format</SelectItem>
                      <SelectItem value="structured">Structured/Template-based</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
            {/* Schedule Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Schedule & Availability
                </CardTitle>
                <CardDescription>
                  Set your working hours and availability preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="timeZone">Time Zone</Label>
                  <Select 
                    value={profileData.timeZone} 
                    onValueChange={(value) => handleInputChange('timeZone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Asia/Dubai">Asia/Dubai (GST)</SelectItem>
                      <SelectItem value="Asia/Riyadh">Asia/Riyadh (AST)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="availabilityType">Availability Type</Label>
                  <Select 
                    value={profileData.availabilityType} 
                    onValueChange={(value) => handleInputChange('availabilityType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select availability" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract basis</SelectItem>
                      <SelectItem value="project">Project-based</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Working Hours</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="workStart">Start Time</Label>
                      <Input
                        id="workStart"
                        type="time"
                        value={profileData.workingHours.start}
                        onChange={(e) => handleNestedChange('workingHours', 'start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="workEnd">End Time</Label>
                      <Input
                        id="workEnd"
                        type="time"
                        value={profileData.workingHours.end}
                        onChange={(e) => handleNestedChange('workingHours', 'end', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label>Working Days</Label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`work-${day}`}
                            checked={profileData.workingHours.days.includes(day)}
                            onChange={() => {
                              const newDays = profileData.workingHours.days.includes(day)
                                ? profileData.workingHours.days.filter(d => d !== day)
                                : [...profileData.workingHours.days, day];
                              handleNestedChange('workingHours', 'days', newDays);
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`work-${day}`} className="text-sm">{day.slice(0, 3)}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose what notifications you want to receive
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(profileData.notifications).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <Label className="capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                      <p className="text-sm text-gray-500">
                        {key === 'newAssessments' && 'New assessment assignments'}
                        {key === 'candidateUpdates' && 'Updates on candidate progress'}
                        {key === 'deadlineReminders' && 'Assessment deadline reminders'}
                        {key === 'qualityAlerts' && 'Quality assurance alerts'}
                        {key === 'systemUpdates' && 'Platform system updates'}
                        {key === 'professionalUpdates' && 'Professional development opportunities'}
                      </p>
                    </div>
                    <Switch
                      checked={value}
                      onCheckedChange={(checked) => 
                        handleNestedChange('notifications', key, checked)
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control who can see your profile and assessment information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="profileVisibility">Profile Visibility</Label>
                  <Select 
                    value={profileData.profileVisibility} 
                    onValueChange={(value) => handleInputChange('profileVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to all users</SelectItem>
                      <SelectItem value="professional">Professional Network</SelectItem>
                      <SelectItem value="organization">Organization Only</SelectItem>
                      <SelectItem value="private">Private - Hidden from search</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contactVisibility">Contact Information Visibility</Label>
                  <Select 
                    value={profileData.contactVisibility} 
                    onValueChange={(value) => handleInputChange('contactVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to all</SelectItem>
                      <SelectItem value="verified">Verified Users Only</SelectItem>
                      <SelectItem value="organization">Organization Only</SelectItem>
                      <SelectItem value="private">Private - Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="assessmentHistoryVisibility">Assessment History Visibility</Label>
                  <Select 
                    value={profileData.assessmentHistoryVisibility} 
                    onValueChange={(value) => handleInputChange('assessmentHistoryVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to all</SelectItem>
                      <SelectItem value="professional">Professional Network</SelectItem>
                      <SelectItem value="organization">Organization Only</SelectItem>
                      <SelectItem value="private">Private - Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave} 
          disabled={isSaving}
          className="min-w-[120px]"
        >
          {isSaving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Profile
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default AssessorProfileForm;
