
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';

export function useJobDescriptionsList() {
  const [jobDescriptions, setJobDescriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Load job descriptions on component mount
  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  const fetchJobDescriptions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('job_descriptions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setJobDescriptions(data || []);
    } catch (error) {
      console.error('Error fetching job descriptions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load job descriptions: ' + error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this job description?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('job_descriptions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      setJobDescriptions(jobDescriptions.filter(job => job.id !== id));
      toast({
        title: 'Success',
        description: 'Job description deleted successfully',
        variant: 'success',
      });
    } catch (error) {
      console.error('Error deleting job description:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete job description: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const toggleJobStatus = async (id, currentStatus) => {
    try {
      const { error } = await supabase
        .from('job_descriptions')
        .update({ is_active: !currentStatus, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      // Update local state
      setJobDescriptions(jobDescriptions.map(job => 
        job.id === id ? { ...job, is_active: !job.is_active } : job
      ));

      toast({
        title: 'Success',
        description: `Job description ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
        variant: 'success',
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update job status: ' + error.message,
        variant: 'destructive',
      });
    }
  };

  const viewJobDetails = (job) => {
    setSelectedJob(job);
    setIsDialogOpen(true);
  };

  const addNewJobDescription = () => {
    navigate('/job-descriptions');
  };

  return {
    jobDescriptions,
    isLoading,
    selectedJob,
    isDialogOpen,
    setIsDialogOpen,
    handleDelete,
    toggleJobStatus,
    viewJobDetails,
    addNewJobDescription,
  };
}
