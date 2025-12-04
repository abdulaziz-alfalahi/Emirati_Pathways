import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Loader2, AlertCircle, MapPin, Briefcase, GraduationCap, DollarSign, Calendar, Activity } from 'lucide-react';

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

  useEffect(() => {
    if (candidateId) {
      fetchCandidateProfile();
    }
  }, [candidateId]);

  const fetchCandidateProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('accessToken') || localStorage.getItem('access_token') || localStorage.getItem('auth_token');

      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`http://127.0.0.1:5005/api/hr/candidates/${candidateId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch candidate data: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.success) {
        setCandidate(data.data.candidate);
        setApplications(data.data.recent_applications || []);
      } else {
        setError(data.message || 'Failed to load candidate profile');
      }

      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching candidate profile:', err);
      setError(err.message || 'Failed to load candidate profile');
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleContact = () => {
    if (candidate?.email) {
      window.location.href = `mailto:${candidate.email}`;
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
            <div className="flex items-center gap-4">
              <Button onClick={handleBack} variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
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
                    {candidate.total_applications} Applications
                  </span>
                </div>
              </div>
            </div>

            <Button onClick={handleContact}>
              <Mail className="h-4 w-4 mr-2" />
              Contact Candidate
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <a href={`mailto:${candidate.email}`} className="text-blue-600 hover:text-blue-700">
                    {candidate.email}
                  </a>
                </div>
              </div>

              {candidate.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <a href={`tel:${candidate.phone}`} className="text-gray-900">
                      {candidate.phone}
                    </a>
                  </div>
                </div>
              )}

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

          {/* Recent Applications */}
          {applications.length > 0 && (
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.map((app) => (
                    <div key={app.id} className="flex items-start justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{app.job_title}</h4>
                          <Badge variant={getStatusBadgeVariant(app.status)}>
                            {app.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{app.company_name}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Applied: {new Date(app.submitted_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Information */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Activity Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Registered</p>
                  <p className="text-gray-900 font-medium">
                    {new Date(candidate.registered_at).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Last Login</p>
                  <p className="text-gray-900 font-medium">
                    {candidate.last_login
                      ? new Date(candidate.last_login).toLocaleDateString()
                      : 'Never'}
                  </p>
                </div>
                {candidate.last_application_date && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Last Application</p>
                    <p className="text-gray-900 font-medium">
                      {new Date(candidate.last_application_date).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CandidateProfilePage;

