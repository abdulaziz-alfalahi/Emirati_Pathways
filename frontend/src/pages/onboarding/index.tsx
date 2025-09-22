
import React from 'react';
import Layout from '@/components/layout/Layout';
import OnboardingWrapper from '@/components/onboarding/OnboardingWrapper';

const OnboardingPage: React.FC = () => {
  return (
    <Layout>
      <OnboardingWrapper hasCompletedOnboarding={false} />
    </Layout>
  );
};

export default OnboardingPage;
