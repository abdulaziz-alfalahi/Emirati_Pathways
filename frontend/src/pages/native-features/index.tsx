
import React from 'react';
import MobileLayout from '@/components/mobile/MobileLayout';
import MobileNativeFeatures from '@/components/mobile/MobileNativeFeatures';

const NativeFeaturesPage: React.FC = () => {
  return (
    <MobileLayout>
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
          <h1 className="text-xl font-bold text-gray-900">
            Native Features
          </h1>
          <p className="text-sm text-gray-600">
            Test device capabilities and integrations
          </p>
        </div>
        <MobileNativeFeatures />
      </div>
    </MobileLayout>
  );
};

export default NativeFeaturesPage;
