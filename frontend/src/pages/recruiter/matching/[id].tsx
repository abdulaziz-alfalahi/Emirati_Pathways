
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Import components
import { PageHeader, JobDetails, CandidatesList } from '@/components/recruiter/matching';

interface Candidate {
  id: string;
  name: string;
  matchScore: number;
  skills: string[];
  experience: string;
  education: string;
  location: string;
  status?: 'shortlisted' | 'rejected' | 'pending' | 'hired';
}

const JobMatchingPage = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [matchThreshold, setMatchThreshold] = useState(50);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [isMatching, setIsMatching] = useState(false);

  // Fetch job description
  const { data: jobDescription, isLoading: isLoadingJob } = useQuery({
    queryKey: ['jobDescription', id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      return data;
    }
  });

  // Find matching candidates on load
  useEffect(() => {
    if (jobDescription) {
      handleFindMatches();
    }
  }, [jobDescription]);

  // Fetch matching candidates for job
  const handleFindMatches = async () => {
    if (!id) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No job ID provided.',
      });
      return;
    }

    setIsMatching(true);
    
    try {
      // Call match-resume-job edge function to find matching candidates
      const response = await supabase.functions.invoke('match-resume-job', {
        body: {
          jobData: jobDescription,
          jobId: id,
          threshold: matchThreshold
        }
      });
      
      if (response.error) throw response.error;
      
      // Transform response to candidate list
      const candidateMatches = response.data || [];
      const transformedCandidates: Candidate[] = candidateMatches.map((match: any) => ({
        id: match.candidateId,
        name: match.candidateName || 'Anonymous Candidate',
        matchScore: match.overallScore,
        skills: match.matchDetails?.skills?.matched || [],
        experience: match.matchDetails?.experience || 'Not specified',
        education: match.matchDetails?.education || 'Not specified',
        location: match.matchDetails?.location || 'Not specified',
        status: 'pending'
      }));
      
      setCandidates(transformedCandidates);
      
      toast({
        title: 'Candidates Found',
        description: `Found ${transformedCandidates.length} matching candidates.`,
      });
    } catch (error) {
      console.error('Error finding matching candidates:', error);
      toast({
        variant: 'destructive',
        title: 'Matching Failed',
        description: 'There was an error finding matching candidates.',
      });
    } finally {
      setIsMatching(false);
    }
  };

  // Handle candidate actions
  const handleCandidateAction = async (candidateId: string, action: 'shortlist' | 'reject' | 'message' | 'interview') => {
    // Update local state
    setCandidates(prev => 
      prev.map(candidate => {
        if (candidate.id === candidateId) {
          if (action === 'shortlist') {
            return { ...candidate, status: 'shortlisted' };
          } else if (action === 'reject') {
            return { ...candidate, status: 'rejected' };
          }
        }
        return candidate;
      })
    );
    
    // Handle different actions
    switch (action) {
      case 'shortlist':
        toast({
          title: 'Candidate Shortlisted',
          description: 'The candidate has been added to your shortlist.',
        });
        break;
      case 'reject':
        toast({
          title: 'Candidate Rejected',
          description: 'The candidate has been marked as rejected.',
        });
        break;
      case 'message':
        toast({
          title: 'Message Feature',
          description: 'Messaging functionality will be implemented soon.',
        });
        break;
      case 'interview':
        toast({
          title: 'Interview Scheduling',
          description: 'Interview scheduling will be implemented soon.',
        });
        break;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <PageHeader />
        
        {isLoadingJob ? (
          <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <>
            <JobDetails
              jobDescription={jobDescription}
              matchThreshold={matchThreshold}
              setMatchThreshold={setMatchThreshold}
              handleFindMatches={handleFindMatches}
              isMatching={isMatching}
            />
            
            <CandidatesList
              candidates={candidates}
              isMatching={isMatching}
              onCandidateAction={handleCandidateAction}
            />
          </>
        )}
      </div>
    </Layout>
  );
};

export default JobMatchingPage;
