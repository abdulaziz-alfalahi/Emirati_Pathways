
import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { 
  WifiOff, 
  Wifi, 
  Download, 
  Upload, 
  Clock,
  RefreshCw
} from 'lucide-react';

const MobileOfflineIndicator: React.FC = () => {
  const { 
    isOnline, 
    syncQueue, 
    hasUnsyncedData, 
    processSyncQueue, 
    clearOfflineData 
  } = useOfflineStorage();

  if (isOnline && !hasUnsyncedData) {
    return null;
  }

  return (
    <div className="p-4 space-y-3">
      {/* Connection Status */}
      <Alert className={isOnline ? 'border-green-200 bg-green-50' : 'border-orange-200 bg-orange-50'}>
        <div className="flex items-center space-x-2">
          {isOnline ? (
            <Wifi className="h-4 w-4 text-green-600" />
          ) : (
            <WifiOff className="h-4 w-4 text-orange-600" />
          )}
          <AlertDescription className="flex-1">
            {isOnline ? 'Connected' : 'Working offline'}
          </AlertDescription>
          {hasUnsyncedData && (
            <Badge variant="outline" className="text-xs">
              {syncQueue.length} pending
            </Badge>
          )}
        </div>
      </Alert>

      {/* Sync Status */}
      {hasUnsyncedData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-blue-600" />
              <span className="text-sm text-blue-800">
                {syncQueue.length} items waiting to sync
              </span>
            </div>
            {isOnline && (
              <Button
                size="sm"
                variant="outline"
                onClick={processSyncQueue}
                className="text-xs"
              >
                <RefreshCw className="h-3 w-3 me-1" />
                Sync Now
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Offline Features Info */}
      {!isOnline && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-gray-800 mb-2">
            Available Offline:
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div className="flex items-center space-x-1">
              <Download className="h-3 w-3" />
              <span>CV Building</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-3 w-3" />
              <span>Saved Jobs</span>
            </div>
            <div className="flex items-center space-x-1">
              <Download className="h-3 w-3" />
              <span>Profile Data</span>
            </div>
            <div className="flex items-center space-x-1">
              <Upload className="h-3 w-3" />
              <span>Auto-sync</span>
            </div>
          </div>
        </div>
      )}

      {/* Clear Data Option */}
      {hasUnsyncedData && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearOfflineData}
          className="w-full text-xs text-gray-500"
        >
          Clear Offline Data
        </Button>
      )}
    </div>
  );
};

export default MobileOfflineIndicator;
