
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { recommendationEngine, Recommendation, RecommendationFilters } from '@/services/recommendationEngine';
import { trackTestEvent } from '@/services/abTestingService';
import { useToast } from '@/components/ui/use-toast';
import RecommendationCard from './RecommendationCard';

const AIRecommendations = () => {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<'all' | 'jobs' | 'training' | 'scholarships' | 'internships'>('all');

  useEffect(() => {
    if (user && roles.length > 0) {
      fetchRecommendations();
    }
  }, [user, roles]);

  const fetchRecommendations = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const filters: RecommendationFilters = {
        includeJobs: true,
        includeTraining: true,
        includeScholarships: true,
        includeInternships: true,
        minScore: 20,
        maxResults: 12
      };

      const recs = await recommendationEngine.generateRecommendations(user.id, filters);
      setRecommendations(recs);
      
      // Track that user viewed recommendations
      trackTestEvent(user.id, 'rec-algorithm-v1', 'view_recommendations', {
        count: recs.length
      });
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recommendations. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getFilteredRecommendations = () => {
    if (activeFilter === 'all') return recommendations;
    return recommendations.filter(rec => {
      switch (activeFilter) {
        case 'jobs': return rec.type === 'job';
        case 'training': return rec.type === 'course';
        case 'scholarships': return rec.type === 'scholarship';
        case 'internships': return rec.type === 'job';
        default: return true;
      }
    });
  };

  const handleFeedbackSubmitted = () => {
    // Optionally refresh recommendations or show success message
    toast({
      title: 'Thank you!',
      description: 'Your feedback helps us improve our recommendations.',
    });
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Personalized opportunities based on your profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const filteredRecommendations = getFilteredRecommendations();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Sparkles className="mr-2 h-5 w-5" />
          AI Recommendations
        </CardTitle>
        <CardDescription>
          Personalized opportunities with detailed explanations and feedback options
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeFilter} onValueChange={(value) => setActiveFilter(value as any)}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all">All ({recommendations.length})</TabsTrigger>
            <TabsTrigger value="jobs">Jobs ({recommendations.filter(r => r.type === 'job').length})</TabsTrigger>
            <TabsTrigger value="training">Training ({recommendations.filter(r => r.type === 'course').length})</TabsTrigger>
            <TabsTrigger value="scholarships">Scholarships ({recommendations.filter(r => r.type === 'scholarship').length})</TabsTrigger>
            <TabsTrigger value="internships">Internships ({recommendations.filter(r => r.type === 'job').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value={activeFilter} className="mt-6">
            {filteredRecommendations.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Sparkles className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No recommendations available yet.</p>
                <p className="text-sm">Complete your profile to get personalized suggestions.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRecommendations.map((recommendation) => (
                  <RecommendationCard
                    key={recommendation.id}
                    recommendation={recommendation}
                    userId={user?.id || ''}
                    onFeedbackSubmitted={handleFeedbackSubmitted}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {recommendations.length > 0 && (
          <div className="mt-6 pt-4 border-t">
            <Button 
              onClick={fetchRecommendations} 
              variant="outline" 
              size="sm" 
              className="w-full"
            >
              <TrendingUp className="h-4 w-4 mr-2" />
              Refresh Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIRecommendations;
