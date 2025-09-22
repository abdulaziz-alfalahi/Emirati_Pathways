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
  GraduationCap, 
  BookOpen, 
  Users, 
  Award,
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
  School,
  FileText,
  Globe,
  Video,
  Presentation
} from 'lucide-react';

interface EducatorProfileData {
  // Personal Information
  firstName: string;
  lastName: string;
  title: string;
  email: string;
  phone: string;
  linkedIn: string;
  orcid: string;
  
  // Institution Information
  institutionName: string;
  institutionType: string;
  department: string;
  position: string;
  employmentType: string;
  yearsAtInstitution: string;
  
  // Educational Background
  education: Array<{
    degree: string;
    field: string;
    institution: string;
    year: string;
    gpa?: string;
  }>;
  
  // Certifications & Licenses
  certifications: Array<{
    name: string;
    issuer: string;
    year: string;
    expiryYear?: string;
    credentialId?: string;
  }>;
  
  // Teaching Specializations
  subjectAreas: string[];
  teachingLevels: string[];
  languages: string[];
  specializations: string[];
  
  // Teaching Preferences
  preferredClassSize: string;
  teachingMethods: string[];
  assessmentMethods: string[];
  technologyTools: string[];
  
  // Curriculum Development
  curriculumExperience: string[];
  industryConnections: string[];
  researchAreas: string[];
  publications: Array<{
    title: string;
    type: string;
    year: string;
    journal?: string;
    doi?: string;
  }>;
  
  // Professional Development
  professionalMemberships: string[];
  conferences: Array<{
    name: string;
    year: string;
    role: string;
  }>;
  workshops: string[];
  
  // Student Engagement
  mentorshipStyle: string;
  studentSupportServices: string[];
  extracurricularActivities: string[];
  
  // Availability & Schedule
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  officeHours: {
    start: string;
    end: string;
    days: string[];
  };
  timeZone: string;
  
  // Notification Settings
  notifications: {
    studentMessages: boolean;
    assignmentSubmissions: boolean;
    gradeReminders: boolean;
    meetingReminders: boolean;
    institutionUpdates: boolean;
    professionalUpdates: boolean;
  };
  
  // Privacy Settings
  profileVisibility: string;
  contactVisibility: string;
  researchVisibility: string;
}

interface EducatorProfileFormProps {
  onProfileUpdate?: () => void;
  initialData?: Partial<EducatorProfileData>;
}

