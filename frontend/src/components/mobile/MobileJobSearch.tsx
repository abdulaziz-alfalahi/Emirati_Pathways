import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Filter, 
  MapPin, 
  Clock, 
  DollarSign, 
  Briefcase, 
  Heart, 
  Share2, 
  ChevronRight,
  Star,
  Building,
  Users,
  Calendar,
  Bookmark,
  BookmarkCheck,
  Eye,
  Send,
  X,
  SlidersHorizontal,
  Zap,
  TrendingUp,
  Award,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import { restClient } from '@/utils/api';

// Types
interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary_range: string;
  employment_type: string;
  posted_date: string;
  description: string;
  requirements: string[];
  benefits: string[];
  is_emiratization_target: boolean;
  match_score?: number;
  is_saved?: boolean;
  is_applied?: boolean;
  company_logo?: string;
  urgency?: 'low' | 'medium' | 'high';
  remote_option?: boolean;
}

interface SearchFilters {
  query: string;
  location: string;
  salary_min: number;
  salary_max: number;
  employment_type: string;
  experience_level: string;
  company_size: string;
  emiratization_only: boolean;
  remote_only: boolean;
  posted_within: string;
}

interface MobileJobSearchProps {
  authToken: string;
  userProfile?: any;
}

// Radix's Select throws if a SelectItem has value="", so the "no filter" option
// needs a sentinel. It is mapped back to '' in state, which the query builder
// already treats as "omit this filter".
const ALL_FILTER_VALUE = '__all__';

