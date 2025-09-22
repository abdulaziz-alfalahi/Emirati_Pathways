
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { AssessmentCollaborator, CollaboratorRole } from '@/types/collaborativeAssessments';
import { fetchAssessmentCollaborators, removeCollaborator, updateCollaboratorRole } from '@/services/collaborativeAssessments/assessmentService';
import { CollaboratorInviteDialog } from './CollaboratorInviteDialog';
import { CollaboratorRoleSelector } from './CollaboratorRoleSelector';
import { UserMinus, Mail, CheckCircle, Clock, XCircle } from 'lucide-react';

interface CollaboratorsListProps {
  assessmentId: string;
}

const roleColors: Record<CollaboratorRole, string> = {
  owner: 'bg-purple-100 text-purple-800',
  trainer: 'bg-blue-100 text-blue-800',
  mentor: 'bg-green-100 text-green-800',
  employer: 'bg-orange-100 text-orange-800',
  evaluator: 'bg-gray-100 text-gray-800',
  viewer: 'bg-slate-100 text-slate-800'
};

const statusIcons = {
  pending: Clock,
  accepted: CheckCircle,
  declined: XCircle
};

const statusColors = {
  pending: 'text-yellow-600',
  accepted: 'text-green-600',
  declined: 'text-red-600'
};

export const CollaboratorsList: React.FC<CollaboratorsListProps> = ({ assessmentId }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: collaborators, isLoading } = useQuery({
    queryKey: ['assessment-collaborators', assessmentId],
    queryFn: () => fetchAssessmentCollaborators(assessmentId)
  });

  const removeMutation = useMutation({
    mutationFn: removeCollaborator,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-collaborators', assessmentId] });
      toast({
        title: "Collaborator removed",
        description: "The collaborator has been removed from this assessment."
      });
    },
    onError: (error) => {
      console.error('Error removing collaborator:', error);
      toast({
        title: "Error",
        description: "Failed to remove collaborator. Please try again.",
        variant: "destructive"
      });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ collaboratorId, role, permissions }: { 
      collaboratorId: string; 
      role: CollaboratorRole; 
      permissions: any;
    }) => updateCollaboratorRole(collaboratorId, role, permissions),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assessment-collaborators', assessmentId] });
      toast({
        title: "Role updated",
        description: "Collaborator role has been updated successfully."
      });
    },
    onError: (error) => {
      console.error('Error updating role:', error);
      toast({
        title: "Error",
        description: "Failed to update collaborator role. Please try again.",
        variant: "destructive"
      });
    }
  });

  const currentUserCollaborator = collaborators?.find(c => c.user_id === user?.id);
  const canManageCollaborators = currentUserCollaborator?.permissions?.can_invite_others;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collaborators</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground">Loading collaborators...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Collaborators ({collaborators?.length || 0})</CardTitle>
        {canManageCollaborators && (
          <CollaboratorInviteDialog assessmentId={assessmentId} />
        )}
      </CardHeader>
      <CardContent>
        {!collaborators || collaborators.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No collaborators yet</p>
            <p className="text-sm">Invite team members to collaborate on this assessment</p>
          </div>
        ) : (
          <div className="space-y-4">
            {collaborators.map((collaborator) => {
              const StatusIcon = statusIcons[collaborator.status as keyof typeof statusIcons];
              const isCurrentUser = collaborator.user_id === user?.id;
              const canEditThisCollaborator = canManageCollaborators && !isCurrentUser;

              return (
                <div key={collaborator.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarFallback>
                        {collaborator.user?.full_name?.split(' ').map((n: string) => n[0]).join('') || 
                         collaborator.user?.email?.substring(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">
                          {collaborator.user?.full_name || collaborator.user?.email || 'Unknown User'}
                          {isCurrentUser && <span className="text-muted-foreground">(You)</span>}
                        </span>
                        <StatusIcon className={`h-4 w-4 ${statusColors[collaborator.status as keyof typeof statusColors]}`} />
                      </div>
                      
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="secondary" className={roleColors[collaborator.role]}>
                          {collaborator.role}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Invited {new Date(collaborator.invited_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {collaborator.status === 'accepted' && collaborator.joined_at && (
                        <span className="text-xs text-muted-foreground">
                          Joined {new Date(collaborator.joined_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {canEditThisCollaborator && (
                      <>
                        <CollaboratorRoleSelector
                          currentRole={collaborator.role}
                          currentPermissions={collaborator.permissions}
                          onRoleChange={(role, permissions) => 
                            updateRoleMutation.mutate({
                              collaboratorId: collaborator.id,
                              role,
                              permissions
                            })
                          }
                          disabled={updateRoleMutation.isPending}
                        />
                        
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeMutation.mutate(collaborator.id)}
                          disabled={removeMutation.isPending}
                        >
                          <UserMinus className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
