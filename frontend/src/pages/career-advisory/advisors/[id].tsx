
import React from 'react';
import Layout from '@/components/layout/Layout';
import AdvisorPortfolio from '@/components/career-advisory/AdvisorPortfolio';

const AdvisorPortfolioPage: React.FC = () => {
  return (
    <Layout>
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-6">Advisor Profile</h1>
        <AdvisorPortfolio />
      </div>
    </Layout>
  );
};

export default AdvisorPortfolioPage;
