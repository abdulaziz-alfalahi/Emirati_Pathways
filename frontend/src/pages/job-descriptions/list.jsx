// src/pages/job-descriptions/list.jsx
import React from 'react';
import { JobDescriptionsList } from '@/components/job-matching/JobDescriptionsList';
import Layout from '@/components/layout/Layout';

export default function JobDescriptionsListPage() {
  return (
    <Layout>
      <JobDescriptionsList />
    </Layout>
  );
}

