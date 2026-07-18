
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CollaborationSession } from '@/services/collaborativeAssessments/realtimeCollaborationService';

interface CollaborativeCursorsProps {
  collaborators: CollaborationSession[];
  currentSectionId: string;
  className?: string;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = ({
  collaborators,
  currentSectionId,
  className = ''
}) => {
  // Filter collaborators who are working on the current section
  const activeCollaboratorsInSection = collaborators.filter(
    c => c.status === 'active' && c.current_section_id === currentSectionId
  );

  if (activeCollaboratorsInSection.length === 0) {
    return null;
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      <div className="flex items-center space-x-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs text-muted-foreground">Others working here:</span>
      </div>
      
      <div className="flex -space-x-1">
        {activeCollaboratorsInSection.map((collaborator) => (
          <div key={collaborator.id} className="relative">
            <Avatar className="h-6 w-6 border-2 border-green-500">
              <AvatarImage src={collaborator.user?.avatar_url} />
              <AvatarFallback className="text-xs bg-green-100">
                {collaborator.user?.full_name?.charAt(0) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="absolute -top-1 -end-1 w-3 h-3 bg-green-500 border border-white rounded-full animate-pulse"></div>
          </div>
        ))}
      </div>
      
      {activeCollaboratorsInSection.length === 1 && (
        <Badge variant="secondary" className="text-xs">
          {activeCollaboratorsInSection[0].user?.full_name || 'Unknown'} is here
        </Badge>
      )}
      
      {activeCollaboratorsInSection.length > 1 && (
        <Badge variant="secondary" className="text-xs">
          {activeCollaboratorsInSection.length} people working
        </Badge>
      )}
    </div>
  );
};
