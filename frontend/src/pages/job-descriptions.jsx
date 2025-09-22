import React from 'react';
// Adjust the import path if necessary, assuming '@/' points to your 'src' directory
// and JobDescriptionForm_with_upload is in 'src/components/recruiter/job-descriptions/'
import { JobDescriptionFormWithUpload } from '@/components/recruiter/job-descriptions/JobDescriptionForm_with_upload';
import Layout from '@/components/layout/Layout';

export default function JobDescriptionsPage() {
  return (
    <Layout>
      <JobDescriptionFormWithUpload />
    </Layout>
  );
}

