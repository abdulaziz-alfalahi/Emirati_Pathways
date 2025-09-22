
import React from 'react';
import Layout from '@/components/layout/Layout';
import { LearningAnalyticsDashboard } from '@/components/lms/analytics';

const LMSAnalyticsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <LearningAnalyticsDashboard />
      </div>
    </Layout>
  );
};

export default LMSAnalyticsPage;
