
import { useState, useEffect, useCallback } from 'react';
import { useOfflineStorage } from './use-offline-storage';

export interface OfflineCV {
  key: string;
  data: any;
  timestamp: number;
  synced: boolean;
}

export const useOfflineCV = () => {
  const { saveToOfflineStorage, getFromOfflineStorage, addToSyncQueue } = useOfflineStorage();
  const [offlineCVs, setOfflineCVs] = useState<OfflineCV[]>([]);

  useEffect(() => {
    loadOfflineCVs();
  }, []);

  const loadOfflineCVs = useCallback(() => {
    const stored = localStorage.getItem('offline_cvs');
    if (stored) {
      setOfflineCVs(JSON.parse(stored));
    }
  }, []);

  const saveCV = useCallback((cvData: any) => {
    const cv: OfflineCV = {
      key: `cv_${Date.now()}`,
      data: cvData,
      timestamp: Date.now(),
      synced: false
    };

    const updated = [...offlineCVs, cv];
    setOfflineCVs(updated);
    localStorage.setItem('offline_cvs', JSON.stringify(updated));
    
    saveToOfflineStorage(cv.key, cvData);
    addToSyncQueue({
      type: 'create',
      table: 'cvs',
      data: cvData
    });
  }, [offlineCVs, saveToOfflineStorage, addToSyncQueue]);

  const getOfflineCVs = useCallback(() => {
    return offlineCVs;
  }, [offlineCVs]);

  const getOfflineResumes = useCallback(() => {
    return offlineCVs.filter(cv => cv.data.type === 'resume');
  }, [offlineCVs]);

  return {
    saveCV,
    getOfflineCVs,
    getOfflineResumes,
    offlineCVs
  };
};
