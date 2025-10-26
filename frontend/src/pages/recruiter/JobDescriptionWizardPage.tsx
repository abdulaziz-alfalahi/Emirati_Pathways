import React from 'react';
import { useNavigate } from 'react-router-dom';
import JDWizardWithUpload from '@/components/recruiter/job-descriptions/JDWizardWithUpload';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';

const JobDescriptionWizardPage: React.FC = () => {
  const navigate = useNavigate();

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
          onComplete={handleComplete}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
};

export default JobDescriptionWizardPage;

