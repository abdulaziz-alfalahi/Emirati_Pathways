import React from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import HybridGovernmentNavFixed from '@/components/layout/HybridGovernmentNavFixed';
import JobDescriptionsList from '@/components/recruiter/JobDescriptionsList';
import { Button } from '@/components/ui/button';
import { Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const RecruiterJobs: React.FC = () => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-dubai-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if the user is authenticated
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Check if the user has the recruiter role
  const roles = user.roles || [];
  const isRecruiter = (roles && (roles.includes('private_sector_recruiter') || roles.includes('recruiter'))) ||
    (user?.email && user.email.includes('recruit'));

  // Redirect to dashboard if not a recruiter
  if (!isRecruiter) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 font-dubai">
      {/* Navigation */}
      <HybridGovernmentNavFixed showAuthButtons={true} />

      {/* Main Content */}
      <div className="pt-24 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Link to="/recruiter-dashboard" className="text-slate-500 hover:text-teal-600 transition-colors">
                  <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-3xl font-dubai-bold text-slate-900">Job Descriptions</h1>
              </div>
              <p className="text-slate-600 font-dubai-medium ml-7">Manage your job postings and descriptions</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="font-dubai-medium"
                onClick={() => navigate('/recruiter/batch-upload')}
              >
                Batch Upload
              </Button>
              <Button
                className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium"
                onClick={() => navigate('/recruiter/jd-builder')}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New JD
              </Button>
            </div>
          </div>

          <JobDescriptionsList />
        </div>
      </div>
    </div>
  );
};

export default RecruiterJobs;
