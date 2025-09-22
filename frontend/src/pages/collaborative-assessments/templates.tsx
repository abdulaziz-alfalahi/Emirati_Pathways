
import React from 'react';
import Layout from '@/components/layout/Layout';
import { TemplateLibrary } from '@/components/collaborative-assessments/templates/TemplateLibrary';

const TemplatesPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <TemplateLibrary />
      </div>
    </Layout>
  );
};

export default TemplatesPage;
