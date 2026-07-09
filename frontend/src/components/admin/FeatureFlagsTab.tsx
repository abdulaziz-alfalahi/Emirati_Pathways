import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { Power, Settings, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useFeatureFlags } from '@/components/common/FeatureFlagGuard';
import toast from 'react-hot-toast';

// Maps feature-flag key_name → frontend route (only flags with real pages)
const FLAG_ROUTE_MAP: Record<string, string> = {
  page_job_matching: '/job-matching',
  page_interview_preparation: '/interview-preparation',
  page_portfolio: '/portfolio',
  page_internships: '/internships',
  page_knowledge_camps: '/knowledge-camps',
  page_lms: '/lms',
  page_mentorship: '/mentorship',
  page_national_service: '/national-service',
  page_retiree: '/retiree',
  page_scholarships: '/scholarships',
  page_school_programs: '/school-programs',
  page_graduate_programs: '/graduate-programs',
  page_gig_marketplace: '/gig-marketplace',
  page_interactive_map: '/interactive-map',
  page_career_hub: '/career-hub',
  ai_career_simulator: '/career-simulator',
  page_cv_builder: '/cv-builder',
  page_communities: '/communities',
  page_credentials: '/credentials',
  page_analytics: '/analytics',
  page_assessments: '/assessments',
  page_financial_planning: '/financial-planning',
  page_startup_launchpad: '/startup-launchpad',
  page_training: '/training',
  page_university_programs: '/university-programs',
  page_youth_development: '/youth-development',
  page_professional_certifications: '/professional-certifications',
  operations_center: '/operations-center',
  government_dashboard: '/executive',
};

interface FeatureFlag {
  key_name: string;
  name: string;
  description: string;
  is_enabled: boolean;
}

const FeatureFlagsTab: React.FC = () => {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const { refreshFlags } = useFeatureFlags();

  useEffect(() => {
    fetchFlags();
  }, []);

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/feature-flags?t=${timestamp}`);
      if (response.data.success) {
        setFlags(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching feature flags:', error);
      toast.error('Failed to load platform modules');
    } finally {
      setLoading(false);
    }
  };

  const toggleFlag = async (key_name: string, currentStatus: boolean) => {
    const newStatus = !currentStatus;
    
    // Optimistic UI update
    setFlags(flags.map(f => f.key_name === key_name ? { ...f, is_enabled: newStatus } : f));
    
    try {
      const response = await axios.put(`/api/feature-flags/${key_name}`, { is_enabled: newStatus });
      
      if (response.data.success) {
        toast.success(response.data.message);
        // Refresh the global context so guards immediately catch the change
        refreshFlags();
      } else {
        throw new Error(response.data.message);
      }
    } catch (error) {
      console.error('Error toggling feature flag:', error);
      toast.error('Failed to update module status');
      // Revert on failure
      setFlags(flags.map(f => f.key_name === key_name ? { ...f, is_enabled: currentStatus } : f));
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900 font-dubai-bold flex items-center">
            <Settings className="w-6 h-6 mr-3 text-blue-600" />
            Platform Modules
          </h2>
          <p className="text-gray-500 mt-1 font-dubai-regular text-sm">
            Toggle platform features globally. Disabled features will display a "Coming Soon" screen to all users.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flags.map((flag) => (
          <div 
            key={flag.key_name}
            className={`relative bg-white rounded-2xl p-6 border transition-all duration-300 shadow-sm
              ${flag.is_enabled ? 'border-blue-100 hover:shadow-md' : 'border-gray-200 opacity-80'}`}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-xl flex-shrink-0 ${flag.is_enabled ? 'bg-blue-50 text-blue-600' : 'bg-gray-50 text-gray-400'}`}>
                  {flag.is_enabled ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <h3 className={`font-semibold font-dubai-bold leading-tight ${flag.is_enabled ? 'text-gray-900' : 'text-gray-500'}`}>
                  {flag.name}
                </h3>
              </div>
              
              {/* Toggle Switch */}
              <button
                onClick={() => toggleFlag(flag.key_name, flag.is_enabled)}
                className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 ${
                  flag.is_enabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={flag.is_enabled}
              >
                <span className="sr-only">Toggle {flag.name}</span>
                <span
                  aria-hidden="true"
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out flex items-center justify-center ${
                    flag.is_enabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                >
                  <Power className={`w-3 h-3 ${flag.is_enabled ? 'text-blue-600' : 'text-gray-400'}`} />
                </span>
              </button>
            </div>
            
            <p className="text-sm text-gray-500 font-dubai-regular line-clamp-2">
              {flag.description}
            </p>
            
            <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between text-xs font-medium">
              <span className="text-gray-400 font-mono">ID: {flag.key_name}</span>
              <div className="flex items-center gap-2">
                {FLAG_ROUTE_MAP[flag.key_name] && (
                  <Link
                    to={FLAG_ROUTE_MAP[flag.key_name]}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                    title={`Go to ${flag.name}`}
                  >
                    <ExternalLink className="w-3 h-3" />
                    View Page
                  </Link>
                )}
                <span className={`px-2.5 py-1 rounded-full ${flag.is_enabled ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {flag.is_enabled ? 'Active' : 'Coming Soon'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeatureFlagsTab;
