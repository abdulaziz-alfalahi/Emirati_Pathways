import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';
import {
  Upload,
  FileText,
  Plus,
  Eye,
  Users,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  MapPin,
  Briefcase,
  Trash2,
  Search,
  Settings,
  UserPlus,
  ChevronRight,
  Calendar
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { restClient, healthApi, jobApi, type JobDescription } from '@/utils/api';
import { JobApplicantsView } from './JobApplicantsView';

// Interface for applicant counts
interface ApplicantCount {
  job_id: string;
  job_title: string;
  total_applicants: number;
  new_applicants: number;
  in_review: number;
  in_interview: number;
  offers_made: number;
  last_application_date: string | null;
}

const JobDescriptionsList = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State management
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isTextInputOpen, setIsTextInputOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [jobText, setJobText] = useState('');
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [selectedJobForApplicants, setSelectedJobForApplicants] = useState<any | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobDescription | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Fetch job descriptions from Flask backend
  const { data: jobDescriptions, isLoading, refetch } = useQuery({
    queryKey: ['jobDescriptions'],
    queryFn: async () => {
      const response = await restClient.get('/api/recruiter/jd/list');

      if (!response.data) {
        throw new Error('Failed to fetch job descriptions');
      }

      // The API returns { job_descriptions: [...], count: ... }
      return response.data.job_descriptions || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Fetch applicant counts for all jobs
  const { data: applicantCounts } = useQuery({
    queryKey: ['applicantCounts'],
    queryFn: async () => {
      try {
        const response = await restClient.get('/api/recruiter/job-applicants-count');
        if (response.data?.success) {
          return response.data.data as ApplicantCount[];
        }
        return [];
      } catch (error) {
        console.error('Failed to fetch applicant counts:', error);
        return [];
      }
    },
    refetchInterval: 30000,
  });

  // Check backend health
  const { data: healthStatus } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await healthApi.check();
      return response.success ? response.data : null;
    },
    refetchInterval: 60000, // Check health every minute
  });

  // If viewing applicants for a specific job, show the applicants view
  if (selectedJobForApplicants) {
    return (
      <JobApplicantsView
        job={selectedJobForApplicants}
        onBack={() => setSelectedJobForApplicants(null)}
      />
    );
  }

  // Helper to get applicant count for a job
  const getApplicantCount = (jobId: string): ApplicantCount | undefined => {
    return applicantCounts?.find(ac => ac.job_id === jobId);
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const file = files[0];

      // Validate file type
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'
      ];

      if (!allowedTypes.includes(file.type)) {
        throw new Error('Please upload a PDF, Word document, or text file');
      }

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Parse the job description
      const response = await jobApi.parse(file);

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (response.success && response.data) {
        toast({
          title: 'Job Description Parsed Successfully!',
          description: `Extracted job details with ${response.data.completeness_score || 0}% confidence`,
        });

        // Refetch the list to include the new job
        refetch();
        setIsUploadOpen(false);

        // Show preview of parsed data
        if (response.data.data) {
          setSelectedJob(response.data.data);
          setIsPreviewOpen(true);
        }
      } else {
        throw new Error(response.error || 'Failed to parse job description');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Upload Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle text input parsing
  const handleTextParsing = async () => {
    if (!jobText.trim()) {
      toast({
        variant: 'destructive',
        title: 'No Text Provided',
        description: 'Please enter job description text to parse',
      });
      return;
    }

    setIsUploading(true);

    try {
      const response = await jobApi.parseText(jobText);

      if (response.success && response.data) {
        toast({
          title: 'Job Description Parsed Successfully!',
          description: `Extracted job details with ${response.data.completeness_score || 0}% confidence`,
        });

        // Refetch the list to include the new job
        refetch();
        setIsTextInputOpen(false);
        setJobText('');

        // Show preview of parsed data
        if (response.data.data) {
          setSelectedJob(response.data.data);
          setIsPreviewOpen(true);
        }
      } else {
        throw new Error(response.error || 'Failed to parse job description');
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Parsing Failed',
        description: error instanceof Error ? error.message : 'Unknown error occurred',
      });
    } finally {
      setIsUploading(false);
    }
  };

  // View job details
  const handleViewJob = (job: JobDescription) => {
    setSelectedJob(job);
    setIsPreviewOpen(true);
  };

  // Handle delete click
  const handleDeleteClick = (job: JobDescription) => {
    setJobToDelete(job);
    setIsDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDeleteJob = async () => {
    if (!jobToDelete) return;

    const jdId = jobToDelete.jd_id || jobToDelete.id;

    try {
      const response = await jobApi.delete(jdId);

      if (response.success) {
        toast({
          title: 'Job Deleted',
          description: 'Job description has been successfully deleted.',
        });
        refetch();
      } else {
        throw new Error(response.error || 'Failed to delete job');
      }
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: error.message || 'An error occurred while deleting the job.',
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setJobToDelete(null);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">My Jobs</h2>
          <p className="text-muted-foreground">
            Manage your job postings and view applicants
          </p>
        </div>
      </div>

      {/* Health Status */}
      {healthStatus && (
        <Card className="border-green-200 bg-green-50 dark:bg-green-950/20">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800 dark:text-green-200">
                Backend connected - JD Parsing: {healthStatus?.features?.jd_parsing ? 'Active' : 'Inactive'}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Job Descriptions List */}
      {isLoading ? (
        <Card>
          <CardContent className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {jobDescriptions && jobDescriptions.length > 0 ? (
            jobDescriptions.map((job: any) => {
              const jdId = job.jd_id || job.id;
              const applicantData = getApplicantCount(jdId);
              const totalApplicants = applicantData?.total_applicants || 0;
              const newApplicants = applicantData?.new_applicants || 0;
              
              return (
                <Card key={jdId} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Job Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold truncate">{job.title || 'Untitled Job'}</h3>
                          <Badge variant={job.status === 'published' ? 'default' : job.status === 'draft' ? 'secondary' : 'outline'}>
                            {job.status || 'draft'}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Building className="h-4 w-4" />
                            {job.company || 'Unknown Company'}
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {job.location || 'Location TBD'}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="h-4 w-4" />
                            {job.employment_type || 'Full-time'}
                          </div>
                          {job.created_at && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              Posted {new Date(job.created_at).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Applicant Count Badge */}
                      <div className="flex items-center gap-4">
                        {(job.status === 'published' || job.status === 'active') && (
                          <div 
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                            onClick={() => setSelectedJobForApplicants({ ...job, jd_id: jdId })}
                          >
                            <Users className="h-5 w-5 text-blue-600" />
                            <div className="text-center">
                              <div className="text-xl font-bold text-blue-600">{totalApplicants}</div>
                              <div className="text-xs text-blue-600">Applicants</div>
                            </div>
                            {newApplicants > 0 && (
                              <Badge className="bg-red-500 text-white ml-2">
                                {newApplicants} New
                              </Badge>
                            )}
                            <ChevronRight className="h-4 w-4 text-blue-400" />
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            navigate(`/recruiter/jd-builder?jd_id=${jdId}`, { replace: false });
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        {(job.status === 'published' || job.status === 'active') && (
                          <Button
                            size="sm"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                            onClick={() => setSelectedJobForApplicants({ ...job, jd_id: jdId })}
                          >
                            <UserPlus className="h-4 w-4 mr-1" />
                            View Applicants
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleDeleteClick(job)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Applicant Pipeline Summary (if has applicants) */}
                    {applicantData && totalApplicants > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center gap-6 text-sm">
                          <span className="text-muted-foreground">Pipeline:</span>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <span>{applicantData.new_applicants} New</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                            <span>{applicantData.in_review} In Review</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-purple-400"></div>
                            <span>{applicantData.in_interview} Interview</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-400"></div>
                            <span>{applicantData.offers_made} Offers</span>
                          </div>
                          {applicantData.last_application_date && (
                            <span className="text-muted-foreground ml-auto">
                              Last application: {formatRelativeTime(applicantData.last_application_date)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No job descriptions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first job posting to start receiving applications
                </p>
                <Button onClick={() => navigate('/recruiter/jd-builder')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Job Posting
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Job Preview Dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedJob?.title || 'Job Details'}</DialogTitle>
            <DialogDescription>
              Review the parsed job description details
            </DialogDescription>
          </DialogHeader>
          {selectedJob && (
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-1">Company</h4>
                <p className="text-muted-foreground">{selectedJob.company || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Location</h4>
                <p className="text-muted-foreground">{selectedJob.location || 'Not specified'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-1">Employment Type</h4>
                <p className="text-muted-foreground">{selectedJob.employment_type || 'Not specified'}</p>
              </div>
              {selectedJob.description && (
                <div>
                  <h4 className="font-medium mb-1">Description</h4>
                  <p className="text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                </div>
              )}
              {selectedJob.requirements && Array.isArray(selectedJob.requirements) && selectedJob.requirements.length > 0 && (
                <div>
                  <h4 className="font-medium mb-1">Requirements</h4>
                  <ul className="list-disc list-inside text-muted-foreground">
                    {selectedJob.requirements.map((req: any, idx: number) => (
                      <li key={idx}>{typeof req === 'string' ? req : req.description || req.category}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Job Description?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{jobToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteJob} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default JobDescriptionsList;
