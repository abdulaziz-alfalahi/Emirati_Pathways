
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Sparkles, 
  X, 
  Users, 
  Calendar,
  MessageSquare,
  TrendingUp,
  Eye,
  EyeOff
} from 'lucide-react';
import { GroupRecommendation } from '@/types/communities';
import { CommunitiesService } from '@/services/communitiesService';
import { toast } from '@/components/ui/use-toast';

interface GroupRecommendationsProps {
  onJoinGroup?: (groupId: string) => void;
  onRecommendationDismissed?: () => void;
}

const GroupRecommendations: React.FC<GroupRecommendationsProps> = ({ 
  onJoinGroup, 
  onRecommendationDismissed 
}) => {
  const [recommendations, setRecommendations] = useState<GroupRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dismissingIds, setDismissingIds] = useState<Set<string>>(new Set());
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      const data = await CommunitiesService.getRecommendedGroups();
      setRecommendations(data);
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async (recommendationId: string) => {
    setDismissingIds(prev => new Set([...prev, recommendationId]));
    
    try {
      await CommunitiesService.dismissRecommendation(recommendationId);
      setRecommendations(prev => prev.filter(rec => rec.id !== recommendationId));
      onRecommendationDismissed?.();
      
      toast({
        title: "Recommendation dismissed",
        description: "We'll improve our suggestions based on your feedback."
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss recommendation",
        variant: "destructive"
      });
    } finally {
      setDismissingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(recommendationId);
        return newSet;
      });
    }
  };

  const handleJoin = async (groupId: string) => {
    try {
      await CommunitiesService.joinGroup(groupId);
      setRecommendations(prev => prev.filter(rec => rec.group_id !== groupId));
      onJoinGroup?.(groupId);
      
      toast({
        title: "Success",
        description: "You've joined the community!"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join community",
        variant: "destructive"
      });
    }
  };

  const getReasonColor = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'industry_match': 'bg-blue-100 text-blue-800',
      'skill_match': 'bg-green-100 text-green-800',
      'career_stage': 'bg-purple-100 text-purple-800',
      'trending': 'bg-orange-100 text-orange-800',
      'similar_interests': 'bg-pink-100 text-pink-800',
      'location_based': 'bg-yellow-100 text-yellow-800'
    };
    return reasonMap[reason] || 'bg-gray-100 text-gray-800';
  };

  const formatReason = (reason: string) => {
    const reasonMap: Record<string, string> = {
      'industry_match': 'Industry Match',
      'skill_match': 'Skill Match',
      'career_stage': 'Career Stage',
      'trending': 'Trending',
      'similar_interests': 'Similar Interests',
      'location_based': 'Location Based'
    };
    return reasonMap[reason] || reason.replace('_', ' ');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return null;
  }

  if (!isVisible) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsVisible(true)}
        className="w-full"
      >
        <Eye className="h-4 w-4 mr-2" />
        Show Recommendations ({recommendations.length})
      </Button>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>Recommended for You</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsVisible(false)}
          >
            <EyeOff className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {recommendations.map((recommendation) => {
          const group = recommendation.group;
          if (!group) return null;

          return (
            <Card key={recommendation.id} className="p-4">
              <div className="flex items-start justify-between space-x-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback>
                        {group.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{group.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {group.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count} members</span>
                    </div>
                    <Badge variant="outline">{group.industry}</Badge>
                    <Badge variant="outline">{group.category}</Badge>
                  </div>

                  {recommendation.recommendation_reasons.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {recommendation.recommendation_reasons.map((reason, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className={`text-xs ${getReasonColor(reason)}`}
                        >
                          {formatReason(reason)}
                        </Badge>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      onClick={() => handleJoin(group.id)}
                      size="sm"
                      className="flex-1"
                    >
                      Join Community
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDismiss(recommendation.id)}
                      disabled={dismissingIds.has(recommendation.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                    <TrendingUp className="h-4 w-4" />
                    <span>{Math.round(recommendation.recommendation_score)}% match</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default GroupRecommendations;
