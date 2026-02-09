import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

const AutoFillCVBuilder: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect immediately to Profile Studio
    navigate('/candidate/profile/identity', { replace: true });
  }, [navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <LoadingSpinner />
      <span className="sr-only">Redirecting to Profile Studio...</span>
    </div>
  );
};

export default AutoFillCVBuilder;