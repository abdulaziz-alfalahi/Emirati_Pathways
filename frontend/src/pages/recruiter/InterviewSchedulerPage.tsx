import React from 'react';
import { useNavigate } from 'react-router-dom';
import Interviews from '@/components/recruiter/Interviews';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InterviewSchedulerPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="me-2 h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-bold">Interview Management</h1>
        </div>

        <Interviews />
      </div>
    </div>
  );
};

export default InterviewSchedulerPage;

