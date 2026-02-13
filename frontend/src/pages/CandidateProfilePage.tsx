import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Loader2, AlertCircle, MapPin, Briefcase, GraduationCap, DollarSign, Calendar, Activity, MessageSquare, Camera } from 'lucide-react';
import { messagingService } from '@/services/messagingService';
import { toast } from 'sonner';
import { restClient } from '@/utils/api';

interface WorkExperience {
  title?: string;
  job_title?: string;
  position?: string;
  company?: string;
  organization?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  responsibilities?: string[];
  is_current?: boolean;
}

interface Education {
  degree?: string;
  level?: string;
  institution?: string;
  field_of_study?: string;
  start_date?: string;
  end_date?: string;
  year?: string;
  description?: string;
  grade?: string;
}

interface CandidateData {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  emirate: string;
  nationality: string;
  education_level: string;
  experience_years: number;
  preferred_salary_min: number;
  preferred_salary_max: number;
  preferred_location: string;
  is_uae_national: boolean;
  skills: string[];
  registered_at: string;
  last_login: string;
  total_applications: number;
  last_application_date: string;
  activity_status: string;
  profile_photo_url?: string;
  bio?: string;
  headline?: string;
  current_position?: string;
  current_company?: string;
  notice_period?: string;
  salary_expectation?: string;
  work_experience?: WorkExperience[];
  education?: Education[];
  certifications?: any[];
}

interface Application {
  id: number;
  job_id: number;
  job_title: string;
  company_name: string;
  status: string;
  submitted_at: string;
  updated_at: string;
}

const CandidateProfilePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [candidate, setCandidate] = useState<CandidateData | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (candidateId) {
      fetchCandidateProfile();
    }
  }, [candidateId]);

  // ... (keeping existing fetchCandidateProfile)

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('Image size should be less than 5MB');
      return;
    }

    try {
      setUploadingPhoto(true);
      const formData = new FormData();
      formData.append('photo', file);

      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token');

      const response = await fetch('/api/profile/candidate/photo', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Profile photo updated successfully');
        // Update local state with new photo URL
        if (candidate) {
          setCandidate({
            ...candidate,
            profile_photo_url: data.data.photo_url
          });
        }
      } else {
        throw new Error(data.message || 'Failed to upload photo');
      }
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error(error.message || 'Failed to upload photo');
    } finally {
      setUploadingPhoto(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const fetchCandidateProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      // Use restClient (axios) for consistent auth token injection & 401 refresh
      const response = await restClient.get(`/api/hr/candidates/${candidateId}`);
      const data = response.data;

      if (data.success) {
        setCandidate(data.data.candidate);
        setApplications(data.data.recent_applications || []);
      } else {
        setError(data.message || 'Failed to load candidate profile');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching candidate profile:', err?.response?.data || err?.message || err);
      const message = err?.response?.data?.message || err?.message || 'Failed to load candidate profile';
      setError(message);
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMessage = async () => {
    if (!candidate) return;

    try {
      setCreatingConversation(true);
      // Create conversation with candidate
      const conversationResponse = await messagingService.createConversation({
        participants: [candidate.id.toString()],
        title: `${candidate.first_name} ${candidate.last_name}`
      });

      if (conversationResponse.success && conversationResponse.data) {
        // Navigate to messages page with the new conversation selected
        navigate(`/messages?conversationId=${conversationResponse.data.id}`);
      } else {
        toast.error('Failed to start conversation');
      }
    } catch (err: any) {
      console.error('Error creating conversation:', err);
      // If error is just navigation or something minor, still try to go to messages
      navigate('/messages');
    } finally {
      setCreatingConversation(false);
    }
  };

  const getActivityBadgeVariant = (status: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'recent':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'accepted':
      case 'hired':
        return 'default';
      case 'pending':
      case 'under_review':
        return 'secondary';
      case 'rejected':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-teal-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading candidate profile...</p>
        </div>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">Profile Not Found</h2>
              <p className="text-gray-600 mb-4">
                {error || 'Could not load candidate profile'}
              </p>
              <Button onClick={handleBack} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Go Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>

              <div className="relative group">
                <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-gray-100 bg-gray-100 flex items-center justify-center">
                  {candidate?.profile_photo_url ? (
                    <img
                      src={candidate.profile_photo_url}
                      alt={`${candidate.first_name} ${candidate.last_name}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl font-semibold text-gray-400">
                      {candidate?.first_name?.charAt(0)}{candidate?.last_name?.charAt(0)}
                    </span>
                  )}

                  {/* Upload Overlay */}
                  <div
                    className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-full"
                    onClick={handlePhotoClick}
                  >
                    {uploadingPhoto ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </div>
              </div>

              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {candidate.first_name} {candidate.last_name}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  {candidate.is_uae_national && (
                    <Badge variant="default" className="text-xs">UAE National</Badge>
                  )}
                  <Badge variant={getActivityBadgeVariant(candidate.activity_status)} className="text-xs">
                    {candidate.activity_status}
                  </Badge>
                  <span className="text-sm text-gray-600">
                    Total Applications: {candidate.total_applications}
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={handleMessage} disabled={loading || creatingConversation}>
              {creatingConversation ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4 mr-2" />
              )}
              Message Candidate
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* About / Summary - NEW SECTION */}
          {(candidate.headline || candidate.bio) && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {candidate.headline && (
                  <div>
                    <h3 className="font-medium text-gray-900">Headline</h3>
                    <p className="text-gray-600">{candidate.headline}</p>
                  </div>
                )}
                {candidate.bio && (
                  <div>
                    <h3 className="font-medium text-gray-900">Bio</h3>
                    <p className="text-gray-600 whitespace-pre-wrap">{candidate.bio}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Contact & Communication */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact & Communication</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Send Message CTA — replaces direct contact details for privacy */}
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-sm text-blue-800 mb-3">
                  All communication is managed through the platform to protect candidate privacy.
                </p>
                <Button
                  onClick={handleMessage}
                  disabled={loading || creatingConversation}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {creatingConversation ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <MessageSquare className="h-4 w-4 mr-2" />
                  )}
                  Send Message
                </Button>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Location</p>
                  <p className="text-gray-900">{candidate.emirate || 'N/A'}, UAE</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Activity className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Nationality</p>
                  <p className="text-gray-900">{candidate.nationality}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Professional Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Current Role</p>
                  <p className="text-gray-900 font-medium">{candidate.current_position || 'Not specified'}</p>
                  {candidate.current_company && (
                    <p className="text-sm text-gray-500">{candidate.current_company}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Experience</p>
                  <p className="text-gray-900">{candidate.experience_years || 0} years</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Education Level</p>
                  <p className="text-gray-900">{candidate.education_level || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <DollarSign className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Salary Expectation</p>
                  <p className="text-gray-900">
                    {candidate.preferred_salary_min && candidate.preferred_salary_max
                      ? `AED ${candidate.preferred_salary_min.toLocaleString()} - ${candidate.preferred_salary_max.toLocaleString()}`
                      : 'Not specified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Preferred Location</p>
                  <p className="text-gray-900">{candidate.preferred_location || 'Flexible'}</p>
                </div>
              </div>

              {candidate.notice_period && (
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Notice Period</p>
                    <p className="text-gray-900">{candidate.notice_period}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {candidate.skills && candidate.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {candidate.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600">No skills listed</p>
              )}
            </CardContent>
          </Card>

          {/* Work Experience */}
          {candidate.work_experience && candidate.work_experience.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Work Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {candidate.work_experience.map((exp, index) => {
                    const title = exp.title || exp.job_title || exp.position || 'Untitled Role';
                    const company = exp.company || exp.organization || '';
                    const startDate = exp.start_date ? new Date(exp.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
                    const endDate = exp.is_current ? 'Present' : exp.end_date ? new Date(exp.end_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '';
                    const dateRange = startDate ? `${startDate} - ${endDate}` : '';
                    return (
                      <div key={index} className="relative pl-6 border-l-2 border-emerald-200 pb-2">
                        <div className="absolute -left-[7px] top-1 w-3 h-3 rounded-full bg-emerald-500" />
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-semibold text-gray-900">{title}</h4>
                            {company && <p className="text-sm text-emerald-700">{company}{exp.location ? ` — ${exp.location}` : ''}</p>}
                          </div>
                          {dateRange && (
                            <span className="text-xs text-gray-500 whitespace-nowrap ml-4 flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {dateRange}
                            </span>
                          )}
                        </div>
                        {exp.description && (
                          <p className="text-sm text-gray-600 mt-1">{exp.description}</p>
                        )}
                        {exp.responsibilities && exp.responsibilities.length > 0 && (
                          <ul className="text-sm text-gray-600 mt-1 list-disc list-inside">
                            {exp.responsibilities.map((r, i) => <li key={i}>{r}</li>)}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Education */}
          {candidate.education && candidate.education.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => {
                    const degree = edu.degree || edu.level || 'Degree';
                    const institution = edu.institution || '';
                    const year = edu.year || (edu.end_date ? new Date(edu.end_date).getFullYear().toString() : '');
                    return (
                      <div key={index} className="flex items-start justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <h4 className="font-semibold text-gray-900">{degree}</h4>
                          {institution && <p className="text-sm text-gray-600">{institution}</p>}
                          {edu.field_of_study && <p className="text-xs text-gray-500">{edu.field_of_study}</p>}
                          {edu.grade && <p className="text-xs text-gray-500">Grade: {edu.grade}</p>}
                        </div>
                        {year && <span className="text-sm text-gray-500">{year}</span>}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certifications */}
          {candidate.certifications && candidate.certifications.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Certifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {candidate.certifications.map((cert: any, index: number) => (
                    <Badge key={index} variant="outline" className="text-sm py-1 px-3">
                      {typeof cert === 'string' ? cert : cert.name || cert.title || 'Certification'}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}


        </div>
      </div>
    </div>
  );
};

export default CandidateProfilePage;

