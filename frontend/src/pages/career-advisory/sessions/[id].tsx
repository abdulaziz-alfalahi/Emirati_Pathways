
import React from 'react';
import Layout from '@/components/layout/Layout';
import SessionDetails from '@/components/career-advisory/SessionDetails';

const SessionDetailsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Session Details</h1>
        <SessionDetails />
      </div>
    </Layout>
  );
};

export default SessionDetailsPage;
