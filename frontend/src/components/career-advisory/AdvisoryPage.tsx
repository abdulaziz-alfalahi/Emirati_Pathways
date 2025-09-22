
import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import AdvisoryDashboard from './AdvisoryDashboard';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

const AdvisoryPage: React.FC = () => {
  return (
    <Layout>
      <div className="container py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Career Advisory</h1>
          <Link to="/career-advisory/schedule">
            <Button className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Schedule Session
            </Button>
          </Link>
        </div>
        <AdvisoryDashboard />
      </div>
    </Layout>
  );
};

export default AdvisoryPage;
