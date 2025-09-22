
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Briefcase, TrendingUp, MapPin, Calendar } from 'lucide-react';

export function RecommendedJobs({ limit = 3 }) {
  const [isLoading, setIsLoading] = useState(true);
  const [jobs, setJobs] = useState([]);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    
    const fetchRecommendedJobs = async () => {
      setIsLoading(true);
      try {
        // First check if the user has resume data
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('resume_data')
          .eq('id', user.id)
          .single();
          
        if (profileError || !profileData.resume_data) {
          console.log('No resume data found for matching');
          // Fetch random active jobs instead
          const { data: randomJobs, error: randomJobsError } = await supabase
            .from('job_descriptions')
            .select('*')
            .eq('is_active', true)
            .limit(limit);
            
          if (randomJobsError) throw randomJobsError;
          setJobs(randomJobs);
          return;
        }
        
        // Get job matches for the user if they exist
        const { data: matchData, error: matchError } = await supabase
          .from('job_matches')
          .select(`
            overall_score,
            job_id,
            job_descriptions(*)
          `)
          .eq('profile_id', user.id)
          .order('overall_score', { ascending: false })
          .limit(limit);
          
        if (matchError) throw matchError;
        
        if (matchData && matchData.length > 0) {
          // Format the data to include match score
          const formattedJobs = matchData.map(match => ({
            ...match.job_descriptions,
            match_score: match.overall_score
          }));
          setJobs(formattedJobs);
        } else {
          // No matches found, try to generate matches
          try {
            // Call edge function to match user with jobs
            const { data: generatedMatches, error: generationError } = await supabase.functions.invoke('match-resume-job/candidate-to-jobs', {
              body: { 
                resumeData: profileData.resume_data,
                resumeId: user.id,
                threshold: 30, // Lower threshold to ensure some results
                limit: limit
              }
            });
            
            if (generationError) throw generationError;
            
            // Fetch the job details for the matched jobs
            if (generatedMatches && generatedMatches.length > 0) {
              const jobIds = generatedMatches.map(match => match.jobId);
              const { data: matchedJobs, error: jobsError } = await supabase
                .from('job_descriptions')
                .select('*')
                .in('id', jobIds);
                
              if (jobsError) throw jobsError;
              
              // Merge the match scores with the job details
              const jobsWithScores = matchedJobs.map(job => {
                const matchInfo = generatedMatches.find(match => match.jobId === job.id);
                return {
                  ...job,
                  match_score: matchInfo ? matchInfo.overallScore : 0
                };
              });
              
              setJobs(jobsWithScores);
            } else {
              // Still no matches, get random active jobs
              const { data: randomJobs, error: randomJobsError } = await supabase
                .from('job_descriptions')
                .select('*')
                .eq('is_active', true)
                .limit(limit);
                
              if (randomJobsError) throw randomJobsError;
              setJobs(randomJobs);
            }
          } catch (error) {
            console.error('Error generating matches:', error);
            // Fallback to random active jobs
            const { data: randomJobs, error: randomJobsError } = await supabase
              .from('job_descriptions')
              .select('*')
              .eq('is_active', true)
              .limit(limit);
              
            if (randomJobsError) throw randomJobsError;
            setJobs(randomJobs);
          }
        }
      } catch (error) {
        console.error('Error fetching recommended jobs:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job recommendations. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendedJobs();
  }, [user, limit, toast]);

  const viewAllJobs = () => {
    navigate('/job-matching');
  };

  const viewJobDetails = (jobId) => {
    navigate(`/job-descriptions/${jobId}`);
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Briefcase className="mr-2 h-5 w-5" />
            AI-Recommended Job Opportunities
          </CardTitle>
          <CardDescription>Personalized job recommendations based on your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emirati-teal"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Briefcase className="mr-2 h-5 w-5" />
          AI-Recommended Job Opportunities
        </CardTitle>
        <CardDescription>Personalized job recommendations based on your profile</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {jobs.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No job recommendations available at this time. Please complete your resume to get personalized recommendations.
          </div>
        ) : (
          jobs.map((job) => (
            <Card key={job.id} className="overflow-hidden">
              <div className="flex flex-col">
                <div className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-lg">{job.title}</h3>
                      <p className="text-sm text-muted-foreground">{job.company}</p>
                    </div>
                    {job.match_score && (
                      <Badge variant={job.match_score > 70 ? "success" : "secondary"} className="flex items-center">
                        <TrendingUp className="mr-1 h-3 w-3" />
                        {job.match_score}% Match
                      </Badge>
                    )}
                  </div>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.location && (
                      <div className="text-xs flex items-center text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3" /> {job.location}
                      </div>
                    )}
                    {job.employment_type && (
                      <div className="text-xs flex items-center text-muted-foreground">
                        <Briefcase className="mr-1 h-3 w-3" /> {job.employment_type}
                      </div>
                    )}
                    {job.posted_date && (
                      <div className="text-xs flex items-center text-muted-foreground">
                        <Calendar className="mr-1 h-3 w-3" /> Posted: {job.posted_date}
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-muted px-4 py-2">
                  <Button 
                    variant="link" 
                    size="sm" 
                    onClick={() => viewJobDetails(job.id)}
                    className="p-0 h-auto font-normal text-sm"
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </CardContent>
      <CardFooter>
        <Button 
          onClick={viewAllJobs} 
          variant="outline" 
          size="sm" 
          className="w-full"
        >
          View All Job Opportunities
        </Button>
      </CardFooter>
    </Card>
  );
}
