
import { useState, useEffect, useCallback } from 'react';
import { useOfflineStorage } from './use-offline-storage';

export interface SavedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  description: string;
  requirements: string[];
  savedAt: number;
  synced: boolean;
}

export const useOfflineJobs = () => {
  const { saveToOfflineStorage, addToSyncQueue } = useOfflineStorage();
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);

  useEffect(() => {
    loadSavedJobs();
  }, []);

  const loadSavedJobs = useCallback(() => {
    const stored = localStorage.getItem('saved_jobs');
    if (stored) {
      setSavedJobs(JSON.parse(stored));
    }
  }, []);

  const saveJob = useCallback((jobData: Omit<SavedJob, 'savedAt' | 'synced'>) => {
    const job: SavedJob = {
      ...jobData,
      savedAt: Date.now(),
      synced: false
    };

    const updated = [...savedJobs, job];
    setSavedJobs(updated);
    localStorage.setItem('saved_jobs', JSON.stringify(updated));
    
    saveToOfflineStorage(`job_${job.id}`, job);
    addToSyncQueue({
      type: 'create',
      table: 'saved_jobs',
      data: job
    });
  }, [savedJobs, saveToOfflineStorage, addToSyncQueue]);

  const removeJob = useCallback((jobId: string) => {
    const updated = savedJobs.filter(job => job.id !== jobId);
    setSavedJobs(updated);
    localStorage.setItem('saved_jobs', JSON.stringify(updated));

    addToSyncQueue({
      type: 'delete',
      table: 'saved_jobs',
      data: { id: jobId }
    });
  }, [savedJobs, addToSyncQueue]);

  return {
    savedJobs,
    saveJob,
    removeJob,
    loadSavedJobs
  };
};
