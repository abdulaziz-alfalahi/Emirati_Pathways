
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollaborationSession } from '@/services/collaborativeAssessments/realtimeCollaborationService';
import { formatDistanceToNow } from 'date-fns';
import { Users, Circle } from 'lucide-react';

interface ActiveCollaboratorsProps {
  collaborators: CollaborationSession[];
  className?: string;
}

const getStatusColor = (status: CollaborationSession['status']) => {
  switch (status) {
    case 'active':
      return 'text-green-500';
    case 'idle':
      return 'text-yellow-500';
    case 'disconnected':
      return 'text-gray-500';
    default:
      return 'text-gray-500';
  }
};

const getStatusLabel = (status: CollaborationSession['status']) => {
  switch (status) {
    case 'active':
      return 'Active';
    case 'idle':
      return 'Idle';
    case 'disconnected':
      return 'Offline';
    default:
      return 'Unknown';
  }
};

export const ActiveCollaborators: React.FC<ActiveCollaboratorsProps> = ({ 
  collaborators, 
  className 
}) => {
  const activeCount = collaborators.filter(c => c.status === 'active').length;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-sm font-medium flex items-center space-x-2">
          <Users className="h-4 w-4" />
          <span>Active Collaborators</span>
          <Badge variant="secondary" className="text-xs">
            {activeCount}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {collaborators.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-4">
            No active collaborators
          </div>
        ) : (
          <div className="space-y-3">
            {collaborators.map((collaborator) => (
              <TooltipProvider key={collaborator.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={collaborator.user?.avatar_url} />
                            <AvatarFallback className="text-sm">
                              {collaborator.user?.full_name?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <Circle 
                            className={`absolute -bottom-1 -end-1 h-3 w-3 fill-current ${getStatusColor(collaborator.status)}`}
                          />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {collaborator.user?.full_name || 'Unknown User'}
                          </div>
                          {collaborator.current_section_id && (
                            <div className="text-xs text-muted-foreground">
                              Working on section
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <Badge 
                        variant={collaborator.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {getStatusLabel(collaborator.status)}
                      </Badge>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="left">
                    <div className="text-xs">
                      <div className="font-medium">{collaborator.user?.full_name}</div>
                      <div className="text-muted-foreground">
                        Last active: {formatDistanceToNow(new Date(collaborator.last_activity), { addSuffix: true })}
                      </div>
                      {collaborator.current_section_id && (
                        <div className="text-muted-foreground">
                          Current section: {collaborator.current_section_id}
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
