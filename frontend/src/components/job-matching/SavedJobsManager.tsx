
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, MapPin, Building, DollarSign, Clock, ExternalLink, Trash2 } from 'lucide-react';

export const SavedJobsManager: React.FC = () => {
  const savedJobs = [
    {
      id: 1,
      title: 'Product Manager',
      company: 'Careem',
      location: 'Dubai',
      salary: 'AED 18,000 - 24,000',
      type: 'Full-time',
      savedDate: '2024-06-02',
      match: '92%'
    },
    {
      id: 2,
      title: 'UX Designer',
      company: 'Noon',
      location: 'Dubai',
      salary: 'AED 14,000 - 18,000',
      type: 'Full-time',
      savedDate: '2024-06-01',
      match: '87%'
    },
    {
      id: 3,
      title: 'Business Analyst',
      company: 'Emirates Group',
      location: 'Dubai',
      salary: 'AED 12,000 - 16,000',
      type: 'Full-time',
      savedDate: '2024-05-30',
      match: '83%'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-ehrdc-teal" />
              Saved Jobs
            </CardTitle>
            <Badge variant="secondary">
              {savedJobs.length} Jobs Saved
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {savedJobs.map((job) => (
              <Card key={job.id}>
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold mb-2">{job.title}</h3>
                      <div className="flex items-center gap-2 text-ehrdc-teal mb-2">
                        <Building className="h-4 w-4" />
                        {job.company}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="bg-ehrdc-light-teal/10 text-ehrdc-teal border-ehrdc-light-teal/20">
                        {job.match} Match
                      </Badge>
                      <Button variant="ghost" size="sm">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="h-4 w-4" />
                      {job.salary}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      {job.type}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Star className="h-4 w-4" />
                      Saved {job.savedDate}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button className="flex-1">
                      <ExternalLink className="h-4 w-4 me-2" />
                      Apply Now
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Details
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {savedJobs.length === 0 && (
            <div className="text-center py-12">
              <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Saved Jobs</h3>
              <p className="text-muted-foreground mb-4">
                Start saving jobs you're interested in to keep track of them here.
              </p>
              <Button>
                Browse Jobs
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