const EducatorProfileForm: React.FC<EducatorProfileFormProps> = ({ 
  onProfileUpdate,
  initialData 
}) => {
  const [profileData, setProfileData] = useState<EducatorProfileData>({
    firstName: '',
    lastName: '',
    title: '',
    email: '',
    phone: '',
    linkedIn: '',
    orcid: '',
    institutionName: '',
    institutionType: '',
    department: '',
    position: '',
    employmentType: '',
    yearsAtInstitution: '',
    education: [],
    certifications: [],
    subjectAreas: [],
    teachingLevels: [],
    languages: [],
    specializations: [],
    preferredClassSize: '',
    teachingMethods: [],
    assessmentMethods: [],
    technologyTools: [],
    curriculumExperience: [],
    industryConnections: [],
    researchAreas: [],
    publications: [],
    professionalMemberships: [],
    conferences: [],
    workshops: [],
    mentorshipStyle: '',
    studentSupportServices: [],
    extracurricularActivities: [],
    workingHours: {
      start: '08:00',
      end: '16:00',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    },
    officeHours: {
      start: '10:00',
      end: '14:00',
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday']
    },
    timeZone: 'Asia/Dubai',
    notifications: {
      studentMessages: true,
      assignmentSubmissions: true,
      gradeReminders: true,
      meetingReminders: true,
      institutionUpdates: true,
      professionalUpdates: false
    },
    profileVisibility: 'public',
    contactVisibility: 'students',
    researchVisibility: 'public',
    ...initialData
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newItem, setNewItem] = useState('');

  const institutionTypes = [
    'University',
    'College',
    'Technical Institute',
    'Vocational School',
    'Training Center',
    'Research Institute',
    'Government Institution',
    'Private Institution',
    'International School',
    'K-12 School',
    'Online Institution'
  ];

  const employmentTypes = [
    'Full-time Faculty',
    'Part-time Faculty',
    'Adjunct Professor',
    'Visiting Professor',
    'Research Professor',
    'Clinical Faculty',
    'Lecturer',
    'Teaching Assistant',
    'Instructor',
    'Department Head',
    'Dean',
    'Administrator'
  ];

  const teachingLevels = [
    'Elementary',
    'Middle School',
    'High School',
    'Foundation/Preparatory',
    'Undergraduate',
    'Graduate',
    'Postgraduate',
    'Doctoral',
    'Professional Development',
    'Executive Education',
    'Continuing Education'
  ];

  const subjectAreaOptions = [
    'Engineering',
    'Computer Science',
    'Information Technology',
    'Business Administration',
    'Finance',
    'Marketing',
    'Economics',
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Medicine',
    'Nursing',
    'Education',
    'Psychology',
    'Sociology',
    'Political Science',
    'Law',
    'Literature',
    'Languages',
    'History',
    'Art & Design',
    'Architecture',
    'Environmental Science',
    'Agriculture',
    'Other'
  ];

  const teachingMethodOptions = [
    'Lecture-based',
    'Interactive Learning',
    'Problem-based Learning',
    'Case Study Method',
    'Flipped Classroom',
    'Blended Learning',
    'Online Learning',
    'Hands-on Workshops',
    'Group Projects',
    'Peer Learning',
    'Simulation & Role Play',
    'Field Trips',
    'Guest Speakers',
    'Research Projects',
    'Internships'
  ];

  const assessmentMethodOptions = [
    'Written Exams',
    'Oral Exams',
    'Practical Exams',
    'Project-based Assessment',
    'Portfolio Assessment',
    'Peer Assessment',
    'Self Assessment',
    'Continuous Assessment',
    'Formative Assessment',
    'Summative Assessment',
    'Competency-based Assessment',
    'Performance Assessment',
    'Presentation Assessment',
    'Research Papers',
    'Case Study Analysis'
  ];

  const technologyToolOptions = [
    'Learning Management Systems (LMS)',
    'Video Conferencing (Zoom, Teams)',
    'Interactive Whiteboards',
    'Educational Apps',
    'Virtual Reality (VR)',
    'Augmented Reality (AR)',
    'Simulation Software',
    'Online Assessment Tools',
    'Collaboration Platforms',
    'Digital Portfolios',
    'Multimedia Presentations',
    'Educational Games',
    'AI-powered Tools',
    'Data Analytics Tools',
    'Mobile Learning Apps'
  ];

  const studentSupportOptions = [
    'Academic Advising',
    'Career Counseling',
    'Tutoring Services',
    'Study Groups',
    'Office Hours',
    'Email Support',
    'Online Forums',
    'Peer Mentoring',
    'Learning Disabilities Support',
    'Language Support',
    'Technical Support',
    'Mental Health Resources',
    'Financial Aid Guidance',
    'Internship Placement',
    'Job Placement Assistance'
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
        ...prev[parent as keyof EducatorProfileData],
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setProfileData(prev => {
      const currentArray = prev[field as keyof EducatorProfileData] as string[];
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
    if (value.trim() && !profileData[field as keyof EducatorProfileData]?.includes(value.trim())) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...(prev[field as keyof EducatorProfileData] as string[]), value.trim()]
      }));
    }
  };

  const removeFromArray = (field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: (prev[field as keyof EducatorProfileData] as string[]).filter(item => item !== value)
    }));
  };

  const addEducation = () => {
    setProfileData(prev => ({
      ...prev,
      education: [...prev.education, {
        degree: '',
        field: '',
        institution: '',
        year: '',
        gpa: ''
      }]
    }));
  };

  const updateEducation = (index: number, field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.map((edu, i) => 
        i === index ? { ...edu, [field]: value } : edu
      )
    }));
  };

  const removeEducation = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      education: prev.education.filter((_, i) => i !== index)
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
        credentialId: ''
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

  const addPublication = () => {
    setProfileData(prev => ({
      ...prev,
      publications: [...prev.publications, {
        title: '',
        type: '',
        year: '',
        journal: '',
        doi: ''
      }]
    }));
  };

  const updatePublication = (index: number, field: string, value: string) => {
    setProfileData(prev => ({
      ...prev,
      publications: prev.publications.map((pub, i) => 
        i === index ? { ...pub, [field]: value } : pub
      )
    }));
  };

  const removePublication = (index: number) => {
    setProfileData(prev => ({
      ...prev,
      publications: prev.publications.filter((_, i) => i !== index)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Saving educator profile data:', profileData);
      
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
      'firstName', 'lastName', 'title', 'email', 'institutionName', 
      'department', 'position'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profileData[field as keyof EducatorProfileData]
    ).length;
    
    const hasEducation = profileData.education.length > 0;
    const hasSubjects = profileData.subjectAreas.length > 0;
    
    return Math.round(((completedFields + (hasEducation ? 1 : 0) + (hasSubjects ? 1 : 0)) / (requiredFields.length + 2)) * 100);
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
            Complete your educator profile to connect with students and institutions
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
          <TabsTrigger value="institution">Institution</TabsTrigger>
          <TabsTrigger value="education">Education</TabsTrigger>
          <TabsTrigger value="teaching">Teaching</TabsTrigger>
          <TabsTrigger value="research">Research</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Personal Information Tab */}
        <TabsContent value="personal">
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
                    placeholder="Dr. Fatima"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Al Zahra"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="title">Professional Title *</Label>
                <Input
                  id="title"
                  value={profileData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Professor of Computer Science / Associate Professor of Engineering"
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
                    placeholder="fatima.alzahra@university.ae"
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
                  <Label htmlFor="orcid">ORCID ID</Label>
                  <Input
                    id="orcid"
                    value={profileData.orcid}
                    onChange={(e) => handleInputChange('orcid', e.target.value)}
                    placeholder="0000-0000-0000-0000"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Institution Information Tab */}
        <TabsContent value="institution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Institution Information
              </CardTitle>
              <CardDescription>
                Details about your current institution and position
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="institutionName">Institution Name *</Label>
                <Input
                  id="institutionName"
                  value={profileData.institutionName}
                  onChange={(e) => handleInputChange('institutionName', e.target.value)}
                  placeholder="American University of Sharjah"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="institutionType">Institution Type</Label>
                  <Select 
                    value={profileData.institutionType} 
                    onValueChange={(value) => handleInputChange('institutionType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {institutionTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="department">Department/Faculty *</Label>
                  <Input
                    id="department"
                    value={profileData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    placeholder="Computer Science & Engineering"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="position">Position *</Label>
                  <Select 
                    value={profileData.employmentType} 
                    onValueChange={(value) => handleInputChange('employmentType', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      {employmentTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="position">Job Title</Label>
                  <Input
                    id="position"
                    value={profileData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    placeholder="Associate Professor"
                  />
                </div>
                <div>
                  <Label htmlFor="yearsAtInstitution">Years at Institution</Label>
                  <Input
                    id="yearsAtInstitution"
                    value={profileData.yearsAtInstitution}
                    onChange={(e) => handleInputChange('yearsAtInstitution', e.target.value)}
                    placeholder="5"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Education & Certifications Tab */}
        <TabsContent value="education">
          <div className="space-y-6">
            {/* Educational Background */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Educational Background
                </CardTitle>
                <CardDescription>
                  Your academic qualifications and degrees
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Degrees & Qualifications</Label>
                  <Button onClick={addEducation} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Degree
                  </Button>
                </div>
                
                {profileData.education.map((edu, index) => (
                  <Card key={index} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label>Degree</Label>
                        <Input
                          value={edu.degree}
                          onChange={(e) => updateEducation(index, 'degree', e.target.value)}
                          placeholder="Ph.D., Master's, Bachelor's"
                        />
                      </div>
                      <div>
                        <Label>Field of Study</Label>
                        <Input
                          value={edu.field}
                          onChange={(e) => updateEducation(index, 'field', e.target.value)}
                          placeholder="Computer Science"
                        />
                      </div>
                      <div>
                        <Label>Institution</Label>
                        <Input
                          value={edu.institution}
                          onChange={(e) => updateEducation(index, 'institution', e.target.value)}
                          placeholder="MIT, Stanford University"
                        />
                      </div>
                      <div>
                        <Label>Graduation Year</Label>
                        <Input
                          value={edu.year}
                          onChange={(e) => updateEducation(index, 'year', e.target.value)}
                          placeholder="2020"
                        />
                      </div>
                      <div>
                        <Label>GPA (Optional)</Label>
                        <Input
                          value={edu.gpa || ''}
                          onChange={(e) => updateEducation(index, 'gpa', e.target.value)}
                          placeholder="3.8/4.0"
                        />
                      </div>
                      <div className="flex items-end">
                        <Button 
                          onClick={() => removeEducation(index)}
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

            {/* Certifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Professional Certifications
                </CardTitle>
                <CardDescription>
                  Teaching certifications, professional licenses, and credentials
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label>Certifications & Licenses</Label>
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
                          placeholder="Teaching License, PMP, etc."
                        />
                      </div>
                      <div>
                        <Label>Issuing Organization</Label>
                        <Input
                          value={cert.issuer}
                          onChange={(e) => updateCertification(index, 'issuer', e.target.value)}
                          placeholder="Ministry of Education, PMI"
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
                        <Label>Credential ID (Optional)</Label>
                        <Input
                          value={cert.credentialId || ''}
                          onChange={(e) => updateCertification(index, 'credentialId', e.target.value)}
                          placeholder="ABC123456"
                        />
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
          </div>
        </TabsContent>

        {/* Teaching Preferences Tab */}
        <TabsContent value="teaching">
          <div className="space-y-6">
            {/* Teaching Specializations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Teaching Specializations
                </CardTitle>
                <CardDescription>
                  Your areas of expertise and teaching preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
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
                  <Label>Teaching Levels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {teachingLevels.map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={level}
                          checked={profileData.teachingLevels.includes(level)}
                          onChange={() => handleArrayToggle('teachingLevels', level)}
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

            {/* Teaching Methods & Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Presentation className="h-5 w-5" />
                  Teaching Methods & Assessment
                </CardTitle>
                <CardDescription>
                  Your preferred teaching and assessment approaches
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="preferredClassSize">Preferred Class Size</Label>
                  <Select 
                    value={profileData.preferredClassSize} 
                    onValueChange={(value) => handleInputChange('preferredClassSize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class size" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-15 students)</SelectItem>
                      <SelectItem value="medium">Medium (16-30 students)</SelectItem>
                      <SelectItem value="large">Large (31-50 students)</SelectItem>
                      <SelectItem value="very-large">Very Large (50+ students)</SelectItem>
                      <SelectItem value="flexible">Flexible</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Teaching Methods</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {teachingMethodOptions.map(method => (
                      <div key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={method}
                          checked={profileData.teachingMethods.includes(method)}
                          onChange={() => handleArrayToggle('teachingMethods', method)}
                          className="rounded"
                        />
                        <Label htmlFor={method} className="text-sm">{method}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Assessment Methods</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {assessmentMethodOptions.map(method => (
                      <div key={method} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={method}
                          checked={profileData.assessmentMethods.includes(method)}
                          onChange={() => handleArrayToggle('assessmentMethods', method)}
                          className="rounded"
                        />
                        <Label htmlFor={method} className="text-sm">{method}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Technology Tools</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {technologyToolOptions.map(tool => (
                      <div key={tool} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={tool}
                          checked={profileData.technologyTools.includes(tool)}
                          onChange={() => handleArrayToggle('technologyTools', tool)}
                          className="rounded"
                        />
                        <Label htmlFor={tool} className="text-sm">{tool}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Student Support */}
            <Card>
              <CardHeader>
                <CardTitle>Student Support & Mentorship</CardTitle>
                <CardDescription>
                  How you support and engage with students
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="mentorshipStyle">Mentorship Style</Label>
                  <Select 
                    value={profileData.mentorshipStyle} 
                    onValueChange={(value) => handleInputChange('mentorshipStyle', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select mentorship style" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="directive">Directive - Providing clear guidance</SelectItem>
                      <SelectItem value="collaborative">Collaborative - Working together</SelectItem>
                      <SelectItem value="supportive">Supportive - Encouraging independence</SelectItem>
                      <SelectItem value="coaching">Coaching - Asking guiding questions</SelectItem>
                      <SelectItem value="flexible">Flexible - Adapting to student needs</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Student Support Services</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {studentSupportOptions.map(service => (
                      <div key={service} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={service}
                          checked={profileData.studentSupportServices.includes(service)}
                          onChange={() => handleArrayToggle('studentSupportServices', service)}
                          className="rounded"
                        />
                        <Label htmlFor={service} className="text-sm">{service}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Research & Publications Tab */}
        <TabsContent value="research">
          <div className="space-y-6">
            {/* Research Areas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Research & Publications
                </CardTitle>
                <CardDescription>
                  Your research interests and academic publications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Research Areas</Label>
                  <div className="flex gap-2 mb-2">
                    <Input
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      placeholder="Add research area..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addToArray('researchAreas', newItem);
                          setNewItem('');
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        addToArray('researchAreas', newItem);
                        setNewItem('');
                      }}
                      size="sm"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profileData.researchAreas.map(area => (
                      <Badge key={area} variant="secondary" className="flex items-center gap-1">
                        {area}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeFromArray('researchAreas', area)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-4">
                    <Label>Publications</Label>
                    <Button onClick={addPublication} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Publication
                    </Button>
                  </div>
                  
                  {profileData.publications.map((pub, index) => (
                    <Card key={index} className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <Label>Title</Label>
                          <Input
                            value={pub.title}
                            onChange={(e) => updatePublication(index, 'title', e.target.value)}
                            placeholder="Publication title"
                          />
                        </div>
                        <div>
                          <Label>Type</Label>
                          <Select 
                            value={pub.type} 
                            onValueChange={(value) => updatePublication(index, 'type', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="journal">Journal Article</SelectItem>
                              <SelectItem value="conference">Conference Paper</SelectItem>
                              <SelectItem value="book">Book</SelectItem>
                              <SelectItem value="chapter">Book Chapter</SelectItem>
                              <SelectItem value="thesis">Thesis/Dissertation</SelectItem>
                              <SelectItem value="report">Technical Report</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Year</Label>
                          <Input
                            value={pub.year}
                            onChange={(e) => updatePublication(index, 'year', e.target.value)}
                            placeholder="2023"
                          />
                        </div>
                        <div>
                          <Label>Journal/Conference</Label>
                          <Input
                            value={pub.journal || ''}
                            onChange={(e) => updatePublication(index, 'journal', e.target.value)}
                            placeholder="Journal name or conference"
                          />
                        </div>
                        <div>
                          <Label>DOI (Optional)</Label>
                          <Input
                            value={pub.doi || ''}
                            onChange={(e) => updatePublication(index, 'doi', e.target.value)}
                            placeholder="10.1000/xyz123"
                          />
                        </div>
                        <div className="flex items-end">
                          <Button 
                            onClick={() => removePublication(index)}
                            variant="destructive"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
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
                  Set your working hours and availability for students
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

                <div>
                  <Label>Office Hours</Label>
                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <Label htmlFor="officeStart">Start Time</Label>
                      <Input
                        id="officeStart"
                        type="time"
                        value={profileData.officeHours.start}
                        onChange={(e) => handleNestedChange('officeHours', 'start', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="officeEnd">End Time</Label>
                      <Input
                        id="officeEnd"
                        type="time"
                        value={profileData.officeHours.end}
                        onChange={(e) => handleNestedChange('officeHours', 'end', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <Label>Office Hours Days</Label>
                    <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map(day => (
                        <div key={day} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`office-${day}`}
                            checked={profileData.officeHours.days.includes(day)}
                            onChange={() => {
                              const newDays = profileData.officeHours.days.includes(day)
                                ? profileData.officeHours.days.filter(d => d !== day)
                                : [...profileData.officeHours.days, day];
                              handleNestedChange('officeHours', 'days', newDays);
                            }}
                            className="rounded"
                          />
                          <Label htmlFor={`office-${day}`} className="text-sm">{day.slice(0, 3)}</Label>
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
                        {key === 'studentMessages' && 'Messages from students'}
                        {key === 'assignmentSubmissions' && 'Assignment and project submissions'}
                        {key === 'gradeReminders' && 'Reminders to grade assignments'}
                        {key === 'meetingReminders' && 'Upcoming meetings and appointments'}
                        {key === 'institutionUpdates' && 'Updates from your institution'}
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
                  Control who can see your profile and information
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
                      <SelectItem value="institution">Institution Only</SelectItem>
                      <SelectItem value="students">Students & Colleagues</SelectItem>
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
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="colleagues">Colleagues Only</SelectItem>
                      <SelectItem value="private">Private - Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="researchVisibility">Research & Publications Visibility</Label>
                  <Select 
                    value={profileData.researchVisibility} 
                    onValueChange={(value) => handleInputChange('researchVisibility', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public - Visible to all</SelectItem>
                      <SelectItem value="academic">Academic Community</SelectItem>
                      <SelectItem value="institution">Institution Only</SelectItem>
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

export default EducatorProfileForm;
