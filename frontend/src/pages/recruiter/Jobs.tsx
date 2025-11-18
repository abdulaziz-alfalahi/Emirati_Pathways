import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/layout/Layout';
import JobDescriptionsList from '@/components/recruiter/JobDescriptionsList';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecruiterJobs: React.FC = () => {
  const { user, roles, isLoading } = useAuth();
  const navigate = useNavigate();
  
  // Check if the user is authenticated
  if (!isLoading && !user) {
    return <Navigate to="/auth" replace />;
  }
  
  // Check if the user has the recruiter role
  const isRecruiter = (roles && (roles.includes('private_sector_recruiter') || roles.includes('recruiter'))) ||
                      (user?.email && user.email.includes('recruit'));
                      
  // Redirect to dashboard if not a recruiter
  if (!isLoading && !isRecruiter) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Job Descriptions</h1>
            <p className="text-muted-foreground">Manage your job postings and descriptions</p>
          </div>
          <Button onClick={() => navigate('/recruiter/jd-builder')}>
            <Plus className="h-4 w-4 mr-2" />
            Create New JD
          </Button>
        </div>
        
        <JobDescriptionsList />
      </div>
    </Layout>
  );
};

export default RecruiterJobs;
