
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { CollaborationSession } from '@/services/collaborativeAssessments/realtimeCollaborationService';
import { Users, Wifi, WifiOff } from 'lucide-react';

interface CollaborationStatusBarProps {
  collaborators: CollaborationSession[];
  isConnected: boolean;
  className?: string;
}

export const CollaborationStatusBar: React.FC<CollaborationStatusBarProps> = ({
  collaborators,
  isConnected,
  className = ''
}) => {
  const activeCollaborators = collaborators.filter(c => c.status === 'active');

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center space-x-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-xs ${isConnected ? 'text-green-600' : 'text-red-600'}`}>
          {isConnected ? 'Live' : 'Offline'}
        </span>
      </div>

      {/* Active Collaborators Count */}
      <div className="flex items-center space-x-1">
        <Users className="h-4 w-4 text-gray-500" />
        <Badge variant="secondary" className="text-xs">
          {activeCollaborators.length} active
        </Badge>
      </div>

      {/* Active Collaborators Avatars */}
      {activeCollaborators.length > 0 && (
        <div className="flex -space-x-2">
          {activeCollaborators.slice(0, 3).map((collaborator) => (
            <TooltipProvider key={collaborator.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="relative">
                    <Avatar className="h-6 w-6 border-2 border-white">
                      <AvatarImage src={collaborator.user?.avatar_url} />
                      <AvatarFallback className="text-xs">
                        {collaborator.user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="text-sm">{collaborator.user?.full_name || 'Unknown User'}</p>
                  <p className="text-xs text-muted-foreground">Active now</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
          {activeCollaborators.length > 3 && (
            <div className="flex items-center justify-center h-6 w-6 bg-gray-100 border-2 border-white rounded-full">
              <span className="text-xs text-gray-600">
                +{activeCollaborators.length - 3}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
