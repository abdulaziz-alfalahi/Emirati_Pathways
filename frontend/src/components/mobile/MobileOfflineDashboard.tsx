
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { useOfflineCV } from '@/hooks/use-offline-cv';
import { useOfflineJobs } from '@/hooks/use-offline-jobs';
import MobileOfflineIndicator from './MobileOfflineIndicator';
import MobileOfflineJobsList from './MobileOfflineJobsList';
import { 
  FileText, 
  Briefcase, 
  Download, 
  Upload,
  Clock,
  CheckCircle
} from 'lucide-react';

const MobileOfflineDashboard: React.FC = () => {
  const { isOnline, hasUnsyncedData, syncQueue } = useOfflineStorage();
  const { getOfflineCVs, getOfflineResumes } = useOfflineCV();
  const { savedJobs } = useOfflineJobs();

  const offlineCVs = getOfflineCVs();
  const offlineResumes = getOfflineResumes();

  return (
    <div className="space-y-6 p-4">
      {/* Connection Status */}
      <MobileOfflineIndicator />

      {/* Offline Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {offlineCVs.length + offlineResumes.length}
            </div>
            <div className="text-sm text-gray-600">
              Saved Documents
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 text-center">
            <Briefcase className="h-8 w-8 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {savedJobs.length}
            </div>
            <div className="text-sm text-gray-600">
              Saved Jobs
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Offline Documents */}
      {(offlineCVs.length > 0 || offlineResumes.length > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Offline Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {offlineCVs.map((cv) => (
                <div key={cv.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <div className="font-medium text-sm">CV Document</div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(cv.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {isOnline ? 'Synced' : 'Offline'}
                  </Badge>
                </div>
              ))}

              {offlineResumes.map((resume) => (
                <div key={resume.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-purple-500" />
                    <div>
                      <div className="font-medium text-sm">Resume Document</div>
                      <div className="text-xs text-gray-500">
                        Created {new Date(resume.timestamp).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {isOnline ? 'Synced' : 'Offline'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sync Status */}
      {hasUnsyncedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isOnline ? (
                <Upload className="h-5 w-5 text-blue-500" />
              ) : (
                <Clock className="h-5 w-5 text-orange-500" />
              )}
              <span>Sync Status</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {syncQueue.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="text-sm">
                    {item.type} {item.table}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {item.retryCount > 0 ? `Retry ${item.retryCount}` : 'Pending'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Offline Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto flex-col space-y-2 py-4">
              <Download className="h-6 w-6" />
              <span className="text-sm">Download More</span>
            </Button>
            <Button variant="outline" className="h-auto flex-col space-y-2 py-4">
              <FileText className="h-6 w-6" />
              <span className="text-sm">Create CV</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Saved Jobs */}
      <MobileOfflineJobsList />
    </div>
  );
};

export default MobileOfflineDashboard;
