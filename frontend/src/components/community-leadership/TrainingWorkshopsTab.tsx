
import React, { useEffect, useState } from 'react';
import { communityLeadershipService } from '@/services/communityLeadershipService';
import { CommunityLeadershipResource } from '@/types/communityLeadership';
import { ResourceCard } from './ResourceCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const TrainingWorkshopsTab: React.FC = () => {
  const [resources, setResources] = useState<CommunityLeadershipResource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchResources = async () => {
      try {
        const [trainingData, workshopData] = await Promise.all([
          communityLeadershipService.getResourcesByType('training'),
          communityLeadershipService.getResourcesByType('workshop')
        ]);
        
        const combinedData = [...trainingData, ...workshopData].sort((a, b) => {
          if (a.is_featured && !b.is_featured) return -1;
          if (!a.is_featured && b.is_featured) return 1;
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
        
        setResources(combinedData);
      } catch (error) {
        console.error('Error fetching training resources:', error);
        toast({
          title: "Error",
          description: "Failed to load training programs and workshops",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchResources();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-ehrdc-teal" />
      </div>
    );
  }

  if (resources.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No training programs or workshops available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            Check back later for new opportunities to develop your leadership skills.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    </div>
  );
};
