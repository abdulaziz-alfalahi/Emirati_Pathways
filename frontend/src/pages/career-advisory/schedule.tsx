
import React from 'react';
import Layout from '@/components/layout/Layout';
import AdvisorScheduling from '@/components/career-advisory/AdvisorScheduling';

const ScheduleSessionPage: React.FC = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Schedule Career Advisory Session</h1>
        <AdvisorScheduling />
      </div>
    </Layout>
  );
};

export default ScheduleSessionPage;
