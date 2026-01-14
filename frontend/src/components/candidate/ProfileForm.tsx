
import * as React from 'react';
import { useState, useEffect } from 'react';
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
import { restClient } from '@/utils/api';
// Use dynamic import for LocationPicker to avoid circular dependencies if any, or just standard import
import LocationPicker from '@/components/common/LocationPicker';

// Types for profile data
interface ProfileData {
  // Personal Information
  name: string;
  email: string;
  phone: string;
  location: string;
  latitude?: number;
  longitude?: number;
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
      if (!isEditing && initialData.name) {
        // If loading existing data, don't auto-show success unless it was a save
      }
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

  const handleLocationSelect = (lat: number, lng: number) => {
    setProfileData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng,
      location: `${lat.toFixed(4)}, ${lng.toFixed(4)}`
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

      // Structure data for API
      const apiPayload = {
        personal_info: {
          first_name: profileData.name.split(' ')[0],
          last_name: profileData.name.split(' ').slice(1).join(' '),
          email: profileData.email,
          phone: profileData.phone,
          location: profileData.location,
          latitude: profileData.latitude,
          longitude: profileData.longitude,
          nationality: profileData.nationality,
          visa_status: profileData.visa_status,
          emirates_id: profileData.emirates_id,
          linkedin: profileData.linkedin_url,
          portfolio: profileData.portfolio_url
        },
        professional_summary: profileData.summary,
        experience_years: profileData.years_of_experience,
        current_position: profileData.current_position,
        current_company: profileData.current_company,
        skills: profileData.skills,
        languages: profileData.languages,
        certifications: profileData.certifications,
        education: typeof profileData.education === 'string' ? [{ degree: profileData.education }] : profileData.education,
        // Support additional fields as needed
        latitude: profileData.latitude,
        longitude: profileData.longitude
      };

      // Call API
      const response = await restClient.put('/api/auth/profile', apiPayload);

      if (response.data.success) {
        setSuccess('✅ Profile saved successfully!');
        setIsEditing(false);

        // Call callbacks
        onSave?.(profileData);
        onUpdate?.(profileData);

        setTimeout(() => setSuccess(null), 3000);
      } else {
        throw new Error(response.data.message || 'Failed to update profile');
      }
    } catch (err: any) {
      console.error('Profile save error request:', err.request);
      console.error('Profile save error response:', err.response);
      const errorMessage = err.response?.data?.message || err.message || 'Unknown error';
      setError(`Failed to save profile: ${errorMessage}`);
      console.error('Detailed Error:', errorMessage);
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
                placeholder="+971 50 123 4567"
              />
            </div>

            <div className="space-y-2 col-span-1 md:col-span-2">
              <Label>Location (Home)</Label>
              {isEditing ? (
                <LocationPicker
                  lat={profileData.latitude}
                  lng={profileData.longitude}
                  onLocationSelect={handleLocationSelect}
                  height="250px"
                />
              ) : (
                <>
                  {profileData.latitude && profileData.longitude ? (
                    <div className="h-[250px] w-full bg-slate-100 rounded-md border text-muted-foreground overflow-hidden">
                      <LocationPicker
                        lat={profileData.latitude}
                        lng={profileData.longitude}
                        height="250px"
                        onLocationSelect={() => { }} // Read-only
                      />
                    </div>
                  ) : (
                    <div className="h-[250px] w-full bg-slate-100 rounded-md border flex items-center justify-center text-muted-foreground">
                      <div className="flex flex-col items-center">
                        <MapPin className="h-8 w-8 mb-2 opacity-50" />
                        <span>No location selected. Click Edit to add location.</span>
                      </div>
                    </div>
                  )}
                </>
              )}
              <Input
                id="location"
                value={profileData.location}
                onChange={(e) => handleInputChange('location', e.target.value)}
                disabled={!isEditing}
                placeholder="Dubai, UAE (or select on map)"
                className="mt-2"
              />
              <p className="text-xs text-muted-foreground">
                Set your home location to calculate commute times to job opportunities.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={profileData.nationality}
                onChange={(e) => handleInputChange('nationality', e.target.value)}
                disabled={!isEditing}
                placeholder="e.g. Emirati"
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

      {/* Professional Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Professional Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="summary">About You</Label>
              <Textarea
                id="summary"
                value={profileData.summary}
                onChange={(e) => handleInputChange('summary', e.target.value)}
                disabled={!isEditing}
                placeholder="Briefly describe your professional background and career goals..."
                className="min-h-[100px]"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="current_position">Current Position</Label>
                <Input
                  id="current_position"
                  value={profileData.current_position}
                  onChange={(e) => handleInputChange('current_position', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="current_company">Current Company</Label>
                <Input
                  id="current_company"
                  value={profileData.current_company}
                  onChange={(e) => handleInputChange('current_company', e.target.value)}
                  disabled={!isEditing}
                  placeholder="e.g. Tech Solutions Ltd"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="years_of_experience">Years of Experience</Label>
                <Input
                  id="years_of_experience"
                  type="number"
                  value={profileData.years_of_experience}
                  onChange={(e) => handleInputChange('years_of_experience', parseInt(e.target.value))}
                  disabled={!isEditing}
                  placeholder="e.g. 5"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Skills & Expertise
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.skills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="pl-3 pr-1 py-1">
                  {skill}
                  {isEditing && (
                    <button
                      onClick={() => removeFromArray('skills', index)}
                      className="ml-2 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {profileData.skills.length === 0 && (
                <span className="text-muted-foreground text-sm italic">No skills added yet</span>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  placeholder="Add a skill (e.g. Project Management)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('skills', newSkill);
                      setNewSkill('');
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    addToArray('skills', newSkill);
                    setNewSkill('');
                  }}
                  variant="secondary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
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
            <Label htmlFor="education">Latest Education</Label>
            <Input
              id="education"
              value={profileData.education}
              onChange={(e) => handleInputChange('education', e.target.value)}
              disabled={!isEditing}
              placeholder="e.g. BSc Computer Science, UAE University"
            />
          </div>
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
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 mb-4">
              {profileData.languages.map((lang, index) => (
                <Badge key={index} variant="outline" className="pl-3 pr-1 py-1">
                  {lang}
                  {isEditing && (
                    <button
                      onClick={() => removeFromArray('languages', index)}
                      className="ml-2 hover:bg-slate-200 rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </Badge>
              ))}
              {profileData.languages.length === 0 && (
                <span className="text-muted-foreground text-sm italic">No languages added</span>
              )}
            </div>

            {isEditing && (
              <div className="flex gap-2">
                <Input
                  value={newLanguage}
                  onChange={(e) => setNewLanguage(e.target.value)}
                  placeholder="Add a language (e.g. Arabic)"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addToArray('languages', newLanguage);
                      setNewLanguage('');
                    }
                  }}
                />
                <Button
                  type="button"
                  onClick={() => {
                    addToArray('languages', newLanguage);
                    setNewLanguage('');
                  }}
                  variant="secondary"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProfileForm;

