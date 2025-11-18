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
  Briefcase
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { jobApi, healthApi, type JobDescription } from '@/utils/api';

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
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Fetch job descriptions from Flask backend
  const { data: jobDescriptions, isLoading, refetch } = useQuery({
    queryKey: ['jobDescriptions'],
    queryFn: async () => {
      // Get token for authentication
      const token = localStorage.getItem('access_token') || localStorage.getItem('accessToken');
      const isMockToken = token?.startsWith('mock_token_');
      
      // Use the correct recruiter JD list endpoint
      const response = await fetch('http://localhost:5003/api/recruiter/jd/list', {
        headers: {
          'Content-Type': 'application/json',
          ...(token && !isMockToken ? { 'Authorization': `Bearer ${token}` } : {})
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch job descriptions');
      }
      
      const data = await response.json();
      // The API returns { job_descriptions: [...], count: ... }
      return data.job_descriptions || [];
    },
    refetchInterval: 30000, // Refetch every 30 seconds
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
      
      if (response.success) {
        toast({
          title: 'Job Description Parsed Successfully!',
          description: `Extracted job details with ${response.completeness_score || 0}% confidence`,
        });
        
        // Refetch the list to include the new job
        refetch();
        setIsUploadOpen(false);
        
        // Show preview of parsed data
        if (response.data) {
          setSelectedJob(response.data);
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
      
      if (response.success) {
        toast({
          title: 'Job Description Parsed Successfully!',
          description: `Extracted job details with ${response.completeness_score || 0}% confidence`,
        });
        
        // Refetch the list to include the new job
        refetch();
        setIsTextInputOpen(false);
        setJobText('');
        
        // Show preview of parsed data
        if (response.data) {
          setSelectedJob(response.data);
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

  // Navigate to find matching candidates
  const handleFindMatches = (job: JobDescription) => {
    // Store the selected job for the matching component
    localStorage.setItem('selectedJobForMatching', JSON.stringify(job));
    navigate('/recruiter?tab=candidates');
  };

  // View job details
  const handleViewJob = (job: JobDescription) => {
    setSelectedJob(job);
    setIsPreviewOpen(true);
  };

  // Get confidence color
  const getConfidenceColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-orange-600';
  };

  // Get confidence badge variant
  const getConfidenceBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 70) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Job Descriptions</h2>
          <p className="text-muted-foreground">
            Upload and manage job descriptions with AI-powered parsing
          </p>
        </div>
        
        <div className="flex gap-2">
          <Dialog open={isTextInputOpen} onOpenChange={setIsTextInputOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Add Text
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Parse Job Description from Text</DialogTitle>
                <DialogDescription>
                  Paste or type the job description text below
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Textarea
                  placeholder="Paste job description here..."
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  rows={10}
                  className="min-h-[200px]"
                />
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => setIsTextInputOpen(false)}
                    disabled={isUploading}
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleTextParsing}
                    disabled={isUploading || !jobText.trim()}
                  >
                    {isUploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        Parsing...
                      </>
                    ) : (
                      <>Parse Job Description</>
                    )}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          
          <Dialog open={isUploadOpen} onOpenChange={setIsUploadOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Upload File
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload Job Description</DialogTitle>
                <DialogDescription>
                  Upload a PDF, Word document, or text file containing the job description
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-sm text-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">
                    PDF, DOC, DOCX, or TXT files only
                  </p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                  >
                    Select File
                  </Button>
                </div>
                
                {isUploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Parsing job description...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Health Status - FIXED: Added null safety checks */}
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
        <Card>
          <CardHeader>
            <CardTitle>Active Job Listings</CardTitle>
            <CardDescription>
              {jobDescriptions?.length || 0} job descriptions parsed and ready for matching
            </CardDescription>
          </CardHeader>
          <CardContent>
            {jobDescriptions && jobDescriptions.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Details</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Requirements</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobDescriptions.map((job: any) => (
                    <TableRow key={job.jd_id || job.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{job.title || 'Untitled Job'}</div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building className="h-3 w-3" />
                              {job.company || 'Unknown Company'}
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {job.location || 'Location TBD'}
                            </div>
                            <div className="flex items-center gap-1">
                              <Briefcase className="h-3 w-3" />
                              {job.employment_type || 'Full-time'}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={job.status === 'published' ? 'default' : job.status === 'draft' ? 'secondary' : 'outline'}>
                          {job.status || 'draft'}
                        </Badge>
                        {job.created_at && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {new Date(job.created_at).toLocaleDateString()}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">
                            <span className="font-medium">Requirements:</span> {Array.isArray(job.requirements) ? job.requirements.length : 0}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Responsibilities:</span> {Array.isArray(job.responsibilities) ? job.responsibilities.length : 0}
                          </div>
                          <div className="text-sm">
                            <span className="font-medium">Benefits:</span> {Array.isArray(job.benefits) ? job.benefits.length : 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Navigate to JD wizard to edit
                              const jdId = job.jd_id || job.id;
                              navigate(`/recruiter/jd-builder?jd_id=${jdId}`, { replace: false });
                            }}
                            aria-label={`Edit job description ${job.title || job.jd_id}`}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          {job.status === 'published' && (
                            <Button
                              size="sm"
                              onClick={() => handleFindMatches(job)}
                            >
                              <Users className="h-4 w-4 mr-1" />
                              Find Candidates
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No job descriptions yet</h3>
                <p className="text-muted-foreground mb-4">
                  Upload your first job description to get started with candidate matching
                </p>
                <Button onClick={() => setIsUploadOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Job Description
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Job Preview Dialog - FIXED: Added null safety checks */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Job Description Details</DialogTitle>
            <DialogDescription>
              Parsed job information and requirements
            </DialogDescription>
          </DialogHeader>
          
          {selectedJob && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-semibold mb-2">Basic Information</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Title:</span> {selectedJob.title || 'Untitled Job'}</div>
                    <div><span className="font-medium">Company:</span> {selectedJob.company || 'Unknown Company'}</div>
                    <div><span className="font-medium">Location:</span> {selectedJob.location || 'Location TBD'}</div>
                    <div><span className="font-medium">Type:</span> {selectedJob.employment_type || 'Full-time'}</div>
                    <div><span className="font-medium">Work Mode:</span> {selectedJob.work_mode || 'On-site'}</div>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Parsing Metadata</h3>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Confidence:</span> {selectedJob.parsing_metadata?.confidence_score || 0}%</div>
                    <div><span className="font-medium">Language:</span> {selectedJob.parsing_metadata?.language_detected || 'Unknown'}</div>
                    <div><span className="font-medium">Processing Time:</span> {selectedJob.parsing_metadata?.processing_time || 0}s</div>
                    <div><span className="font-medium">Sections:</span> {selectedJob.parsing_metadata?.successful_sections || 0}/{selectedJob.parsing_metadata?.total_sections || 0}</div>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div>
                <h3 className="font-semibold mb-2">Requirements</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium mb-1">Skills ({selectedJob.requirements?.skills?.length || 0})</h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedJob.requirements?.skills || []).map((skill, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Education ({selectedJob.requirements?.education?.length || 0})</h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedJob.requirements?.education || []).map((edu, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {edu}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <h4 className="font-medium mb-1">Experience ({selectedJob.requirements?.experience?.length || 0})</h4>
                    <div className="text-sm space-y-1">
                      {(selectedJob.requirements?.experience || []).map((exp, index) => (
                        <div key={index}>• {exp}</div>
                      ))}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-1">Languages ({selectedJob.requirements?.languages?.length || 0})</h4>
                    <div className="flex flex-wrap gap-1">
                      {(selectedJob.requirements?.languages || []).map((lang, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {lang}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Responsibilities */}
              {selectedJob.responsibilities && selectedJob.responsibilities.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Responsibilities ({selectedJob.responsibilities.length})</h3>
                  <div className="text-sm space-y-1">
                    {selectedJob.responsibilities.map((resp, index) => (
                      <div key={index}>• {resp}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Benefits ({selectedJob.benefits.length})</h3>
                  <div className="text-sm space-y-1">
                    {selectedJob.benefits.map((benefit, index) => (
                      <div key={index}>• {benefit}</div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsPreviewOpen(false);
                  handleFindMatches(selectedJob);
                }}>
                  <Users className="h-4 w-4 mr-2" />
                  Find Matching Candidates
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobDescriptionsList;

