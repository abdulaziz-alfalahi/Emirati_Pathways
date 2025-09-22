import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import CredentialVerificationForm from '@/components/credentials/CredentialVerificationForm';
import VerifiedCredentialsList from '@/components/credentials/VerifiedCredentialsList';

const CredentialsPage = () => {
  const { t } = useTranslation('credentials');
  const { user } = useAuth();
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleVerificationComplete = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!user) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('loginRequired')}</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          {t('description')}
        </p>
      </div>
      
      <CredentialVerificationForm 
        userId={user.id} 
        onVerificationComplete={handleVerificationComplete}
      />
      
      <VerifiedCredentialsList 
        userId={user.id} 
        refreshTrigger={refreshTrigger}
      />
    </div>
  );
};

export default CredentialsPage;

