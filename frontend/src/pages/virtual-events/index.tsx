
import React from 'react';
import Layout from '@/components/layout/Layout';
import VirtualEventsGrid from '@/components/virtual-events/VirtualEventsGrid';

const VirtualEventsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <VirtualEventsGrid />
      </div>
    </Layout>
  );
};

export default VirtualEventsPage;
