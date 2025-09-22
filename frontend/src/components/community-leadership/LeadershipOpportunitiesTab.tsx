
import React, { useEffect, useState } from 'react';
import { communityLeadershipService } from '@/services/communityLeadershipService';
import { CommunityLeadershipResource } from '@/types/communityLeadership';
import { ResourceCard } from './ResourceCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const LeadershipOpportunitiesTab: React.FC = () => {
  const [opportunities, setOpportunities] = useState<CommunityLeadershipResource[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchOpportunities = async () => {
      try {
        const opportunitiesData = await communityLeadershipService.getResourcesByType('opportunity');
        setOpportunities(opportunitiesData);
      } catch (error) {
        console.error('Error fetching leadership opportunities:', error);
        toast({
          title: "Error",
          description: "Failed to load leadership opportunities",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchOpportunities();
  }, [toast]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-ehrdc-teal" />
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">No leadership opportunities available at the moment.</p>
          <p className="text-sm text-gray-500 mt-2">
            New opportunities are posted regularly. Check back soon!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {opportunities.map((opportunity) => (
          <ResourceCard key={opportunity.id} resource={opportunity} />
        ))}
      </div>
    </div>
  );
};
