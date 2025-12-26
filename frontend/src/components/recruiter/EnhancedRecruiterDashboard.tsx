/**
 * Enhanced Recruiter Dashboard Component
 * Advanced dashboard for recruiters with candidate management, JD analysis, and UAE-specific features
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Users, FileText, BarChart3, MessageSquare, 
  Calendar, Video, Star, MapPin, Globe, Award, TrendingUp,
  Eye, Download, Edit, Trash2, Plus, RefreshCw, Settings,
  CheckCircle, AlertCircle, Clock, Target, Briefcase
} from 'lucide-react';

// Types for enhanced recruiter dashboard
interface Candidate {
  id: string;
  name: string;
  email: string;
  phone?: string;
  location: string;
  experience_years: number;
  skills: string[];
  education: string;
  current_position?: string;
  salary_expectation?: string;
  visa_status: 'sponsored' | 'own_visa' | 'uae_national' | 'requires_visa';
  availability: 'immediate' | 'notice_period' | 'flexible';
  match_score?: number;
  cultural_fit_score?: number;
  uae_experience: boolean;
  arabic_proficiency: 'none' | 'basic' | 'intermediate' | 'fluent' | 'native';
  status: 'new' | 'reviewed' | 'shortlisted' | 'interviewed' | 'offered' | 'hired' | 'rejected';
  applied_date: string;
  last_interaction?: string;
  notes?: string;
  cv_url?: string;
  profile_image?: string;
}

interface JobDescription {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'full_time' | 'part_time' | 'contract' | 'internship';
  work_mode: 'on_site' | 'remote' | 'hybrid';
  status: 'active' | 'paused' | 'closed' | 'draft';
  created_date: string;
  applications_count: number;
  views_count: number;
  shortlisted_count: number;
  hired_count: number;
  quality_score?: number;
  compliance_score?: number;
  uae_alignment_score?: number;
  optimization_potential?: string;
  processing_type: 'basic' | 'enhanced';
  requirements: {
    skills: string[];
    experience: string[];
    education: string[];
    languages: string[];
  };
  enhanced_metadata?: {
    quality_score: number;
    compliance_score: number;
    uae_alignment: number;
    optimization_potential: string;
  };
}

interface FilterOptions {
  location: string[];
  experience_range: [number, number];
  visa_status: string[];
  skills: string[];
  arabic_proficiency: string[];
  status: string[];
  match_score_min: number;
  uae_experience: boolean | null;
}

interface DashboardStats {
  total_candidates: number;
  new_applications: number;
  shortlisted: number;
  interviews_scheduled: number;
  offers_pending: number;
  active_jobs: number;
  paused_jobs: number;
  avg_match_score: number;
  avg_time_to_hire: number;
  uae_nationals_percentage: number;
  top_skills: Array<{ skill: string; count: number }>;
  location_distribution: Array<{ location: string; count: number }>;
}

const EnhancedRecruiterDashboard: React.FC = () => {
  // State management
  const [activeTab, setActiveTab] = useState<'overview' | 'candidates' | 'jobs' | 'analytics'>('overview');
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [selectedJob, setSelectedJob] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    location: [],
    experience_range: [0, 20],
    visa_status: [],
    skills: [],
    arabic_proficiency: [],
    status: [],
    match_score_min: 0,
    uae_experience: null
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  // Mock data for demonstration
  const mockCandidates: Candidate[] = [
    {
      id: 'cand_001',
      name: 'Ahmed Al Mansouri',
      email: 'ahmed.almansouri@email.com',
      phone: '+971 50 123 4567',
      location: 'Dubai, UAE',
      experience_years: 8,
      skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'MongoDB'],
      education: 'Bachelor in Computer Science',
      current_position: 'Senior Software Engineer',
      salary_expectation: 'AED 25,000 - 30,000',
      visa_status: 'uae_national',
      availability: 'notice_period',
      match_score: 92,
      cultural_fit_score: 95,
      uae_experience: true,
      arabic_proficiency: 'native',
      status: 'shortlisted',
      applied_date: '2024-12-15',
      last_interaction: '2024-12-18',
      notes: 'Excellent technical skills, strong cultural fit'
    },
    {
      id: 'cand_002',
      name: 'Sarah Johnson',
      email: 'sarah.johnson@email.com',
      phone: '+971 55 987 6543',
      location: 'Abu Dhabi, UAE',
      experience_years: 6,
      skills: ['Python', 'Django', 'PostgreSQL', 'Docker', 'Kubernetes'],
      education: 'Master in Software Engineering',
      current_position: 'Full Stack Developer',
      salary_expectation: 'AED 20,000 - 25,000',
      visa_status: 'sponsored',
      availability: 'immediate',
      match_score: 87,
      cultural_fit_score: 78,
      uae_experience: true,
      arabic_proficiency: 'intermediate',
      status: 'reviewed',
      applied_date: '2024-12-14',
      last_interaction: '2024-12-17'
    },
    {
      id: 'cand_003',
      name: 'Priya Sharma',
      email: 'priya.sharma@email.com',
      location: 'Sharjah, UAE',
      experience_years: 4,
      skills: ['Java', 'Spring Boot', 'MySQL', 'Angular', 'Jenkins'],
      education: 'Bachelor in Information Technology',
      current_position: 'Software Developer',
      salary_expectation: 'AED 15,000 - 20,000',
      visa_status: 'own_visa',
      availability: 'flexible',
      match_score: 82,
      cultural_fit_score: 85,
      uae_experience: true,
      arabic_proficiency: 'basic',
      status: 'new',
      applied_date: '2024-12-16'
    }
  ];

  const mockJobDescriptions: JobDescription[] = [
    {
      id: 'jd_001',
      title: 'Senior Software Engineer',
      company: 'TechCorp UAE',
      location: 'Dubai, UAE',
      type: 'full_time',
      work_mode: 'hybrid',
      status: 'active',
      created_date: '2024-12-10',
      applications_count: 45,
      views_count: 234,
      shortlisted_count: 8,
      hired_count: 0,
      quality_score: 85,
      compliance_score: 78,
      uae_alignment_score: 82,
      optimization_potential: 'medium',
      processing_type: 'enhanced',
      requirements: {
        skills: ['React', 'Node.js', 'TypeScript', 'AWS'],
        experience: ['5+ years software development'],
        education: ['Bachelor in Computer Science or related'],
        languages: ['English required', 'Arabic preferred']
      },
      enhanced_metadata: {
        quality_score: 85,
        compliance_score: 78,
        uae_alignment: 82,
        optimization_potential: 'medium'
      }
    },
    {
      id: 'jd_002',
      title: 'Full Stack Developer',
      company: 'Innovation Hub',
      location: 'Abu Dhabi, UAE',
      type: 'full_time',
      work_mode: 'on_site',
      status: 'active',
      created_date: '2024-12-12',
      applications_count: 32,
      views_count: 187,
      shortlisted_count: 6,
      hired_count: 1,
      quality_score: 92,
      compliance_score: 88,
      uae_alignment_score: 90,
      optimization_potential: 'low',
      processing_type: 'enhanced',
      requirements: {
        skills: ['Python', 'Django', 'React', 'PostgreSQL'],
        experience: ['3+ years full stack development'],
        education: ['Bachelor degree in relevant field'],
        languages: ['English fluent']
      }
    }
  ];

  const mockDashboardStats: DashboardStats = {
    total_candidates: 156,
    new_applications: 23,
    shortlisted: 34,
    interviews_scheduled: 12,
    offers_pending: 5,
    active_jobs: 8,
    paused_jobs: 2,
    avg_match_score: 78.5,
    avg_time_to_hire: 18,
    uae_nationals_percentage: 35,
    top_skills: [
      { skill: 'React', count: 45 },
      { skill: 'Node.js', count: 38 },
      { skill: 'Python', count: 34 },
      { skill: 'AWS', count: 29 },
      { skill: 'TypeScript', count: 27 }
    ],
    location_distribution: [
      { location: 'Dubai', count: 67 },
      { location: 'Abu Dhabi', count: 43 },
      { location: 'Sharjah', count: 28 },
      { location: 'Other Emirates', count: 18 }
    ]
  };

  // Initialize data
  useEffect(() => {
    setCandidates(mockCandidates);
    setJobDescriptions(mockJobDescriptions);
    setDashboardStats(mockDashboardStats);
  }, []);

  // Filter candidates based on search and filters
  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         candidate.skills.some(skill => skill.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesJob = selectedJob === 'all' || candidate.id.includes(selectedJob);
    
    const matchesFilters = (
      (filters.location.length === 0 || filters.location.some(loc => candidate.location.includes(loc))) &&
      (candidate.experience_years >= filters.experience_range[0] && candidate.experience_years <= filters.experience_range[1]) &&
      (filters.visa_status.length === 0 || filters.visa_status.includes(candidate.visa_status)) &&
      (filters.skills.length === 0 || filters.skills.some(skill => candidate.skills.includes(skill))) &&
      (filters.arabic_proficiency.length === 0 || filters.arabic_proficiency.includes(candidate.arabic_proficiency)) &&
      (filters.status.length === 0 || filters.status.includes(candidate.status)) &&
      ((candidate.match_score || 0) >= filters.match_score_min) &&
      (filters.uae_experience === null || candidate.uae_experience === filters.uae_experience)
    );

    return matchesSearch && matchesJob && matchesFilters;
  });

  // Handle candidate selection
  const handleCandidateSelect = (candidateId: string) => {
    setSelectedCandidates(prev => 
      prev.includes(candidateId) 
        ? prev.filter(id => id !== candidateId)
        : [...prev, candidateId]
    );
  };

  // Handle bulk actions
  const handleBulkAction = (action: string) => {
    console.log(`Performing ${action} on candidates:`, selectedCandidates);
    // Implement bulk actions (shortlist, reject, message, etc.)
    setSelectedCandidates([]);
  };

  // Render candidate status badge
  const renderStatusBadge = (status: string) => {
    const statusConfig = {
      new: { color: 'bg-blue-100 text-blue-800', icon: Clock },
      reviewed: { color: 'bg-yellow-100 text-yellow-800', icon: Eye },
      shortlisted: { color: 'bg-green-100 text-green-800', icon: Star },
      interviewed: { color: 'bg-purple-100 text-purple-800', icon: Video },
      offered: { color: 'bg-orange-100 text-orange-800', icon: Award },
      hired: { color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle },
      rejected: { color: 'bg-red-100 text-red-800', icon: AlertCircle }
    };

    const config = statusConfig[status as keyof typeof statusConfig];
    const Icon = config?.icon || Clock;

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    );
  };

  // Render visa status badge
  const renderVisaStatusBadge = (visaStatus: string) => {
    const visaConfig = {
      uae_national: { color: 'bg-emerald-100 text-emerald-800', label: 'UAE National' },
      sponsored: { color: 'bg-blue-100 text-blue-800', label: 'Sponsored' },
      own_visa: { color: 'bg-green-100 text-green-800', label: 'Own Visa' },
      requires_visa: { color: 'bg-orange-100 text-orange-800', label: 'Requires Visa' }
    };

    const config = visaConfig[visaStatus as keyof typeof visaConfig];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        {config?.label || visaStatus}
      </span>
    );
  };

  // Render Arabic proficiency badge
  const renderArabicProficiencyBadge = (proficiency: string) => {
    const proficiencyConfig = {
      native: { color: 'bg-emerald-100 text-emerald-800', label: 'Native' },
      fluent: { color: 'bg-green-100 text-green-800', label: 'Fluent' },
      intermediate: { color: 'bg-yellow-100 text-yellow-800', label: 'Intermediate' },
      basic: { color: 'bg-orange-100 text-orange-800', label: 'Basic' },
      none: { color: 'bg-gray-100 text-gray-800', label: 'None' }
    };

    const config = proficiencyConfig[proficiency as keyof typeof proficiencyConfig];

    return (
      <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${config?.color || 'bg-gray-100 text-gray-800'}`}>
        Arabic: {config?.label || proficiency}
      </span>
    );
  };

  // Render overview tab
  const renderOverviewTab = () => (
    <div className="space-y-6">
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Candidates</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.total_candidates}</p>
            </div>
            <Users className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">New Applications</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.new_applications}</p>
            </div>
            <Plus className="h-8 w-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div>
            <p className="text-sm font-medium text-gray-600">Shortlisted</p>
            <p className="text-2xl font-bold text-gray-900">{dashboardStats?.shortlisted}</p>
          </div>
          <Star className="h-8 w-8 text-yellow-600" />
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Interviews Scheduled</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardStats?.interviews_scheduled}</p>
            </div>
            <Calendar className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <FileText className="h-5 w-5 mr-2" />
            Create New JD
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <MessageSquare className="h-5 w-5 mr-2" />
            Send Messages
          </button>
          <button className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50">
            <BarChart3 className="h-5 w-5 mr-2" />
            View Analytics
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CheckCircle className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">Ahmed Al Mansouri was shortlisted for Senior Software Engineer</p>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Plus className="h-5 w-5 text-blue-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">New application received for Full Stack Developer</p>
              <p className="text-sm text-gray-500">4 hours ago</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <Calendar className="h-5 w-5 text-purple-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-gray-900">Interview scheduled with Sarah Johnson</p>
              <p className="text-sm text-gray-500">6 hours ago</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render candidates tab
  const renderCandidatesTab = () => (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex-1 max-w-lg">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={selectedJob}
              onChange={(e) => setSelectedJob(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Jobs</option>
              {jobDescriptions.map(job => (
                <option key={job.id} value={job.id}>{job.title}</option>
              ))}
            </select>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </button>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <FileText className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
              >
                <Users className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
                <select 
                  multiple 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option>Dubai</option>
                  <option>Abu Dhabi</option>
                  <option>Sharjah</option>
                  <option>Other Emirates</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Visa Status</label>
                <select 
                  multiple 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="uae_national">UAE National</option>
                  <option value="sponsored">Sponsored</option>
                  <option value="own_visa">Own Visa</option>
                  <option value="requires_visa">Requires Visa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Arabic Proficiency</label>
                <select 
                  multiple 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="native">Native</option>
                  <option value="fluent">Fluent</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="basic">Basic</option>
                  <option value="none">None</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Min Match Score</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.match_score_min}
                  onChange={(e) => setFilters(prev => ({ ...prev, match_score_min: parseInt(e.target.value) }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{filters.match_score_min}%</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCandidates.length > 0 && (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-blue-900">
              {selectedCandidates.length} candidate(s) selected
            </span>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleBulkAction('shortlist')}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
              >
                Shortlist
              </button>
              <button
                onClick={() => handleBulkAction('message')}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Message
              </button>
              <button
                onClick={() => handleBulkAction('reject')}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidates List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Candidates ({filteredCandidates.length})
          </h3>
        </div>
        
        <div className="divide-y divide-gray-200">
          {filteredCandidates.map((candidate) => (
            <div key={candidate.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start space-x-4">
                <input
                  type="checkbox"
                  checked={selectedCandidates.includes(candidate.id)}
                  onChange={() => handleCandidateSelect(candidate.id)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h4 className="text-lg font-medium text-gray-900">{candidate.name}</h4>
                        {renderStatusBadge(candidate.status)}
                        {candidate.match_score && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            <Target className="w-3 h-3 mr-1" />
                            {candidate.match_score}% match
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-4 text-sm text-gray-500">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {candidate.location}
                        </span>
                        <span className="flex items-center">
                          <Briefcase className="w-4 h-4 mr-1" />
                          {candidate.experience_years} years exp.
                        </span>
                        {candidate.current_position && (
                          <span>{candidate.current_position}</span>
                        )}
                      </div>
                      
                      <div className="mt-3 flex flex-wrap gap-2">
                        {renderVisaStatusBadge(candidate.visa_status)}
                        {renderArabicProficiencyBadge(candidate.arabic_proficiency)}
                        {candidate.uae_experience && (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-emerald-100 text-emerald-800">
                            UAE Experience
                          </span>
                        )}
                      </div>
                      
                      <div className="mt-3">
                        <div className="flex flex-wrap gap-1">
                          {candidate.skills.slice(0, 5).map((skill, index) => (
                            <span key={index} className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              {skill}
                            </span>
                          ))}
                          {candidate.skills.length > 5 && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800">
                              +{candidate.skills.length - 5} more
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Calendar className="h-4 w-4" />
                      </button>
                      <button className="p-2 text-gray-400 hover:text-gray-600">
                        <Download className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render jobs tab
  const renderJobsTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Job Descriptions</h3>
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Create New JD
            </button>
          </div>
        </div>
        
        <div className="divide-y divide-gray-200">
          {jobDescriptions.map((job) => (
            <div key={job.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h4 className="text-lg font-medium text-gray-900">{job.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      job.status === 'active' ? 'bg-green-100 text-green-800' : 
                      job.status === 'paused' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                    </span>
                    {job.processing_type === 'enhanced' && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        AI Enhanced
                      </span>
                    )}
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    {job.company} • {job.location} • {job.type.replace('_', ' ')} • {job.work_mode.replace('_', ' ')}
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-900">{job.applications_count}</span>
                      <span className="text-gray-500 ml-1">Applications</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{job.views_count}</span>
                      <span className="text-gray-500 ml-1">Views</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{job.shortlisted_count}</span>
                      <span className="text-gray-500 ml-1">Shortlisted</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-900">{job.hired_count}</span>
                      <span className="text-gray-500 ml-1">Hired</span>
                    </div>
                  </div>
                  
                  {job.enhanced_metadata && (
                    <div className="mt-4 flex items-center space-x-4 text-sm">
                      <div className="flex items-center">
                        <span className="text-gray-500">Quality:</span>
                        <span className="ml-1 font-medium text-gray-900">{job.enhanced_metadata.quality_score}%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500">Compliance:</span>
                        <span className="ml-1 font-medium text-gray-900">{job.enhanced_metadata.compliance_score}%</span>
                      </div>
                      <div className="flex items-center">
                        <span className="text-gray-500">UAE Alignment:</span>
                        <span className="ml-1 font-medium text-gray-900">{job.enhanced_metadata.uae_alignment}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Eye className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <BarChart3 className="h-4 w-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:text-gray-600">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // Render analytics tab
  const renderAnalyticsTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Skills */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Top Skills in Demand</h3>
          <div className="space-y-3">
            {dashboardStats?.top_skills.map((skill, index) => (
              <div key={skill.skill} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full" 
                      style={{ width: `${(skill.count / 50) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{skill.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Location Distribution */}
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Candidate Distribution</h3>
          <div className="space-y-3">
            {dashboardStats?.location_distribution.map((location) => (
              <div key={location.location} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">{location.location}</span>
                <div className="flex items-center space-x-2">
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full" 
                      style={{ width: `${(location.count / 70) * 100}%` }}
                    ></div>
                  </div>
                  <span className="text-sm text-gray-500">{location.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{dashboardStats?.avg_match_score.toFixed(1)}%</div>
            <div className="text-sm text-gray-500">Average Match Score</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{dashboardStats?.avg_time_to_hire}</div>
            <div className="text-sm text-gray-500">Days to Hire</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">{dashboardStats?.uae_nationals_percentage}%</div>
            <div className="text-sm text-gray-500">UAE Nationals</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">Recruiter Dashboard</h1>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Enhanced AI
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <RefreshCw className="h-5 w-5" />
              </button>
              <button className="p-2 text-gray-400 hover:text-gray-600">
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', label: 'Overview', icon: BarChart3 },
              { id: 'candidates', label: 'Candidates', icon: Users },
              { id: 'jobs', label: 'Job Descriptions', icon: FileText },
              { id: 'analytics', label: 'Analytics', icon: TrendingUp }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center px-1 py-4 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'candidates' && renderCandidatesTab()}
        {activeTab === 'jobs' && renderJobsTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
      </div>
    </div>
  );
};

export default EnhancedRecruiterDashboard;

