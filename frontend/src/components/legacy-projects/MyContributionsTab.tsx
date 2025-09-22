
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { legacyProjectService } from '@/services/legacyProjectService';
import { ProjectContribution } from '@/types/legacyProject';
import { ContributionCard } from './ContributionCard';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export const MyContributionsTab: React.FC = () => {
  const { user } = useAuth();
  const [contributions, setContributions] = useState<ProjectContribution[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchContributions = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const contributionsData = await legacyProjectService.getUserContributions(user.id);
        setContributions(contributionsData);
      } catch (error) {
        console.error('Error fetching contributions:', error);
        toast({
          title: "Error",
          description: "Failed to load your contributions",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContributions();
  }, [user, toast]);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">Please sign in to view your contributions.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-ehrdc-teal" />
      </div>
    );
  }

  if (contributions.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-600">You haven't made any contributions yet.</p>
          <p className="text-sm text-gray-500 mt-2">
            Browse the "Explore Projects" tab to find projects you'd like to support.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {contributions.map((contribution) => (
          <ContributionCard key={contribution.id} contribution={contribution} />
        ))}
      </div>
    </div>
  );
};
