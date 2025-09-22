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
  Building2, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Calendar,
  Clock,
  Target,
  Filter,
  Bell,
  Shield,
  Save,
  Plus,
  X,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface HRProfileData {
  // Personal Information
  firstName: string;
  lastName: string;
  jobTitle: string;
  email: string;
  phone: string;
  linkedIn: string;
  
  // Company Information
  companyName: string;
  companySize: string;
  industry: string;
  companyWebsite: string;
  companyDescription: string;
  companyLocation: string;
  companyLogo?: string;
  
  // Hiring Preferences
  hiringVolume: string;
  preferredCandidateLevel: string[];
  preferredSkills: string[];
  workArrangements: string[];
  salaryRanges: {
    junior: { min: number; max: number };
    mid: { min: number; max: number };
    senior: { min: number; max: number };
  };
  
  // Workflow Settings
  interviewProcess: string[];
  assessmentTools: string[];
  communicationPreferences: string[];
  timeZone: string;
  workingHours: {
    start: string;
    end: string;
    days: string[];
  };
  
  // Notification Settings
  notifications: {
    newApplications: boolean;
    candidateUpdates: boolean;
    interviewReminders: boolean;
    teamUpdates: boolean;
    weeklyReports: boolean;
  };
  
  // Privacy Settings
  profileVisibility: string;
  contactVisibility: string;
  companyInfoPublic: boolean;
}

interface HRProfileFormProps {
  onProfileUpdate?: () => void;
  initialData?: Partial<HRProfileData>;
}

