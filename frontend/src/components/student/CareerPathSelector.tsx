
import React, { useState, useEffect } from 'react';
import { getCareerPaths, selectCareerPath } from '@/services/careerPath';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { CareerPath } from '@/types/careerPath';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

const CareerPathSelector: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [careerPaths, setCareerPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState<string | null>(null);

  useEffect(() => {
    const fetchCareerPaths = async () => {
      try {
        const paths = await getCareerPaths();
        setCareerPaths(paths);
      } catch (error) {
        console.error('Error fetching career paths:', error);
        toast({
          title: "Error",
          description: "Failed to load career paths",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchCareerPaths();
  }, [toast]);

  const handleEnroll = async (pathId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "Please log in to enroll in a career path",
        variant: "destructive"
      });
      return;
    }

    setEnrolling(pathId);
    try {
      const success = await selectCareerPath(user.id, pathId);
      if (success) {
        toast({
          title: "Success",
          description: "You have successfully enrolled in this career path",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to enroll in this career path",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error enrolling in career path:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in this career path",
        variant: "destructive"
      });
    } finally {
      setEnrolling(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {careerPaths.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>No career paths available</CardTitle>
              <CardDescription>
                Please check back later for new career paths.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          careerPaths.map((path) => (
            <Card key={path.id} className="overflow-hidden">
              <CardHeader>
                <CardTitle className="text-lg">{path.title}</CardTitle>
                <Badge className="mt-1">{path.industry}</Badge>
              </CardHeader>
              <CardContent>
                {path.description && (
                  <p className="text-sm text-muted-foreground">{path.description}</p>
                )}
              </CardContent>
              <CardFooter className="bg-muted/20 pt-2">
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => handleEnroll(path.id)}
                  disabled={enrolling === path.id}
                >
                  {enrolling === path.id ? (
                    <><Loader2 className="me-2 h-4 w-4 animate-spin" /> Enrolling...</>
                  ) : (
                    "Enroll"
                  )}
                </Button>
              </CardFooter>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default CareerPathSelector;
