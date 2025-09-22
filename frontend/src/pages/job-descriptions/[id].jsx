
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/layout/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Badge } from '@/components/ui/badge';
import { Briefcase, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function JobDetailsPage() {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [matchScore, setMatchScore] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchJobDetails = async () => {
      setIsLoading(true);
      try {
        // Fetch job details
        const { data: jobData, error: jobError } = await supabase
          .from('job_descriptions')
          .select('*')
          .eq('id', id)
          .single();

        if (jobError) throw jobError;
        setJob(jobData);

        // If user is logged in, fetch their match score for this job
        if (user) {
          const { data: matchData, error: matchError } = await supabase
            .from('job_matches')
            .select('overall_score')
            .eq('job_id', id)
            .eq('profile_id', user.id)
            .single();

          if (!matchError && matchData) {
            setMatchScore(matchData.overall_score);
          }
        }
      } catch (error) {
        console.error('Error fetching job details:', error);
        toast({
          title: 'Error',
          description: 'Failed to load job details. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      fetchJobDetails();
    }
  }, [id, user, toast]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleApply = () => {
    // This would be implemented in a future feature
    toast({
      title: 'Application Started',
      description: 'The application feature will be implemented in a future update.',
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emirati-teal"></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!job) {
    return (
      <Layout>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <h2 className="text-2xl font-bold mb-2">Job Not Found</h2>
                <p className="text-muted-foreground mb-6">The job posting you're looking for doesn't exist or has been removed.</p>
                <Button onClick={handleBack}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to Jobs
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Jobs
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{job.title}</CardTitle>
                <CardDescription className="text-lg mt-1">{job.company}</CardDescription>
              </div>
              {matchScore && (
                <Badge variant={matchScore > 70 ? "success" : "secondary"} className="text-sm py-1">
                  {matchScore}% Match
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 mt-4">
              {job.location && (
                <div className="text-sm flex items-center text-muted-foreground">
                  <MapPin className="mr-1 h-4 w-4" /> {job.location}
                </div>
              )}
              {job.employment_type && (
                <div className="text-sm flex items-center text-muted-foreground">
                  <Briefcase className="mr-1 h-4 w-4" /> {job.employment_type}
                </div>
              )}
              {job.posted_date && (
                <div className="text-sm flex items-center text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" /> Posted: {job.posted_date}
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {job.description && (
              <div>
                <h3 className="text-lg font-medium mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
              </div>
            )}
            
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Responsibilities</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {job.responsibilities.map((resp, index) => (
                    <li key={index} className="text-muted-foreground">{resp}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {job.requirements && job.requirements.skills && job.requirements.skills.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Required Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {job.requirements.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="bg-slate-100">
                      {skill.name}
                      {skill.required && <span className="ml-1 text-red-500">*</span>}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {job.benefits && job.benefits.length > 0 && (
              <div>
                <h3 className="text-lg font-medium mb-2">Benefits</h3>
                <ul className="list-disc pl-5 space-y-1">
                  {job.benefits.map((benefit, index) => (
                    <li key={index} className="text-muted-foreground">{benefit}</li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="pt-4">
              <Button onClick={handleApply} size="lg" className="w-full sm:w-auto">
                Apply for This Position
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
