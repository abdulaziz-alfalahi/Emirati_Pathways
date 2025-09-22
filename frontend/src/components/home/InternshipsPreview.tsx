
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Internship } from '@/types/internships';
import { getInternships } from '@/services/internshipService';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Briefcase, Calendar, MapPin, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';

interface InternshipsPreviewProps {
  limit?: number;
}

const InternshipsPreview: React.FC<InternshipsPreviewProps> = ({ limit = 3 }) => {
  const [internships, setInternships] = useState<Internship[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchInternships = async () => {
      setIsLoading(true);
      try {
        const data = await getInternships();
        // Get the most recent internships limited by the limit prop
        const recentInternships = data.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, limit);
        setInternships(recentInternships);
      } catch (error) {
        console.error('Error fetching internships:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchInternships();
  }, [limit]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Latest Internships</h2>
        </div>
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (internships.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Latest Internships</CardTitle>
          <CardDescription>
            No internships available right now. Check back later!
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/internships">
            <Button variant="outline">
              Browse All Internships
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Latest Internships</h2>
        <Link to="/internships">
          <Button variant="outline" size="sm">
            View All
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
      <div className="space-y-4">
        {internships.map((internship) => (
          <Card key={internship.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">{internship.title}</CardTitle>
              <CardDescription>{internship.company}</CardDescription>
            </CardHeader>
            <CardContent className="pb-2">
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{internship.description}</p>
              <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                  {internship.location}
                </div>
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-1 text-gray-400" />
                  Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
                  {' '}
                  ({formatDistanceToNow(new Date(internship.application_deadline), { addSuffix: true })})
                </div>
                <div className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-1 text-gray-400" />
                  {internship.industry}
                </div>
              </div>
            </CardContent>
            <CardFooter className="pt-2">
              <Link to={`/internships?id=${internship.id}`}>
                <Button size="sm">View Details</Button>
              </Link>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default InternshipsPreview;
