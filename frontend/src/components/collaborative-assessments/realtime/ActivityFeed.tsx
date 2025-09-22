import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ActivityFeedItem } from '@/services/collaborativeAssessments/realtimeCollaborationService';
import { formatDistanceToNow } from 'date-fns';
import { MessageSquare, CheckCircle, Play, UserPlus, UserMinus } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityFeedItem[];
  className?: string;
}

const getActivityIcon = (activityType: ActivityFeedItem['activity_type']) => {
  switch (activityType) {
    case 'joined':
      return <UserPlus className="h-4 w-4 text-green-500" />;
    case 'left':
      return <UserMinus className="h-4 w-4 text-gray-500" />;
    case 'evaluation_submitted':
      return <CheckCircle className="h-4 w-4 text-blue-500" />;
    case 'comment_added':
      return <MessageSquare className="h-4 w-4 text-purple-500" />;
    case 'section_started':
      return <Play className="h-4 w-4 text-orange-500" />;
    case 'section_completed':
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <div className="h-4 w-4 rounded-full bg-gray-300" />;
  }
};

const getActivityMessage = (activity: ActivityFeedItem) => {
  const userName = activity.user?.full_name || 'Someone';
  
  switch (activity.activity_type) {
    case 'joined':
      return `${userName} joined the assessment`;
    case 'left':
      return `${userName} left the assessment`;
    case 'evaluation_submitted':
      const criterionTitle = activity.activity_data?.criterion_title;
      return criterionTitle 
        ? `${userName} submitted evaluation for ${criterionTitle}`
        : `${userName} submitted an evaluation`;
    case 'comment_added':
      return `${userName} added a comment`;
    case 'section_started':
      return `${userName} started ${activity.activity_data?.section_title || 'a section'}`;
    case 'section_completed':
      return `${userName} completed a section`;
    default:
      return `${userName} performed an action`;
  }
};

const getActivityColor = (activityType: ActivityFeedItem['activity_type']) => {
  switch (activityType) {
    case 'joined':
      return 'bg-green-50 border-green-200';
    case 'left':
      return 'bg-gray-50 border-gray-200';
    case 'evaluation_submitted':
      return 'bg-blue-50 border-blue-200';
    case 'comment_added':
      return 'bg-purple-50 border-purple-200';
    case 'section_started':
      return 'bg-orange-50 border-orange-200';
    case 'section_completed':
      return 'bg-green-50 border-green-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities, className }) => {
  if (activities.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <MessageSquare className="h-4 w-4" />
            <span>Recent Activity</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-sm text-muted-foreground py-4">
            No recent activity
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <MessageSquare className="h-4 w-4" />
          <span>Recent Activity</span>
          {activities.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activities.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 max-h-96 overflow-y-auto">
        {activities.map((activity) => (
          <div
            key={activity.id}
            className={`flex items-start space-x-3 p-3 rounded-lg border transition-all hover:shadow-sm ${getActivityColor(activity.activity_type)}`}
          >
            <div className="flex-shrink-0 mt-0.5">
              {getActivityIcon(activity.activity_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarImage src={activity.user?.avatar_url} />
                  <AvatarFallback className="text-xs">
                    {activity.user?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium text-gray-900">
                  {getActivityMessage(activity)}
                </span>
              </div>
              
              <div className="flex items-center justify-between mt-1">
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
                </span>
                
                {activity.section_id && (
                  <Badge variant="secondary" className="text-xs">
                    Section Activity
                  </Badge>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