const HRProfileForm: React.FC<HRProfileFormProps> = ({ 
  onProfileUpdate,
  initialData 
}) => {
  const [profileData, setProfileData] = useState<HRProfileData>({
    firstName: '',
    lastName: '',
    jobTitle: '',
    email: '',
    phone: '',
    linkedIn: '',
    companyName: '',
    companySize: '',
    industry: '',
    companyWebsite: '',
    companyDescription: '',
    companyLocation: '',
    hiringVolume: '',
    preferredCandidateLevel: [],
    preferredSkills: [],
    workArrangements: [],
    salaryRanges: {
      junior: { min: 3000, max: 8000 },
      mid: { min: 8000, max: 15000 },
      senior: { min: 15000, max: 30000 }
    },
    interviewProcess: [],
    assessmentTools: [],
    communicationPreferences: [],
    timeZone: 'Asia/Dubai',
    workingHours: {
      start: '09:00',
      end: '17:00',
      days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    notifications: {
      newApplications: true,
      candidateUpdates: true,
      interviewReminders: true,
      teamUpdates: false,
      weeklyReports: true
    },
    profileVisibility: 'public',
    contactVisibility: 'verified',
    companyInfoPublic: true,
    ...initialData
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [newSkill, setNewSkill] = useState('');

  const companySizes = [
    'Startup (1-10 employees)',
    'Small (11-50 employees)',
    'Medium (51-200 employees)',
    'Large (201-1000 employees)',
    'Enterprise (1000+ employees)'
  ];

  const industries = [
    'Technology',
    'Finance & Banking',
    'Healthcare',
    'Education',
    'Government',
    'Oil & Gas',
    'Construction',
    'Tourism & Hospitality',
    'Retail',
    'Manufacturing',
    'Real Estate',
    'Transportation',
    'Other'
  ];

  const candidateLevels = [
    'Fresh Graduate',
    'Junior (1-3 years)',
    'Mid-level (3-7 years)',
    'Senior (7-12 years)',
    'Lead/Manager (10+ years)',
    'Executive (15+ years)'
  ];

  const workArrangementOptions = [
    'On-site',
    'Remote',
    'Hybrid',
    'Flexible hours',
    'Part-time',
    'Contract',
    'Internship'
  ];

  const interviewProcessOptions = [
    'Phone/Video Screening',
    'Technical Assessment',
    'HR Interview',
    'Manager Interview',
    'Team Interview',
    'Panel Interview',
    'Case Study',
    'Presentation',
    'Reference Check'
  ];

  const assessmentToolOptions = [
    'Technical Coding Test',
    'Personality Assessment',
    'Skills Evaluation',
    'Language Proficiency',
    'Cultural Fit Assessment',
    'Portfolio Review',
    'Work Sample',
    'Simulation Exercise'
  ];

  const communicationOptions = [
    'Email',
    'WhatsApp',
    'LinkedIn',
    'Phone Call',
    'Video Call',
    'In-person Meeting',
    'Platform Messaging'
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
        ...prev[parent as keyof HRProfileData],
        [field]: value
      }
    }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    setProfileData(prev => {
      const currentArray = prev[field as keyof HRProfileData] as string[];
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value];
      
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  const addSkill = () => {
    if (newSkill.trim() && !profileData.preferredSkills.includes(newSkill.trim())) {
      setProfileData(prev => ({
        ...prev,
        preferredSkills: [...prev.preferredSkills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skill: string) => {
    setProfileData(prev => ({
      ...prev,
      preferredSkills: prev.preferredSkills.filter(s => s !== skill)
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveStatus('idle');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Here you would make the actual API call
      console.log('Saving HR profile data:', profileData);
      
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
      'firstName', 'lastName', 'jobTitle', 'email', 'phone',
      'companyName', 'companySize', 'industry', 'companyLocation'
    ];
    
    const completedFields = requiredFields.filter(field => 
      profileData[field as keyof HRProfileData]
    ).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
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
            Complete your profile to attract the best candidates
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
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="company">Company</TabsTrigger>
          <TabsTrigger value="hiring">Hiring</TabsTrigger>
          <TabsTrigger value="workflow">Workflow</TabsTrigger>
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
                    placeholder="Ahmed"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={profileData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Al Mansouri"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="jobTitle">Job Title *</Label>
                <Input
                  id="jobTitle"
                  value={profileData.jobTitle}
                  onChange={(e) => handleInputChange('jobTitle', e.target.value)}
                  placeholder="HR Manager / Talent Acquisition Specialist"
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
                    placeholder="ahmed@company.ae"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={profileData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+971 50 123 4567"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="linkedIn">LinkedIn Profile</Label>
                <Input
                  id="linkedIn"
                  value={profileData.linkedIn}
                  onChange={(e) => handleInputChange('linkedIn', e.target.value)}
                  placeholder="https://linkedin.com/in/your-profile"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Company Information Tab */}
        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Company Information
              </CardTitle>
              <CardDescription>
                Details about your organization and workplace
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="companyName">Company Name *</Label>
                <Input
                  id="companyName"
                  value={profileData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  placeholder="Emirates Technology Solutions"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companySize">Company Size *</Label>
                  <Select 
                    value={profileData.companySize} 
                    onValueChange={(value) => handleInputChange('companySize', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select company size" />
                    </SelectTrigger>
                    <SelectContent>
                      {companySizes.map(size => (
                        <SelectItem key={size} value={size}>{size}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="industry">Industry *</Label>
                  <Select 
                    value={profileData.industry} 
                    onValueChange={(value) => handleInputChange('industry', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industries.map(industry => (
                        <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <Input
                    id="companyWebsite"
                    value={profileData.companyWebsite}
                    onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                    placeholder="https://company.ae"
                  />
                </div>
                <div>
                  <Label htmlFor="companyLocation">Location *</Label>
                  <Input
                    id="companyLocation"
                    value={profileData.companyLocation}
                    onChange={(e) => handleInputChange('companyLocation', e.target.value)}
                    placeholder="Dubai, UAE"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="companyDescription">Company Description</Label>
                <Textarea
                  id="companyDescription"
                  value={profileData.companyDescription}
                  onChange={(e) => handleInputChange('companyDescription', e.target.value)}
                  placeholder="Brief description of your company, culture, and values..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Hiring Preferences Tab */}
        <TabsContent value="hiring">
          <div className="space-y-6">
            {/* Hiring Volume & Candidate Levels */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Hiring Preferences
                </CardTitle>
                <CardDescription>
                  Define your typical hiring needs and candidate preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hiringVolume">Typical Hiring Volume</Label>
                  <Select 
                    value={profileData.hiringVolume} 
                    onValueChange={(value) => handleInputChange('hiringVolume', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hiring volume" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-5">1-5 hires per month</SelectItem>
                      <SelectItem value="6-15">6-15 hires per month</SelectItem>
                      <SelectItem value="16-30">16-30 hires per month</SelectItem>
                      <SelectItem value="30+">30+ hires per month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Preferred Candidate Levels</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                    {candidateLevels.map(level => (
                      <div key={level} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={level}
                          checked={profileData.preferredCandidateLevel.includes(level)}
                          onChange={() => handleArrayToggle('preferredCandidateLevel', level)}
                          className="rounded"
                        />
                        <Label htmlFor={level} className="text-sm">{level}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Work Arrangements</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {workArrangementOptions.map(arrangement => (
                      <div key={arrangement} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={arrangement}
                          checked={profileData.workArrangements.includes(arrangement)}
                          onChange={() => handleArrayToggle('workArrangements', arrangement)}
                          className="rounded"
                        />
                        <Label htmlFor={arrangement} className="text-sm">{arrangement}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Preferred Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Preferred Skills</CardTitle>
                <CardDescription>
                  Add skills you commonly look for in candidates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add a skill..."
                    onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                  />
                  <Button onClick={addSkill} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {profileData.preferredSkills.map(skill => (
                    <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                      {skill}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Salary Ranges */}
            <Card>
              <CardHeader>
                <CardTitle>Typical Salary Ranges (AED)</CardTitle>
                <CardDescription>
                  Set typical salary ranges for different experience levels
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(profileData.salaryRanges).map(([level, range]) => (
                  <div key={level} className="grid grid-cols-3 gap-4 items-center">
                    <Label className="capitalize">{level} Level</Label>
                    <Input
                      type="number"
                      value={range.min}
                      onChange={(e) => handleNestedChange('salaryRanges', level, {
                        ...range,
                        min: parseInt(e.target.value) || 0
                      })}
                      placeholder="Min"
                    />
                    <Input
                      type="number"
                      value={range.max}
                      onChange={(e) => handleNestedChange('salaryRanges', level, {
                        ...range,
                        max: parseInt(e.target.value) || 0
                      })}
                      placeholder="Max"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Workflow Settings Tab */}
        <TabsContent value="workflow">
          <div className="space-y-6">
            {/* Interview Process */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Interview Process
                </CardTitle>
                <CardDescription>
                  Define your typical interview and assessment workflow
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Interview Steps</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {interviewProcessOptions.map(step => (
                      <div key={step} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={step}
                          checked={profileData.interviewProcess.includes(step)}
                          onChange={() => handleArrayToggle('interviewProcess', step)}
                          className="rounded"
                        />
                        <Label htmlFor={step} className="text-sm">{step}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Assessment Tools</Label>
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
                  <Label>Communication Preferences</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2">
                    {communicationOptions.map(option => (
                      <div key={option} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={option}
                          checked={profileData.communicationPreferences.includes(option)}
                          onChange={() => handleArrayToggle('communicationPreferences', option)}
                          className="rounded"
                        />
                        <Label htmlFor={option} className="text-sm">{option}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Working Hours */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Working Hours & Availability
                </CardTitle>
                <CardDescription>
                  Set your typical working hours and availability
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

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={profileData.workingHours.start}
                      onChange={(e) => handleNestedChange('workingHours', 'start', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={profileData.workingHours.end}
                      onChange={(e) => handleNestedChange('workingHours', 'end', e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Working Days</Label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mt-2">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                      <div key={day} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={day}
                          checked={profileData.workingHours.days.includes(day)}
                          onChange={() => {
                            const newDays = profileData.workingHours.days.includes(day)
                              ? profileData.workingHours.days.filter(d => d !== day)
                              : [...profileData.workingHours.days, day];
                            handleNestedChange('workingHours', 'days', newDays);
                          }}
                          className="rounded"
                        />
                        <Label htmlFor={day} className="text-sm">{day.slice(0, 3)}</Label>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <div className="space-y-6">
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
                        {key === 'newApplications' && 'Get notified when candidates apply to your jobs'}
                        {key === 'candidateUpdates' && 'Updates on candidate status changes'}
                        {key === 'interviewReminders' && 'Reminders for upcoming interviews'}
                        {key === 'teamUpdates' && 'Updates from your hiring team'}
                        {key === 'weeklyReports' && 'Weekly hiring performance reports'}
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
                  Control who can see your profile and contact information
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
                      <SelectItem value="verified">Verified Users Only</SelectItem>
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
                      <SelectItem value="connections">Connections Only</SelectItem>
                      <SelectItem value="private">Private - Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Company Information Public</Label>
                    <p className="text-sm text-gray-500">
                      Allow your company information to be visible in job postings
                    </p>
                  </div>
                  <Switch
                    checked={profileData.companyInfoPublic}
                    onCheckedChange={(checked) => 
                      handleInputChange('companyInfoPublic', checked)
                    }
                  />
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

export default HRProfileForm;
