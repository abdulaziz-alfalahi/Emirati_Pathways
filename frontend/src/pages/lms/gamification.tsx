
import React from 'react';
import Layout from '@/components/layout/Layout';
import { GamificationDashboard } from '@/components/lms/gamification';

const LMSGamificationPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <GamificationDashboard />
      </div>
    </Layout>
  );
};

export default LMSGamificationPage;
