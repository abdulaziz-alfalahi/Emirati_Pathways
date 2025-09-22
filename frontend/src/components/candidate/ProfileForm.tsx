import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase, 
  GraduationCap, 
  Award, 
  Languages,
  Save,
  Edit,
  CheckCircle,
  AlertCircle,
  Plus,
  X,
  Sparkles
} from 'lucide-react';

// Types for profile data
interface ProfileData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  location: string;
  nationality: string;
  visa_status: string;
  emirates_id: string;
  
  // Professional Information
  summary: string;
  years_of_experience: number;
  current_position: string;
  current_company: string;
  
  // Skills and Education
  skills: string[];
  languages: string[];
  education: string;
  certifications: string[];
  
  // Additional Information
  job_titles: string[];
  companies: string[];
  linkedin_url: string;
  portfolio_url: string;
}

interface ProfileFormProps {
  initialData?: Partial<ProfileData>;
  onSave?: (data: ProfileData) => void;
  onUpdate?: (data: ProfileData) => void;
  className?: string;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  initialData = {}, 
  onSave, 
  onUpdate,
  className = "" 
}) => {
  // State management
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    location: '',
    nationality: '',
    visa_status: '',
    emirates_id: '',
    summary: '',
    years_of_experience: 0,
    current_position: '',
    current_company: '',
    skills: [],
    languages: [],
    education: '',
    certifications: [],
    job_titles: [],
    companies: [],
    linkedin_url: '',
    portfolio_url: '',
    ...initialData
  });

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newSkill, setNewSkill] = useState('');
  const [newLanguage, setNewLanguage] = useState('');
  const [newCertification, setNewCertification] = useState('');

  // Update profile data when initialData changes (from CV parsing)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      setProfileData(prev => ({
        ...prev,
        ...initialData
      }));
      setSuccess('✅ Profile automatically updated with CV data!');
      setTimeout(() => setSuccess(null), 5000);
    }
  }, [initialData]);

  // Handle input changes
  const handleInputChange = (field: keyof ProfileData, value: string | number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle array field additions
  const addToArray = (field: 'skills' | 'languages' | 'certifications', value: string) => {
    if (value.trim() && !profileData[field].includes(value.trim())) {
      setProfileData(prev => ({
        ...prev,
        [field]: [...prev[field], value.trim()]
      }));
    }
  };

  // Handle array field removals
  const removeFromArray = (field: 'skills' | 'languages' | 'certifications', index: number) => {
    setProfileData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  // Handle save
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    
    try {
      // Validate required fields
      if (!profileData.name || !profileData.email) {
        throw new Error('Name and email are required');
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('✅ Profile saved successfully!');
      setIsEditing(false);
      
      // Call callbacks
      onSave?.(profileData);
      onUpdate?.(profileData);
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(`Failed to save profile: ${(err as Error).message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Calculate profile completion percentage
  const calculateCompleteness = () => {
    const fields = [
      profileData.name,
      profileData.email,
      profileData.phone,
      profileData.location,
      profileData.summary,
      profileData.education,
      profileData.skills.length > 0,
      profileData.languages.length > 0,
      profileData.years_of_experience > 0
    ];
    
    const completed = fields.filter(Boolean).length;
    return Math.round((completed / fields.length) * 100);
  };

  const completeness = calculateCompleteness();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
                <Badge variant={completeness >= 80 ? "default" : "secondary"}>
                  {completeness}% Complete
                </Badge>
              </CardTitle>
              <CardDescription>
                Keep your profile up to date to get better job matches
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)} variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={() => setIsEditing(false)} 
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving}
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Status Messages */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">{success}</AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Personal Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={profileData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                disabled={!isEditing}
                placeholder="Enter your full name"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email Address *</Label>
              <Input
                id="email"
                type="email"
                value={profileData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                disabled={!isEditing}
                placeholder="your.email@example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                disabled={!isEditing}
                placeholder="+971501234567"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                placeholder="Dubai, UAE"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality/Status</Label>
              <Input
                id="nationality"
                value={profileData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                disabled={!isEditing}
                placeholder="UAE National / UAE Resident"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="emirates_id">Emirates ID</Label>
              <Input
                id="emirates_id"
                value={profileData.emirates_id}
                onChange={(e) => handleInputChange('emirates_id', e.target.value)}
                disabled={!isEditing}
                placeholder="784-XXXX-XXXXXXX-X"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Professional Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="summary">Professional Summary</Label>
            <Textarea
              id="summary"
              value={profileData.summary}
              onChange={(e) => handleInputChange('summary', e.target.value)}
              disabled={!isEditing}
              placeholder="Brief description of your professional background and career objectives..."
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="years_experience">Years of Experience</Label>
              <Input
                id="years_experience"
                type="number"
                value={profileData.years_of_experience}
                onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value) || 0)}
                disabled={!isEditing}
                placeholder="5"
                min="0"
                max="50"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_position">Current Position</Label>
              <Input
                id="current_position"
                value={profileData.current_position}
                onChange={(e) => handleInputChange('current_position', e.target.value)}
                disabled={!isEditing}
                placeholder="Senior Software Engineer"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="current_company">Current Company</Label>
              <Input
                id="current_company"
                value={profileData.current_company}
                onChange={(e) => handleInputChange('current_company', e.target.value)}
                disabled={!isEditing}
                placeholder="Emirates Technology"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Skills & Technologies
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profileData.skills.map((skill, index) => (
              <Badge key={index} variant="secondary" className="flex items-center gap-1">
                {skill}
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('skills', index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {profileData.skills.length === 0 && (
              <span className="text-gray-500 text-sm">No skills added yet</span>
            )}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newSkill}
                onChange={(e) => setNewSkill(e.target.value)}
                placeholder="Add a skill (e.g., JavaScript, React, Python)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToArray('skills', newSkill);
                    setNewSkill('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  addToArray('skills', newSkill);
                  setNewSkill('');
                }}
                disabled={!newSkill.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Languages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Languages className="h-5 w-5" />
            Languages
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {profileData.languages.map((language, index) => (
              <Badge key={index} variant="outline" className="flex items-center gap-1">
                {language}
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('languages', index)}
                    className="ml-1 hover:text-red-500"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </Badge>
            ))}
            {profileData.languages.length === 0 && (
              <span className="text-gray-500 text-sm">No languages added yet</span>
            )}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newLanguage}
                onChange={(e) => setNewLanguage(e.target.value)}
                placeholder="Add a language (e.g., Arabic, English, French)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToArray('languages', newLanguage);
                    setNewLanguage('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  addToArray('languages', newLanguage);
                  setNewLanguage('');
                }}
                disabled={!newLanguage.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Education */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Education
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="education">Education Background</Label>
            <Textarea
              id="education"
              value={profileData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              disabled={!isEditing}
              placeholder="Bachelor of Computer Science | American University of Sharjah | 2018"
              className="min-h-[80px]"
            />
          </div>
        </CardContent>
      </Card>

      {/* Certifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Certifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {profileData.certifications.map((cert, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span className="text-sm">{cert}</span>
                {isEditing && (
                  <button
                    onClick={() => removeFromArray('certifications', index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
            {profileData.certifications.length === 0 && (
              <span className="text-gray-500 text-sm">No certifications added yet</span>
            )}
          </div>
          
          {isEditing && (
            <div className="flex gap-2">
              <Input
                value={newCertification}
                onChange={(e) => setNewCertification(e.target.value)}
                placeholder="Add a certification (e.g., AWS Certified Solutions Architect)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    addToArray('certifications', newCertification);
                    setNewCertification('');
                  }
                }}
              />
              <Button
                onClick={() => {
                  addToArray('certifications', newCertification);
                  setNewCertification('');
                }}
                disabled={!newCertification.trim()}
                size="sm"
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Additional Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Professional Links
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linkedin_url">LinkedIn Profile</Label>
              <Input
                id="linkedin_url"
                value={profileData.linkedin_url}
                onChange={(e) => handleInputChange('linkedin_url', e.target.value)}
                disabled={!isEditing}
                placeholder="https://linkedin.com/in/yourprofile"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="portfolio_url">Portfolio/Website</Label>
              <Input
                id="portfolio_url"
                value={profileData.portfolio_url}
                onChange={(e) => handleInputChange('portfolio_url', e.target.value)}
                disabled={!isEditing}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profile Completion Progress */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Profile Completion
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Overall Progress</span>
              <span className="text-sm text-gray-600">{completeness}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${completeness}%` }}
              ></div>
            </div>
            <div className="text-xs text-gray-500">
              {completeness >= 80 ? (
                "🎉 Excellent! Your profile is well-optimized for job matching."
              ) : completeness >= 60 ? (
                "👍 Good progress! Add more details to improve your job matches."
              ) : (
                "📝 Complete more sections to get better job recommendations."
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;
