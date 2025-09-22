import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Plus, 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Clock, 
  Building, 
  Eye, 
  Heart, 
  Send,
  Filter,
  Users,
  TrendingUp,
  Star
} from 'lucide-react';
import CreateJobDialog from '@/components/recruiter/components/CreateJobDialog';
import JobApplicationDialog from '@/components/applications/JobApplicationDialog';
import { jobService, JobData } from '@/services/jobService';
import { useToast } from '@/hooks/use-toast';

interface Job {
  id: string;
  title: string;
  company_name: string;
  location: {
    emirate: string;
    city: string;
  };
  salary?: {
    min_salary?: number;
    max_salary?: number;
    currency: string;
  };
  employment_type: string;
  experience_level: string;
  created_at: string;
  applications_count: number;
  views_count: number;
  status: string;
  emiratization_priority: boolean;
  required_skills?: string[];
  description: string;
}

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);
  const [selectedJobForApplication, setSelectedJobForApplication] = useState<Job | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmirate, setSelectedEmirate] = useState('');
  const [selectedIndustry, setSelectedIndustry] = useState('');
  const [selectedEmploymentType, setSelectedEmploymentType] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const { toast } = useToast();

  const emirates = [
    'Abu Dhabi', 'Dubai', 'Sharjah', 'Ajman', 'Umm Al Quwain', 'Ras Al Khaimah', 'Fujairah'
  ];

  const industries = [
    'Technology', 'Finance', 'Healthcare', 'Education', 'Government', 'Oil & Gas',
    'Construction', 'Tourism', 'Retail', 'Manufacturing', 'Transportation', 'Real Estate'
  ];

  const employmentTypes = [
    { value: 'full_time', label: 'Full Time' },
    { value: 'part_time', label: 'Part Time' },
    { value: 'contract', label: 'Contract' },
    { value: 'temporary', label: 'Temporary' },
    { value: 'internship', label: 'Internship' },
    { value: 'freelance', label: 'Freelance' },
  ];

  // Mock data for demonstration
  const mockJobs: Job[] = [
    {
      id: '1',
      title: 'Senior AI Engineer - D33 and Talent33',
      company_name: 'Dubai Future Foundation',
      location: { emirate: 'Dubai', city: 'Dubai' },
      salary: { min_salary: 20000, max_salary: 30000, currency: 'AED' },
      employment_type: 'full_time',
      experience_level: 'senior',
      created_at: '2024-09-13T10:00:00Z',
      applications_count: 1,
      views_count: 0,
      status: 'published',
      emiratization_priority: true,
      required_skills: ['Python', 'AI', 'Machine Learning', 'Arabic'],
      description: 'Join our team to build AI solutions supporting D33 and Talent33 and D33 Talent33 initiatives...'
    },
    {
      id: '2',
      title: 'Digital Marketing Manager',
      company_name: 'Emirates Airlines',
      location: { emirate: 'Dubai', city: 'Dubai' },
      salary: { min_salary: 15000, max_salary: 22000, currency: 'AED' },
      employment_type: 'full_time',
      experience_level: 'mid_level',
      created_at: '2024-09-12T14:30:00Z',
      applications_count: 8,
      views_count: 45,
      status: 'published',
      emiratization_priority: false,
      required_skills: ['Digital Marketing', 'Social Media', 'Analytics'],
      description: 'Lead digital marketing initiatives for Emirates Airlines...'
    },
    {
      id: '3',
      title: 'Software Engineer Intern',
      company_name: 'ADNOC',
      location: { emirate: 'Abu Dhabi', city: 'Abu Dhabi' },
      salary: { min_salary: 5000, max_salary: 8000, currency: 'AED' },
      employment_type: 'internship',
      experience_level: 'entry_level',
      created_at: '2024-09-11T09:15:00Z',
      applications_count: 23,
      views_count: 120,
      status: 'published',
      emiratization_priority: true,
      required_skills: ['JavaScript', 'React', 'Node.js'],
      description: 'Internship opportunity for UAE nationals in software development...'
    }
  ];

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    setIsLoading(true);
    try {
      const response = await jobService.getJobs({
        emirate: selectedEmirate || undefined,
        industry: selectedIndustry || undefined,
        employment_type: selectedEmploymentType || undefined,
        search: searchTerm || undefined,
      });

      if (response.success) {
        setJobs(response.data || []);
      } else {
        // Use mock data if API fails
        setJobs(mockJobs);
        console.log('Using mock data for jobs');
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
      // Use mock data as fallback
      setJobs(mockJobs);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateJob = async (jobData: JobData) => {
    try {
      const response = await jobService.createJob(jobData);
      
      if (response.success) {
        toast({
          title: "Success",
          description: "Job created successfully!",
        });
        
        // Reload jobs list
        await loadJobs();
        setIsCreateDialogOpen(false);
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to create job",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    }
  };

  const handleApplyToJob = (job: Job) => {
    setSelectedJobForApplication(job);
    setIsApplicationDialogOpen(true);
  };

  const handleApplicationSubmitted = () => {
    toast({
      title: "Application Submitted",
      description: "Your application has been submitted successfully!",
    });
    // Optionally reload jobs to update application counts
    loadJobs();
  };

  const handleSearch = () => {
    loadJobs();
  };

  const formatSalary = (job: Job) => {
    if (!job.salary) return 'Salary not specified';
    const { min_salary, max_salary, currency } = job.salary;
    if (min_salary && max_salary) {
      return `${currency} ${min_salary.toLocaleString()} - ${max_salary.toLocaleString()}`;
    } else if (min_salary) {
      return `${currency} ${min_salary.toLocaleString()}+`;
    }
    return 'Competitive salary';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'paused': return 'bg-orange-100 text-orange-800';
      case 'closed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredJobs = jobs.filter(job => {
    if (activeTab === 'emiratization' && !job.emiratization_priority) return false;
    if (activeTab === 'internships' && job.employment_type !== 'internship') return false;
    return true;
  });

  const stats = [
    { value: jobs.length.toString(), label: 'Total Jobs', icon: Briefcase },
    { value: jobs.filter(j => j.emiratization_priority).length.toString(), label: 'UAE Nationals Priority', icon: Star },
    { value: jobs.filter(j => j.employment_type === 'internship').length.toString(), label: 'Internships', icon: Users },
    { value: jobs.reduce((sum, j) => sum + j.applications_count, 0).toString(), label: 'Total Applications', icon: TrendingUp },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">🇦🇪 Find Your Perfect Job</h1>
              <p className="text-xl opacity-90">Discover opportunities aligned with D33 and Talent33 & D33 Talent33</p>
            </div>
            <Button 
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              Create Job
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-blue-600">{stat.value}</p>
                  </div>
                  <stat.icon className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Search and Filters */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Search Jobs</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="md:col-span-2">
                <Input
                  placeholder="Search jobs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
              </div>
              <Select value={selectedEmirate} onValueChange={setSelectedEmirate}>
                <SelectTrigger>
                  <SelectValue placeholder="All Emirates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Emirates</SelectItem>
                  {emirates.map((emirate) => (
                    <SelectItem key={emirate} value={emirate}>
                      {emirate}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                <SelectTrigger>
                  <SelectValue placeholder="All Industries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Industries</SelectItem>
                  {industries.map((industry) => (
                    <SelectItem key={industry} value={industry}>
                      {industry}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4 mr-2" />
                Search Jobs
              </Button>
            </div>
            
            <div className="flex items-center space-x-2 mt-4">
              <input 
                type="checkbox" 
                id="uae-nationals" 
                className="rounded"
              />
              <label htmlFor="uae-nationals" className="text-sm">
                UAE Nationals Priority
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Job Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">All Jobs</TabsTrigger>
            <TabsTrigger value="emiratization">UAE Nationals Priority</TabsTrigger>
            <TabsTrigger value="internships">Internships</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="space-y-6">
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-4 text-gray-600">Loading jobs...</p>
              </div>
            ) : filteredJobs.length === 0 ? (
              <div className="text-center py-12">
                <Briefcase className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No jobs found</h3>
                <p className="text-gray-600 mb-6">Try adjusting your search criteria or create a new job posting.</p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredJobs.map((job) => (
                  <Card key={job.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="text-xl font-semibold">{job.title}</h3>
                            {job.emiratization_priority && (
                              <Badge className="bg-red-100 text-red-800">
                                UAE Nationals Priority
                              </Badge>
                            )}
                            <Badge className="bg-blue-100 text-blue-800">
                              Innovation Role
                            </Badge>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <div className="flex items-center gap-1">
                              <Building className="h-4 w-4" />
                              {job.company_name}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              {job.location.city}
                            </div>
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-4 w-4" />
                              {formatSalary(job)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {formatDate(job.created_at)}
                            </div>
                          </div>

                          <p className="text-gray-700 mb-3 line-clamp-2">
                            {job.description}
                          </p>

                          {job.required_skills && (
                            <div className="flex flex-wrap gap-2 mb-4">
                              {job.required_skills.slice(0, 4).map((skill, index) => (
                                <Badge key={index} variant="outline">
                                  {skill}
                                </Badge>
                              ))}
                              {job.required_skills.length > 4 && (
                                <Badge variant="outline">
                                  +{job.required_skills.length - 4} more
                                </Badge>
                              )}
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{job.views_count} views</span>
                            <span>{job.applications_count} applications</span>
                            <Badge className={getStatusColor(job.status)}>
                              {job.status}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => handleApplyToJob(job)}
                        >
                          <Send className="h-4 w-4 mr-2" />
                          Apply Now
                        </Button>
                        <Button variant="outline">
                          <Heart className="h-4 w-4 mr-2" />
                          Save
                        </Button>
                        <Button variant="outline">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Create Job Dialog */}
      <CreateJobDialog
        isOpen={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onCreateJob={handleCreateJob}
      />

      {/* Job Application Dialog */}
      <JobApplicationDialog
        isOpen={isApplicationDialogOpen}
        onOpenChange={setIsApplicationDialogOpen}
        job={selectedJobForApplication}
        onApplicationSubmitted={handleApplicationSubmitted}
      />
    </div>
  );
};

export default JobsPage;

