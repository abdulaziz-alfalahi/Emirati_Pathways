
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';

export interface OfflineData {
  timestamp: number;
  data: any;
  synced: boolean;
}

export interface SyncQueue {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retryCount: number;
}

export const useOfflineStorage = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [syncQueue, setSyncQueue] = useState<SyncQueue[]>([]);
  const [offlineData, setOfflineData] = useState<Record<string, OfflineData>>({});

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Back online - syncing data...');
      processSyncQueue();
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.info('You are now offline - data will be saved locally');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Load offline data from localStorage
    loadOfflineData();
    loadSyncQueue();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const loadOfflineData = useCallback(() => {
    try {
      const stored = localStorage.getItem('offline_data');
      if (stored) {
        setOfflineData(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  const loadSyncQueue = useCallback(() => {
    try {
      const stored = localStorage.getItem('sync_queue');
      if (stored) {
        setSyncQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading sync queue:', error);
    }
  }, []);

  const saveToOfflineStorage = useCallback((key: string, data: any) => {
    const offlineEntry: OfflineData = {
      timestamp: Date.now(),
      data,
      synced: false
    };

    const newOfflineData = {
      ...offlineData,
      [key]: offlineEntry
    };

    setOfflineData(newOfflineData);
    localStorage.setItem('offline_data', JSON.stringify(newOfflineData));

    if (!isOnline) {
      toast.info('Data saved offline - will sync when connection is restored');
    }
  }, [offlineData, isOnline]);

  const getFromOfflineStorage = useCallback((key: string) => {
    return offlineData[key]?.data || null;
  }, [offlineData]);

  const addToSyncQueue = useCallback((operation: Omit<SyncQueue, 'id' | 'timestamp' | 'retryCount'>) => {
    const queueItem: SyncQueue = {
      id: `${operation.type}_${operation.table}_${Date.now()}`,
      timestamp: Date.now(),
      retryCount: 0,
      ...operation
    };

    const newQueue = [...syncQueue, queueItem];
    setSyncQueue(newQueue);
    localStorage.setItem('sync_queue', JSON.stringify(newQueue));
  }, [syncQueue]);

  const processSyncQueue = useCallback(async () => {
    if (!isOnline || syncQueue.length === 0) return;

    const processedItems: string[] = [];

    for (const item of syncQueue) {
      try {
        // Here you would implement the actual sync logic with your backend
        console.log('Syncing item:', item);
        
        // Simulate sync operation
        await new Promise(resolve => setTimeout(resolve, 500));
        
        processedItems.push(item.id);
        
        // Mark corresponding offline data as synced
        if (offlineData[item.table]) {
          const updatedOfflineData = {
            ...offlineData,
            [item.table]: {
              ...offlineData[item.table],
              synced: true
            }
          };
          setOfflineData(updatedOfflineData);
          localStorage.setItem('offline_data', JSON.stringify(updatedOfflineData));
        }
      } catch (error) {
        console.error('Error syncing item:', item, error);
        
        // Update retry count
        const updatedQueue = syncQueue.map(queueItem => 
          queueItem.id === item.id 
            ? { ...queueItem, retryCount: queueItem.retryCount + 1 }
            : queueItem
        );
        setSyncQueue(updatedQueue);
        localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));
      }
    }

    // Remove successfully processed items
    if (processedItems.length > 0) {
      const updatedQueue = syncQueue.filter(item => !processedItems.includes(item.id));
      setSyncQueue(updatedQueue);
      localStorage.setItem('sync_queue', JSON.stringify(updatedQueue));
      
      toast.success(`Synced ${processedItems.length} items`);
    }
  }, [isOnline, syncQueue, offlineData]);

  const clearOfflineData = useCallback(() => {
    setOfflineData({});
    setSyncQueue([]);
    localStorage.removeItem('offline_data');
    localStorage.removeItem('sync_queue');
    toast.info('Offline data cleared');
  }, []);

  return {
    isOnline,
    syncQueue,
    saveToOfflineStorage,
    getFromOfflineStorage,
    addToSyncQueue,
    processSyncQueue,
    clearOfflineData,
    hasUnsyncedData: syncQueue.length > 0 || Object.values(offlineData).some(item => !item.synced)
  };
};
