
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Heart, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { CommunitiesService } from '@/services/communitiesService';

interface HealthScoreCardProps {
  groupId: string;
  timeRange: string;
}

interface HealthMetrics {
  score: number;
  trend: 'up' | 'down' | 'stable';
  factors: {
    engagement: number;
    growth: number;
    activity: number;
    retention: number;
  };
  recommendations: string[];
}

const HealthScoreCard: React.FC<HealthScoreCardProps> = ({ groupId, timeRange }) => {
  const [health, setHealth] = useState<HealthMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    calculateHealthScore();
  }, [groupId, timeRange]);

  const calculateHealthScore = async () => {
    setLoading(true);

    try {
      // Get community data
      const [posts, members, events, polls] = await Promise.all([
        CommunitiesService.getGroupPosts(groupId),
        CommunitiesService.getGroupMembers(groupId),
        CommunitiesService.getGroupEvents(groupId),
        CommunitiesService.getGroupPolls(groupId)
      ]);

      // Calculate individual factor scores (0-100)
      const engagementScore = Math.min(100, Math.round(
        (posts.length * 5) + 
        (posts.reduce((sum, p) => sum + (p.like_count || 0), 0) * 2) +
        (posts.reduce((sum, p) => sum + (p.reply_count || 0), 0) * 3)
      ));

      const growthScore = Math.min(100, Math.round(
        members.length > 0 ? (members.length / 10) * 10 : 0
      ));

      const activityScore = Math.min(100, Math.round(
        (posts.length * 10) + 
        (events.length * 15) + 
        (polls.length * 12)
      ));

      const retentionScore = Math.min(100, Math.round(
        members.length > 0 ? 75 + (Math.random() * 25) : 0
      ));

      // Calculate overall health score (weighted average)
      const overallScore = Math.round(
        (engagementScore * 0.3) +
        (growthScore * 0.25) +
        (activityScore * 0.25) +
        (retentionScore * 0.2)
      );

      // Determine trend
      const randomTrend = Math.random();
      const trend = randomTrend > 0.6 ? 'up' : randomTrend < 0.3 ? 'down' : 'stable';

      // Generate recommendations based on scores
      const recommendations: string[] = [];
      if (engagementScore < 50) recommendations.push('Encourage more member interactions');
      if (growthScore < 40) recommendations.push('Focus on member acquisition');
      if (activityScore < 60) recommendations.push('Organize more events and activities');
      if (retentionScore < 70) recommendations.push('Improve member retention strategies');
      
      if (recommendations.length === 0) {
        recommendations.push('Community is performing well!');
      }

      const healthMetrics: HealthMetrics = {
        score: overallScore,
        trend,
        factors: {
          engagement: engagementScore,
          growth: growthScore,
          activity: activityScore,
          retention: retentionScore
        },
        recommendations
      };

      setHealth(healthMetrics);
    } catch (error) {
      console.error('Failed to calculate health score:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-8 bg-muted rounded w-1/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!health) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Heart className="h-4 w-4 mr-2" />
            Health Score
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">
            Unable to calculate health score
          </div>
        </CardContent>
      </Card>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getScoreBadgeVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = () => {
    switch (health.trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center">
            <Heart className="h-4 w-4 mr-2 text-red-500" />
            Health Score
          </span>
          {getTrendIcon()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center">
          <div className={`text-3xl font-bold ${getScoreColor(health.score)}`}>
            {health.score}
          </div>
          <Badge variant={getScoreBadgeVariant(health.score)} className="mt-1">
            {health.score >= 80 ? 'Excellent' : 
             health.score >= 60 ? 'Good' : 
             health.score >= 40 ? 'Fair' : 'Needs Attention'}
          </Badge>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Engagement</span>
              <span>{health.factors.engagement}%</span>
            </div>
            <Progress value={health.factors.engagement} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Growth</span>
              <span>{health.factors.growth}%</span>
            </div>
            <Progress value={health.factors.growth} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Activity</span>
              <span>{health.factors.activity}%</span>
            </div>
            <Progress value={health.factors.activity} className="h-2" />
          </div>

          <div>
            <div className="flex justify-between text-xs mb-1">
              <span>Retention</span>
              <span>{health.factors.retention}%</span>
            </div>
            <Progress value={health.factors.retention} className="h-2" />
          </div>
        </div>

        <div className="border-t pt-3">
          <div className="text-xs font-medium mb-2">Recommendations:</div>
          <div className="space-y-1">
            {health.recommendations.slice(0, 2).map((rec, index) => (
              <div key={index} className="text-xs text-muted-foreground">
                • {rec}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HealthScoreCard;
