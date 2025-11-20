import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import JDWizardWithUpload from '@/components/recruiter/job-descriptions/JDWizardWithUpload';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import { apiClient } from '@/utils/apiClient';

const JobDescriptionWizardPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [initialJdId, setInitialJdId] = useState<string | undefined>();
  const [initialData, setInitialData] = useState<any>(null);

  // Get user info from localStorage or context
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        return {
          recruiterId: user.id || user.user_id || 'recruiter_default',
          companyId: user.company_id || 'company_default'
        };
      }
    } catch (error) {
      console.error('Error getting user info:', error);
    }
    return {
      recruiterId: 'recruiter_default',
      companyId: 'company_default'
    };
  };

  const { recruiterId, companyId } = getUserInfo();

  // Load existing JD if jd_id is in URL
  useEffect(() => {
    const jdId = searchParams.get('jd_id');
    if (jdId) {
      setInitialJdId(jdId);
      
      // Load JD data from backend
      const loadJD = async () => {
        try {
          const data = await apiClient.get(`/api/recruiter/jd/${jdId}`);
          setInitialData(data);
        } catch (error) {
          console.error('Failed to load JD:', error);
        }
      };
      
      loadJD();
    }
  }, [searchParams]);

  const handleComplete = (jdId: string) => {
    console.log('JD created successfully:', jdId);
    // Navigate back to recruiter dashboard
    navigate('/recruiter-dashboard');
  };

  const handleCancel = () => {
    // Navigate back to recruiter dashboard
    navigate('/recruiter-dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HybridGovernmentNavFixed />
      <div className="container mx-auto py-8 px-4">
        <JDWizardWithUpload
          recruiterId={recruiterId}
          companyId={companyId}
          initialJdId={initialJdId}
          initialData={initialData}
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default JobDescriptionWizardPage;

