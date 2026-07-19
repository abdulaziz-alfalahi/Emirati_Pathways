
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { ActivityFeedItem } from '@/services/collaborativeAssessments/realtimeCollaborationService';
import { formatDistanceToNow } from 'date-fns';

interface CriterionCollaboratorsProps {
  criterionId: string;
  sectionId: string;
  recentActivity: ActivityFeedItem[];
  className?: string;
}

export const CriterionCollaborators: React.FC<CriterionCollaboratorsProps> = ({
  criterionId,
  sectionId,
  recentActivity,
  className = ''
}) => {
  // Find recent activity for this specific criterion
  const criterionActivity = recentActivity.filter(
    activity => 
      activity.criterion_id === criterionId && 
      activity.section_id === sectionId &&
      (activity.activity_type === 'evaluation_submitted' || activity.activity_type === 'comment_added') &&
      // Only show activity from the last 5 minutes
      new Date().getTime() - new Date(activity.created_at).getTime() < 5 * 60 * 1000
  );

  if (criterionActivity.length === 0) {
    return null;
  }

  // Get unique users who have been active on this criterion recently
  const activeUsers = criterionActivity.reduce((users, activity) => {
    if (!users.find(u => u.user_id === activity.user_id)) {
      users.push({
        user_id: activity.user_id,
        user: activity.user,
        latest_activity: activity.created_at,
        activity_type: activity.activity_type
      });
    }
    return users;
  }, [] as Array<{
    user_id: string;
    user: any;
    latest_activity: string;
    activity_type: string;
  }>);

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex -space-x-1">
        {activeUsers.slice(0, 3).map((user) => (
          <TooltipProvider key={user.user_id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-5 w-5 border-2 border-blue-500">
                    <AvatarImage src={user.user?.avatar_url} />
                    <AvatarFallback className="text-xs bg-blue-100">
                      {user.user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-0.5 -end-0.5 w-2 h-2 bg-blue-500 border border-white rounded-full animate-pulse"></div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-xs">
                  <div className="font-medium">{user.user?.full_name || 'Unknown User'}</div>
                  <div className="text-muted-foreground">
                    {user.activity_type === 'evaluation_submitted' ? 'Evaluated' : 'Commented'} {formatDistanceToNow(new Date(user.latest_activity), { addSuffix: true })}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
        
        {activeUsers.length > 3 && (
          <div className="flex items-center justify-center h-5 w-5 bg-blue-100 border-2 border-blue-500 rounded-full">
            <span className="text-xs text-blue-600">
              +{activeUsers.length - 3}
            </span>
          </div>
        )}
      </div>
      
      {activeUsers.length === 1 && (
        <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
          Recent activity
        </Badge>
      )}
    </div>
  );
};
