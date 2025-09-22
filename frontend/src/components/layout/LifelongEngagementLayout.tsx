
import React from 'react';
import Layout from './Layout';

interface LifelongEngagementLayoutProps {
  children: React.ReactNode;
  heroTitle: string;
  heroDescription: string;
}

const LifelongEngagementLayout: React.FC<LifelongEngagementLayoutProps> = ({
  children,
  heroTitle,
  heroDescription,
}) => {
  return (
    <Layout>
      {/* Standardized Hero Section */}
      <section className="relative bg-gradient-to-r from-ehrdc-teal via-ehrdc-dark-teal to-ehrdc-neutral-dark text-white py-16 md:py-24 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute top-3/4 right-1/4 w-24 h-24 bg-white rounded-full transform translate-x-1/2 translate-y-1/2"></div>
          <div className="absolute top-1/2 left-3/4 w-20 h-20 bg-white rounded-full transform translate-x-1/2 -translate-y-1/2"></div>
          <div className="absolute bottom-1/4 left-1/6 w-16 h-16 bg-white rounded-full"></div>
        </div>
        
        {/* Hero Content */}
        <div className="container mx-auto px-4 max-w-7xl text-center relative z-10">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            {heroTitle}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl opacity-90 max-w-4xl mx-auto leading-relaxed">
            {heroDescription}
          </p>
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/10"></div>
      </section>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {children}
      </div>
    </Layout>
  );
};

export default LifelongEngagementLayout;
