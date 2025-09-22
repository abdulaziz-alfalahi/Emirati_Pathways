
import React from 'react';
import { useParams } from 'react-router-dom';
import { MatchingDashboard } from '@/components/job-matching/MatchingDashboard';
import Layout from '@/components/layout/Layout';

export default function MatchingDetailPage() {
  const { id } = useParams();
  
  return (
    <Layout>
      <MatchingDashboard jobId={id} />
    </Layout>
  );
}
