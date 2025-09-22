
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { ReportDashboard } from '@/components/collaborative-assessments/reports/ReportDashboard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const AssessmentReportPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  if (!id) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-destructive">Report Not Found</h1>
            <p className="text-muted-foreground mt-2">
              The assessment report you're looking for doesn't exist.
            </p>
            <Button 
              onClick={() => navigate('/collaborative-assessments')}
              className="mt-4"
            >
              Back to Assessments
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/collaborative-assessments')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Assessments
          </Button>
        </div>
        
        <ReportDashboard assessmentId={id} />
      </div>
    </Layout>
  );
};

export default AssessmentReportPage;
