import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
export function MatchingDashboard({ initialTab = 'candidates' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'candidates');
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState('');
  const [selectedJob, setSelectedJob] = useState('');
  const [threshold, setThreshold] = useState(50);
  const [limit, setLimit] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [matchResults, setMatchResults] = useState([]);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Load candidates and jobs
    const loadData = async () => {
      // Load candidates with parsed resumes
      const { data: candidatesData, error: candidatesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .not('resume_data', 'is', null);
      
      if (candidatesError) {
        console.error('Error loading candidates:', candidatesError);
        toast({
          title: 'Error',
          description: 'Failed to load candidates: ' + candidatesError.message,
          variant: 'destructive',
        });
      } else {
        setCandidates(candidatesData);
      }
      
      // Load active job descriptions
      const { data: jobsData, error: jobsError } = await supabase
        .from('job_descriptions')
        .select('id, title, company')
        .eq('is_active', true);
      
      if (jobsError) {
        console.error('Error loading jobs:', jobsError);
        toast({
          title: 'Error',
          description: 'Failed to load jobs: ' + jobsError.message,
          variant: 'destructive',
        });
      } else {
        setJobs(jobsData);
      }
    };
    
    loadData();
  }, [toast]);

  const handleCandidateToJobsMatch = async () => {
    if (!selectedCandidate) {
      toast({
        title: 'Error',
        description: 'Please select a candidate',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setMatchResults([]);
    
    try {
      // Get candidate resume data
      const { data: candidateData, error: candidateError } = await supabase
        .from('profiles')
        .select('resume_data')
        .eq('id', selectedCandidate)
        .single();
      
      if (candidateError) {
        throw new Error(candidateError.message);
      }
      
      if (!candidateData.resume_data) {
        throw new Error('No resume data found for this candidate');
      }
      
      // Call matching function
      // TODO: Connect to Flask API - const { data, error } = await supabase.functions.invoke('match-resume-job/candidate-to-jobs', {
        body: { 
          resumeData: candidateData.resume_data,
          resumeId: selectedCandidate,
          threshold,
          limit
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMatchResults(data);
      
      toast({
        title: 'Matching Complete',
        description: `Found ${data.length} matching jobs for this candidate`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error matching candidate to jobs:', error);
      toast({
        title: 'Error',
        description: 'Failed to match candidate to jobs: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJobToCandidatesMatch = async () => {
    if (!selectedJob) {
      toast({
        title: 'Error',
        description: 'Please select a job',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setMatchResults([]);
    
    try {
      // Get job data
      const { data: jobData, error: jobError } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', selectedJob)
        .single();
      
      if (jobError) {
        throw new Error(jobError.message);
      }
      
      // Call matching function
      // TODO: Connect to Flask API - const { data, error } = await supabase.functions.invoke('match-resume-job/job-to-candidates', {
        body: { 
          jobData,
          jobId: selectedJob,
          threshold,
          limit
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      setMatchResults(data);
      
      toast({
        title: 'Matching Complete',
        description: `Found ${data.length} matching candidates for this job`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error matching job to candidates:', error);
      toast({
        title: 'Error',
        description: 'Failed to match job to candidates: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveMatchResults = async () => {
    // Match results are already saved by the Edge Function
    toast({
      title: 'Success',
      description: 'Match results have been saved to the database',
      variant: 'success',
    });
  };

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Matching Dashboard</CardTitle>
          <CardDescription>
            Match candidates with job opportunities and vice versa
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="candidates">Match Candidate to Jobs</TabsTrigger>
              <TabsTrigger value="jobs">Match Job to Candidates</TabsTrigger>
            </TabsList>
            
            <TabsContent value="candidates">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select a candidate
                  </label>
                  <Select value={selectedCandidate} onValueChange={setSelectedCandidate}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a candidate" />
                    </SelectTrigger>
                    <SelectContent>
                      {candidates.map((candidate) => (
                        <SelectItem key={candidate.id} value={candidate.id}>
                          {candidate.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Match threshold: {threshold}%
                  </label>
                  <Slider
                    value={[threshold]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setThreshold(value[0])}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maximum results
                  </label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                    min={1}
                    max={50}
                  />
                </div>
                
                <Button onClick={handleCandidateToJobsMatch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding matches...
                    </>
                  ) : (
                    'Find Matching Jobs'
                  )}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="jobs">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Select a job
                  </label>
                  <Select value={selectedJob} onValueChange={setSelectedJob}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a job" />
                    </SelectTrigger>
                    <SelectContent>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>
                          {job.title} at {job.company}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Match threshold: {threshold}%
                  </label>
                  <Slider
                    value={[threshold]}
                    min={0}
                    max={100}
                    step={5}
                    onValueChange={(value) => setThreshold(value[0])}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Maximum results
                  </label>
                  <Input
                    type="number"
                    value={limit}
                    onChange={(e) => setLimit(parseInt(e.target.value) || 10)}
                    min={1}
                    max={50}
                  />
                </div>
                
                <Button onClick={handleJobToCandidatesMatch} disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Finding matches...
                    </>
                  ) : (
                    'Find Matching Candidates'
                  )}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          
          {matchResults.length > 0 && (
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">Match Results</h3>
                <Button onClick={saveMatchResults} variant="outline" size="sm">
                  Save Results
                </Button>
              </div>
              
              <div className="space-y-4">
                {matchResults.map((match, index) => (
                  <Card key={index}>
                    <CardHeader className="py-4">
                      <div className="flex justify-between items-center">
                        <CardTitle className="text-base">
                          {activeTab === 'candidates' ? (
                            <>
                              {match.jobTitle} at {match.company}
                            </>
                          ) : (
                            <>{match.candidateName}</>
                          )}
                        </CardTitle>
                        <div className="text-lg font-bold">
                          {match.overallScore}%
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="py-2">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="text-sm font-medium mb-1">Skills</h4>
                          <div className="text-sm">
                            <div className="flex items-center text-green-600">
                              <CheckCircle className="h-4 w-4 mr-1" />
                              <span>Matched: {match.matchDetails.skills.matched.join(', ')}</span>
                            </div>
                            {match.matchDetails.skills.missing.length > 0 && (
                              <div className="flex items-center text-red-600">
                                <XCircle className="h-4 w-4 mr-1" />
                                <span>Missing: {match.matchDetails.skills.missing.join(', ')}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div>
                          <h4 className="text-sm font-medium mb-1">Category Scores</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>Skills: {match.categoryScores.skills}%</div>
                            <div>Experience: {match.categoryScores.experience}%</div>
                            <div>Education: {match.categoryScores.education}%</div>
                            <div>Location: {match.categoryScores.location}%</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
