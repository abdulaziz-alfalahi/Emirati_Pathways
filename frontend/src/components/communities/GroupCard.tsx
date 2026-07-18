
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Users, 
  Lock, 
  Calendar, 
  MessageSquare,
  TrendingUp,
  Activity,
  Clock
} from 'lucide-react';
import { GroupWithMetrics } from '@/types/communities';

interface GroupCardProps {
  group: GroupWithMetrics;
  onJoin: (groupId: string) => void;
  isJoined: boolean;
  isLoading: boolean;
  showMetrics?: boolean;
}

const GroupCard: React.FC<GroupCardProps> = ({ 
  group, 
  onJoin, 
  isJoined, 
  isLoading,
  showMetrics = false
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getActivityLevel = (score: number) => {
    if (score >= 50) return { level: 'High', color: 'text-green-600' };
    if (score >= 20) return { level: 'Medium', color: 'text-yellow-600' };
    return { level: 'Low', color: 'text-gray-600' };
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback>
              {group.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg line-clamp-1">{group.name}</CardTitle>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{group.industry}</span>
              {group.is_private && <Lock className="h-3 w-3" />}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col space-y-4">
        <p className="text-sm text-muted-foreground line-clamp-3 flex-1">
          {group.description}
        </p>

        <div className="space-y-3">
          {/* Basic Info */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>{group.member_count} members</span>
            </div>
            <Badge variant="outline">{group.category}</Badge>
          </div>

          {/* Metrics Section */}
          {showMetrics && (
            <div className="space-y-2 border-t pt-3">
              {group.trending_score !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span>Trending Score</span>
                  </div>
                  <span className="font-medium">{Math.round(group.trending_score)}</span>
                </div>
              )}

              {group.recent_activity && (
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span>Activity Level</span>
                    </div>
                    <span className={`font-medium ${getActivityLevel(group.recent_activity.engagement_score).color}`}>
                      {getActivityLevel(group.recent_activity.engagement_score).level}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <MessageSquare className="h-3 w-3" />
                      <span>{group.recent_activity.posts_count} posts</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-3 w-3" />
                      <span>{group.recent_activity.events_count} events</span>
                    </div>
                  </div>
                </div>
              )}

              {group.recommendation_score !== undefined && (
                <div className="flex items-center justify-between text-sm">
                  <span>Match Score</span>
                  <Badge variant="secondary">
                    {Math.round(group.recommendation_score)}% match
                  </Badge>
                </div>
              )}

              {group.recommendation_reasons && group.recommendation_reasons.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {group.recommendation_reasons.slice(0, 2).map((reason, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {reason.replace('_', ' ')}
                    </Badge>
                  ))}
                  {group.recommendation_reasons.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{group.recommendation_reasons.length - 2} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          {group.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {group.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {group.tags.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{group.tags.length - 3}
                </Badge>
              )}
            </div>
          )}

          {/* Created Date */}
          <div className="flex items-center text-xs text-muted-foreground">
            <Clock className="h-3 w-3 me-1" />
            <span>Created {formatDate(group.created_at)}</span>
          </div>
        </div>

        {/* Action Button */}
        <Button
          onClick={() => onJoin(group.id)}
          disabled={isJoined || isLoading}
          className="w-full"
          variant={isJoined ? 'outline' : 'default'}
        >
          {isLoading ? 'Joining...' : isJoined ? 'Joined' : 'Join Community'}
        </Button>
      </CardContent>
    </Card>
  );
};

export default GroupCard;
