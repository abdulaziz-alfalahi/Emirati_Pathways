import { CollaborativeAssessment, AssessmentCollaborator, CollaboratorRole, CollaboratorPermissions, CollaborativeAssessmentStatus } from '@/types/collaborativeAssessments';

export const createCollaborativeAssessment = async (assessment: Omit<CollaborativeAssessment, 'id' | 'created_at' | 'updated_at'>) => {
  const { data, error } = await supabase
    .from('collaborative_assessments')
    .insert([{
      ...assessment,
      metadata: assessment.metadata as any
    }])
    .select(`
      *,
      template:assessment_templates(*)
    `)
    .single();

  if (error) {
    console.error('Error creating collaborative assessment:', error);
    throw error;
  }

  return {
    ...data,
    status: data.status as CollaborativeAssessmentStatus,
    template: data.template ? {
      ...data.template,
      sections: data.template.sections as any,
      scoring_criteria: data.template.scoring_criteria as any,
      status: data.template.status as any
    } : undefined
  } as CollaborativeAssessment & { template?: any };
};

export const fetchCollaborativeAssessments = async (userId: string) => {
  const { data, error } = await supabase
    .from('collaborative_assessments')
    .select(`
      *,
      template:assessment_templates(*),
      collaborators:assessment_collaborators(*)
    `)
    .or(`created_by.eq.${userId},candidate_id.eq.${userId}`)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching collaborative assessments:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    status: item.status as CollaborativeAssessmentStatus,
    template: item.template ? {
      ...item.template,
      sections: item.template.sections as any,
      scoring_criteria: item.template.scoring_criteria as any,
      status: item.template.status as any
    } : undefined,
    collaborators: item.collaborators || []
  })) as (CollaborativeAssessment & { template?: any; collaborators?: any[] })[];
};

export const inviteCollaborator = async (
  assessmentId: string,
  userId: string,
  role: CollaboratorRole,
  invitedBy: string,
  permissions: CollaboratorPermissions
) => {
  const collaborator = {
    assessment_id: assessmentId,
    user_id: userId,
    role,
    invited_by: invitedBy,
    invited_at: new Date().toISOString(),
    status: 'pending' as const,
    permissions: permissions as any
  };

  const { data, error } = await supabase
    .from('assessment_collaborators')
    .insert([collaborator])
    .select()
    .single();

  if (error) {
    console.error('Error inviting collaborator:', error);
    throw error;
  }

  return {
    ...data,
    role: data.role as CollaboratorRole,
    permissions: data.permissions as unknown as CollaboratorPermissions
  } as AssessmentCollaborator;
};

export const respondToInvitation = async (collaboratorId: string, status: 'accepted' | 'declined') => {
  const updates: any = { status };
  if (status === 'accepted') {
    updates.joined_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('assessment_collaborators')
    .update(updates)
    .eq('id', collaboratorId)
    .select()
    .single();

  if (error) {
    console.error('Error responding to invitation:', error);
    throw error;
  }

  return {
    ...data,
    role: data.role as CollaboratorRole,
    permissions: data.permissions as unknown as CollaboratorPermissions
  } as AssessmentCollaborator;
};

export const fetchAssessmentCollaborators = async (assessmentId: string) => {
  const { data, error } = await supabase
    .from('assessment_collaborators')
    .select(`
      *,
      user:profiles(*)
    `)
    .eq('assessment_id', assessmentId)
    .order('invited_at', { ascending: false });

  if (error) {
    console.error('Error fetching assessment collaborators:', error);
    throw error;
  }

  return (data || []).map(item => ({
    ...item,
    role: item.role as CollaboratorRole,
    permissions: item.permissions as unknown as CollaboratorPermissions
  })) as (AssessmentCollaborator & { user?: any })[];
};

export const removeCollaborator = async (collaboratorId: string) => {
  const { error } = await supabase
    .from('assessment_collaborators')
    .delete()
    .eq('id', collaboratorId);

  if (error) {
    console.error('Error removing collaborator:', error);
    throw error;
  }

  return true;
};

export const updateCollaboratorRole = async (collaboratorId: string, role: CollaboratorRole, permissions: CollaboratorPermissions) => {
  const { data, error } = await supabase
    .from('assessment_collaborators')
    .update({ 
      role, 
      permissions: permissions as any 
    })
    .eq('id', collaboratorId)
    .select()
    .single();

  if (error) {
    console.error('Error updating collaborator role:', error);
    throw error;
  }

  return {
    ...data,
    role: data.role as CollaboratorRole,
    permissions: data.permissions as unknown as CollaboratorPermissions
  } as AssessmentCollaborator;
};

// New function to check if user has specific permission
export const checkUserPermission = async (
  assessmentId: string, 
  userId: string, 
  permission: keyof CollaboratorPermissions
): Promise<boolean> => {
  const { data, error } = await supabase
    .from('assessment_collaborators')
    .select('permissions')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .single();

  if (error || !data) {
    return false;
  }

  const permissions = data.permissions as unknown as CollaboratorPermissions;
  const permissionValue = permissions[permission];
  
  // Handle the case where the permission might be a boolean or string array
  if (typeof permissionValue === 'boolean') {
    return permissionValue;
  }
  
  // For array permissions like can_evaluate_specific_sections, check if array has items
  if (Array.isArray(permissionValue)) {
    return permissionValue.length > 0;
  }
  
  return false;
};

// New function to get user's effective permissions
export const getUserPermissions = async (
  assessmentId: string, 
  userId: string
): Promise<CollaboratorPermissions | null> => {
  const { data, error } = await supabase
    .from('assessment_collaborators')
    .select('permissions, role')
    .eq('assessment_id', assessmentId)
    .eq('user_id', userId)
    .eq('status', 'accepted')
    .single();

  if (error || !data) {
    return null;
  }

  return data.permissions as unknown as CollaboratorPermissions;
};

// Bulk permission update for multiple collaborators
export const bulkUpdatePermissions = async (
  updates: Array<{
    collaboratorId: string;
    permissions: CollaboratorPermissions;
  }>
): Promise<AssessmentCollaborator[]> => {
  const results: AssessmentCollaborator[] = [];

  for (const update of updates) {
    try {
      const { data, error } = await supabase
        .from('assessment_collaborators')
        .update({ permissions: update.permissions as any })
        .eq('id', update.collaboratorId)
        .select()
        .single();

      if (error) {
        console.error(`Error updating collaborator ${update.collaboratorId}:`, error);
        continue;
      }

      results.push({
        ...data,
        role: data.role as CollaboratorRole,
        permissions: data.permissions as unknown as CollaboratorPermissions
      } as AssessmentCollaborator);
    } catch (err) {
      console.error(`Failed to update collaborator ${update.collaboratorId}:`, err);
    }
  }

  return results;
};
