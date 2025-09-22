
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Briefcase, GraduationCap, Award, Users, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { recommendationEngine, Recommendation, RecommendationFilters } from '@/services/recommendationEngine';

interface RecommendationsWidgetProps {
  maxItems?: number;
  types?: Array<'job' | 'training' | 'scholarship' | 'internship'>;
}

const RecommendationsWidget: React.FC<RecommendationsWidgetProps> = ({ 
  maxItems = 3, 
  types = ['job', 'training', 'scholarship', 'internship'] 
}) => {
  const { user, roles } = useAuth();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
        includeJobs: types.includes('job'),
        includeTraining: types.includes('training'),
        includeScholarships: types.includes('scholarship'),
        includeInternships: types.includes('internship'),
        minScore: 30,
        maxResults: maxItems
      };

      const recs = await recommendationEngine.generateRecommendations(user.id, filters);
      setRecommendations(recs);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase className="h-3 w-3" />;
      case 'training': return <GraduationCap className="h-3 w-3" />;
      case 'scholarship': return <Award className="h-3 w-3" />;
      case 'internship': return <Users className="h-3 w-3" />;
      default: return <Sparkles className="h-3 w-3" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job': return 'text-blue-600';
      case 'training': return 'text-green-600';
      case 'scholarship': return 'text-purple-600';
      case 'internship': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <Sparkles className="mr-2 h-5 w-5" />
          AI Recommendations
        </CardTitle>
        <CardDescription>Personalized opportunities for you</CardDescription>
      </CardHeader>
      <CardContent>
        {recommendations.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            <Sparkles className="mx-auto h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">Complete your profile to get personalized recommendations.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recommendations.map((recommendation) => (
              <div key={recommendation.id} className="p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    <div className={getTypeColor(recommendation.type)}>
                      {getTypeIcon(recommendation.type)}
                    </div>
                    <h4 className="font-medium text-sm line-clamp-1">{recommendation.title}</h4>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3 text-muted-foreground" />
                    <span className="text-xs font-medium">{Math.round(recommendation.score)}%</span>
                  </div>
                </div>
                
                {recommendation.provider && (
                  <p className="text-xs text-muted-foreground mb-1">{recommendation.provider}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-xs capitalize">
                    {recommendation.type}
                  </Badge>
                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs">
                    View
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {recommendations.length > 0 && (
          <Button variant="outline" size="sm" className="w-full mt-4">
            View All Recommendations
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default RecommendationsWidget;
