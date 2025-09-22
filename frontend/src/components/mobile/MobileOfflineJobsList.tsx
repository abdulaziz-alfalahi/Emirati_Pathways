
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useOfflineJobs } from '@/hooks/use-offline-jobs';
import { 
  Briefcase, 
  MapPin, 
  Clock, 
  Trash2,
  ExternalLink
} from 'lucide-react';

const MobileOfflineJobsList: React.FC = () => {
  const { savedJobs, removeJob } = useOfflineJobs();

  if (savedJobs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Briefcase className="h-5 w-5" />
            <span>Saved Jobs</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Briefcase className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No saved jobs yet</p>
            <p className="text-sm">Save jobs to access them offline</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5" />
          <span>Saved Jobs</span>
          <Badge variant="secondary">{savedJobs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {savedJobs.map((job) => (
            <div key={job.id} className="p-4 border rounded-lg bg-gray-50">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm line-clamp-1">{job.title}</h4>
                  <p className="text-sm text-gray-600 line-clamp-1">{job.company}</p>
                </div>
                <div className="flex items-center space-x-1 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeJob(job.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center space-x-4 text-xs text-gray-500 mb-2">
                <div className="flex items-center space-x-1">
                  <MapPin className="h-3 w-3" />
                  <span>{job.location}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Clock className="h-3 w-3" />
                  <span>Saved {new Date(job.savedAt).toLocaleDateString()}</span>
                </div>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                {job.description}
              </p>

              {job.requirements.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-700 mb-1">Requirements:</p>
                  <div className="flex flex-wrap gap-1">
                    {job.requirements.slice(0, 3).map((req, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {req}
                      </Badge>
                    ))}
                    {job.requirements.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{job.requirements.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between">
                <Badge variant={job.synced ? 'default' : 'secondary'} className="text-xs">
                  {job.synced ? 'Synced' : 'Offline'}
                </Badge>
                <Button size="sm" variant="outline" className="text-xs">
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View Details
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default MobileOfflineJobsList;
