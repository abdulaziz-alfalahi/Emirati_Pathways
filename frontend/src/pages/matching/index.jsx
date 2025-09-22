
import React from 'react';
import { MatchingDashboard } from '@/components/job-matching/MatchingDashboard';
import Layout from '@/components/layout/Layout';
import { useLocation } from 'react-router-dom';

export default function MatchingPage() {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get('tab') || 'candidates';
  
  return (
    <Layout>
      <MatchingDashboard initialTab={tab} />
    </Layout>
  );
}