const MobileJobSearch: React.FC<MobileJobSearchProps> = ({
  authToken,
  userProfile
}) => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    salary_min: 0,
    salary_max: 100000,
    employment_type: '',
    experience_level: '',
    company_size: '',
    emiratization_only: false,
    remote_only: false,
    posted_within: ''
  });
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<Set<string>>(new Set());
  const [appliedJobs, setAppliedJobs] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState('search');
  const [showFilters, setShowFilters] = useState(false);

  // Load jobs
  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams();
      if (searchFilters.query) params.append('q', searchFilters.query);
      if (searchFilters.location) params.append('location', searchFilters.location);
      if (searchFilters.employment_type) params.append('type', searchFilters.employment_type);
      if (searchFilters.emiratization_only) params.append('emiratization', 'true');
      if (searchFilters.remote_only) params.append('remote', 'true');
      
      const response = await restClient.get(`/api/jobs?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        setJobs(response.data.jobs || []);
      }
    } catch (error) {
      console.error('Failed to load jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  }, [authToken, searchFilters]);

  // Load saved and applied jobs
  const loadUserJobData = useCallback(async () => {
    try {
      const [savedResponse, appliedResponse] = await Promise.all([
        restClient.get('/api/jobs/saved', {
          headers: { Authorization: `Bearer ${authToken}` }
        }),
        restClient.get('/api/applications', {
          headers: { Authorization: `Bearer ${authToken}` }
        })
      ]);

      if (savedResponse.data.success) {
        setSavedJobs(new Set(savedResponse.data.saved_jobs?.map((job: any) => job.id) || []));
      }

      if (appliedResponse.data.success) {
        setAppliedJobs(new Set(appliedResponse.data.applications?.map((app: any) => app.job_id) || []));
      }
    } catch (error) {
      console.error('Failed to load user job data:', error);
    }
  }, [authToken]);

  // Save/unsave job
  const toggleSaveJob = async (jobId: string) => {
    try {
      const isSaved = savedJobs.has(jobId);
      
      if (isSaved) {
        await restClient.delete(`/api/jobs/${jobId}/save`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSavedJobs(prev => {
          const newSet = new Set(prev);
          newSet.delete(jobId);
          return newSet;
        });
        toast.success('Job removed from saved');
      } else {
        await restClient.post(`/api/jobs/${jobId}/save`, {}, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        setSavedJobs(prev => new Set(prev).add(jobId));
        toast.success('Job saved successfully');
      }
    } catch (error) {
      console.error('Failed to toggle save job:', error);
      toast.error('Failed to update saved job');
    }
  };

  // Apply to job
  const applyToJob = async (jobId: string) => {
    try {
      const response = await restClient.post(`/api/jobs/${jobId}/apply`, {
        cover_letter: `I am interested in applying for this position. My profile demonstrates the skills and experience required for this role.`
      }, {
        headers: { Authorization: `Bearer ${authToken}` }
      });

      if (response.data.success) {
        setAppliedJobs(prev => new Set(prev).add(jobId));
        toast.success('Application submitted successfully');
      }
    } catch (error) {
      console.error('Failed to apply to job:', error);
      toast.error('Failed to submit application');
    }
  };

  // Load data on mount
  useEffect(() => {
    loadJobs();
    loadUserJobData();
  }, [loadJobs, loadUserJobData]);

  // Format salary
  const formatSalary = (salaryRange: string): string => {
    return salaryRange.replace(/(\d+)k/g, '$1,000 AED');
  };

  // Get urgency color
  const getUrgencyColor = (urgency?: string): string => {
    switch (urgency) {
      case 'high': return 'text-red-600 bg-red-50';
      case 'medium': return 'text-orange-600 bg-orange-50';
      default: return 'text-green-600 bg-green-50';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  // Job Card Component
  const JobCard: React.FC<{ job: Job; onSelect: (job: Job) => void }> = ({ job, onSelect }) => {
    const isSaved = savedJobs.has(job.id);
    const isApplied = appliedJobs.has(job.id);

    return (
      <Card className="mb-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                  {job.title}
                </h3>
                {job.match_score && job.match_score > 80 && (
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    <Star className="h-3 w-3 mr-1" />
                    {job.match_score}% match
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                <Building className="h-4 w-4" />
                <span>{job.company}</span>
                {job.is_emiratization_target && (
                  <Badge variant="outline" className="text-xs">
                    <Award className="h-3 w-3 mr-1" />
                    Emiratization
                  </Badge>
                )}
              </div>

              <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1" />
                  {job.location}
                </div>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatSalary(job.salary_range)}
                </div>
                <div className="flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatTimeAgo(job.posted_date)}
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <Badge variant="outline">{job.employment_type}</Badge>
                {job.remote_option && (
                  <Badge variant="outline" className="bg-blue-50 text-blue-700">
                    <Globe className="h-3 w-3 mr-1" />
                    Remote
                  </Badge>
                )}
                {job.urgency && (
                  <Badge className={getUrgencyColor(job.urgency)}>
                    <Zap className="h-3 w-3 mr-1" />
                    {job.urgency} priority
                  </Badge>
                )}
              </div>

              <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                {job.description}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleSaveJob(job.id)}
                className={isSaved ? 'bg-blue-50 text-blue-700' : ''}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => onSelect(job)}
              >
                <Eye className="h-4 w-4 mr-1" />
                View
              </Button>
            </div>

            <Button
              size="sm"
              onClick={() => applyToJob(job.id)}
              disabled={isApplied}
              className={isApplied ? 'bg-green-100 text-green-800' : ''}
            >
              {isApplied ? (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Applied
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-1" />
                  Apply
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Job Detail Sheet
  const JobDetailSheet: React.FC<{ job: Job; onClose: () => void }> = ({ job, onClose }) => {
    const isSaved = savedJobs.has(job.id);
    const isApplied = appliedJobs.has(job.id);

    return (
      <Sheet open={!!job} onOpenChange={() => onClose()}>
        <SheetContent side="bottom" className="h-[90vh]">
          <SheetHeader className="pb-4">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-left">{job.title}</SheetTitle>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="h-full pb-20">
            <div className="space-y-6">
              {/* Company Info */}
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                  <Building className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <h3 className="font-semibold">{job.company}</h3>
                  <p className="text-sm text-gray-600">{job.location}</p>
                </div>
              </div>

              {/* Job Details */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Salary</Label>
                  <p className="text-sm">{formatSalary(job.salary_range)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm">{job.employment_type}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Posted</Label>
                  <p className="text-sm">{formatTimeAgo(job.posted_date)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Match Score</Label>
                  <p className="text-sm">{job.match_score || 'N/A'}%</p>
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <Label className="text-sm font-medium mb-2 block">Job Description</Label>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">{job.description}</p>
              </div>

              {/* Requirements */}
              {job.requirements && job.requirements.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Requirements</Label>
                  <ul className="space-y-1">
                    {job.requirements.map((req, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {req}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Benefits */}
              {job.benefits && job.benefits.length > 0 && (
                <div>
                  <Label className="text-sm font-medium mb-2 block">Benefits</Label>
                  <ul className="space-y-1">
                    {job.benefits.map((benefit, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-2 flex-shrink-0" />
                        {benefit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </ScrollArea>

          {/* Action Buttons */}
          <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => toggleSaveJob(job.id)}
                className={isSaved ? 'bg-blue-50 text-blue-700' : ''}
              >
                {isSaved ? <BookmarkCheck className="h-4 w-4 mr-1" /> : <Bookmark className="h-4 w-4 mr-1" />}
                {isSaved ? 'Saved' : 'Save'}
              </Button>
              
              <Button
                className="flex-1"
                onClick={() => applyToJob(job.id)}
                disabled={isApplied}
              >
                {isApplied ? (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Applied
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-1" />
                    Apply Now
                  </>
                )}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    );
  };

  // Filter Sheet
  const FilterSheet: React.FC = () => (
    <Sheet open={showFilters} onOpenChange={setShowFilters}>
      <SheetContent side="bottom" className="h-[80vh]">
        <SheetHeader>
          <SheetTitle>Filter Jobs</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-full pb-20">
          <div className="space-y-6 py-4">
            {/* Location */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Location</Label>
              <Select
                value={searchFilters.location || ALL_FILTER_VALUE}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, location: value === ALL_FILTER_VALUE ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All Locations</SelectItem>
                  <SelectItem value="Dubai">Dubai</SelectItem>
                  <SelectItem value="Abu Dhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="Sharjah">Sharjah</SelectItem>
                  <SelectItem value="Ajman">Ajman</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Employment Type */}
            <div>
              <Label className="text-sm font-medium mb-2 block">Employment Type</Label>
              <Select
                value={searchFilters.employment_type || ALL_FILTER_VALUE}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, employment_type: value === ALL_FILTER_VALUE ? '' : value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_FILTER_VALUE}>All Types</SelectItem>
                  <SelectItem value="Full-time">Full-time</SelectItem>
                  <SelectItem value="Part-time">Part-time</SelectItem>
                  <SelectItem value="Contract">Contract</SelectItem>
                  <SelectItem value="Internship">Internship</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Salary Range */}
            <div>
              <Label className="text-sm font-medium mb-2 block">
                Salary Range: {searchFilters.salary_min.toLocaleString()} - {searchFilters.salary_max.toLocaleString()} AED
              </Label>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs text-gray-500">Minimum</Label>
                  <Slider
                    value={[searchFilters.salary_min]}
                    onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, salary_min: value }))}
                    max={100000}
                    step={5000}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label className="text-xs text-gray-500">Maximum</Label>
                  <Slider
                    value={[searchFilters.salary_max]}
                    onValueChange={([value]) => setSearchFilters(prev => ({ ...prev, salary_max: value }))}
                    max={200000}
                    step={5000}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="emiratization-only">Emiratization Targets Only</Label>
                <Switch
                  id="emiratization-only"
                  checked={searchFilters.emiratization_only}
                  onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, emiratization_only: checked }))}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="remote-only">Remote Work Available</Label>
                <Switch
                  id="remote-only"
                  checked={searchFilters.remote_only}
                  onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, remote_only: checked }))}
                />
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Filter Actions */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t">
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={() => {
                setSearchFilters({
                  query: '',
                  location: '',
                  salary_min: 0,
                  salary_max: 100000,
                  employment_type: '',
                  experience_level: '',
                  company_size: '',
                  emiratization_only: false,
                  remote_only: false,
                  posted_within: ''
                });
              }}
            >
              Clear All
            </Button>
            <Button
              className="flex-1"
              onClick={() => {
                setShowFilters(false);
                loadJobs();
              }}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Search Header */}
      <div className="bg-white border-b border-gray-200 p-4 space-y-3">
        <div className="flex space-x-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search jobs..."
              value={searchFilters.query}
              onChange={(e) => setSearchFilters(prev => ({ ...prev, query: e.target.value }))}
              className="pl-10"
              onKeyPress={(e) => e.key === 'Enter' && loadJobs()}
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            aria-label="Filter jobs"
            onClick={() => setShowFilters(true)}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Active Filters */}
        {(searchFilters.location || searchFilters.employment_type || searchFilters.emiratization_only || searchFilters.remote_only) && (
          <div className="flex flex-wrap gap-2">
            {searchFilters.location && (
              <Badge variant="secondary">
                Location: {searchFilters.location}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSearchFilters(prev => ({ ...prev, location: '' }))}
                />
              </Badge>
            )}
            {searchFilters.employment_type && (
              <Badge variant="secondary">
                Type: {searchFilters.employment_type}
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSearchFilters(prev => ({ ...prev, employment_type: '' }))}
                />
              </Badge>
            )}
            {searchFilters.emiratization_only && (
              <Badge variant="secondary">
                Emiratization Only
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSearchFilters(prev => ({ ...prev, emiratization_only: false }))}
                />
              </Badge>
            )}
            {searchFilters.remote_only && (
              <Badge variant="secondary">
                Remote Only
                <X 
                  className="h-3 w-3 ml-1 cursor-pointer" 
                  onClick={() => setSearchFilters(prev => ({ ...prev, remote_only: false }))}
                />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Searching jobs...</p>
            </div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No jobs found</h3>
              <p className="text-gray-600">Try adjusting your search criteria</p>
            </div>
          </div>
        ) : (
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {jobs.length} job{jobs.length !== 1 ? 's' : ''} found
              </p>
              <Button variant="ghost" size="sm" onClick={loadJobs}>
                <TrendingUp className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>

            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onSelect={setSelectedJob}
              />
            ))}
          </div>
        )}
      </div>

      {/* Job Detail Sheet */}
      {selectedJob && (
        <JobDetailSheet
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
        />
      )}

      {/* Filter Sheet */}
      <FilterSheet />
    </div>
  );
};

export default MobileJobSearch;
