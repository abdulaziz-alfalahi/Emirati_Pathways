import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CVPreview } from '@/components/cv-builder/CVPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Mail, Phone, Loader2, AlertCircle } from 'lucide-react';
import { CVData, CVTemplate } from '@/types/cv';

const CandidateProfilePage: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cvData, setCvData] = useState<CVData | null>(null);
  const [candidateInfo, setCandidateInfo] = useState<any>(null);

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
      
      // Step 1: Get list of candidate's CVs
      const cvsResponse = await fetch(`http://localhost:5003/api/cv/user/${candidateId}/cvs`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!cvsResponse.ok) {
        throw new Error('Failed to fetch candidate CVs');
      }

      const cvsData = await cvsResponse.json();
      
      if (!cvsData.success || !cvsData.cvs || cvsData.cvs.length === 0) {
        setError('No CV found for this candidate');
        setLoading(false);
        return;
      }

      // Get the active CV or the most recent one
      const activeCv = cvsData.cvs.find((cv: any) => cv.is_active) || cvsData.cvs[0];
      
      // Step 2: Get full CV data
      const cvResponse = await fetch(`http://localhost:5003/api/cv/${activeCv.cv_id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!cvResponse.ok) {
        throw new Error('Failed to fetch CV details');
      }

      const cvFullData = await cvResponse.json();
      
      if (cvFullData.success && cvFullData.data) {
        setCvData({
          id: activeCv.cv_id,
          ...cvFullData.data,
          template: activeCv.template,
          language: activeCv.language,
          completionScore: activeCv.completion_score
        });
      }

      // Step 3: Try to get additional candidate info from candidates table
      try {
        const candidateResponse = await fetch(`http://localhost:5003/api/hr/candidates/search?user_id=${candidateId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (candidateResponse.ok) {
          const candidateData = await candidateResponse.json();
          if (candidateData.data && candidateData.data.candidates && candidateData.data.candidates.length > 0) {
            setCandidateInfo(candidateData.data.candidates[0]);
          }
        }
      } catch (err) {
        // Candidate info is optional, continue without it
        console.log('Could not fetch additional candidate info:', err);
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
    const email = cvData?.personalInfo?.email || cvData?.personal_info?.email;
    if (email) {
      window.location.href = `mailto:${email}`;
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

  if (error || !cvData) {
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

  const personalInfo = cvData.personalInfo || cvData.personal_info || {};
  const email = personalInfo.email;
  const phone = personalInfo.phone;

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
                <h1 className="text-2xl font-bold text-gray-900">Candidate Profile</h1>
                <p className="text-sm text-gray-600">Review candidate details and CV</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {cvData.completionScore && (
                <Badge variant={cvData.completionScore >= 80 ? 'default' : 'secondary'}>
                  {cvData.completionScore}% Complete
                </Badge>
              )}
              {email && (
                <Button onClick={handleContact}>
                  <Mail className="h-4 w-4 mr-2" />
                  Contact Candidate
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Contact Info */}
        {(email || phone) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-6">
                {email && (
                  <div className="flex items-center gap-2">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <a href={`mailto:${email}`} className="text-blue-600 hover:text-blue-700">
                      {email}
                    </a>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <a href={`tel:${phone}`} className="text-gray-700">
                      {phone}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CV Preview */}
        <Card>
          <CardContent className="p-8">
            <CVPreview 
              data={cvData} 
              template={cvData.template || CVTemplate.UAE_PROFESSIONAL}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CandidateProfilePage;

