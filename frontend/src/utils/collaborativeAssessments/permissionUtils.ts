
import { AssessmentCollaborator, CollaboratorPermissions } from '@/types/collaborativeAssessments';

export class PermissionChecker {
  private permissions: CollaboratorPermissions;
  private role: string;
  private userId: string;

  constructor(collaborator: AssessmentCollaborator) {
    this.permissions = collaborator.permissions;
    this.role = collaborator.role;
    this.userId = collaborator.user_id;
  }

  // Core permissions
  canEdit(): boolean {
    return this.permissions.can_edit;
  }

  canEvaluate(): boolean {
    return this.permissions.can_evaluate;
  }

  canInviteOthers(): boolean {
    return this.permissions.can_invite_others;
  }

  canViewReports(): boolean {
    return this.permissions.can_view_reports;
  }

  canComment(): boolean {
    return this.permissions.can_comment;
  }

  // Assessment management
  canEditAssessmentDetails(): boolean {
    return this.permissions.can_edit_assessment_details;
  }

  canDeleteAssessment(): boolean {
    return this.permissions.can_delete_assessment;
  }

  canChangeDueDate(): boolean {
    return this.permissions.can_change_due_date;
  }

  canModifyInstructions(): boolean {
    return this.permissions.can_modify_instructions;
  }

  // Evaluation permissions
  canEvaluateSection(sectionId: string): boolean {
    if (!this.permissions.can_evaluate) return false;
    
    if (this.permissions.can_evaluate_all_sections) return true;
    
    return this.permissions.can_evaluate_specific_sections.includes(sectionId);
  }

  canOverrideEvaluations(): boolean {
    return this.permissions.can_override_evaluations;
  }

  canLockEvaluations(): boolean {
    return this.permissions.can_lock_evaluations;
  }

  canViewOtherEvaluations(): boolean {
    return this.permissions.can_view_other_evaluations;
  }

  canExportEvaluations(): boolean {
    return this.permissions.can_export_evaluations;
  }

  // Collaboration permissions
  canRemoveCollaborators(): boolean {
    return this.permissions.can_remove_collaborators;
  }

  canChangeCollaboratorRoles(): boolean {
    return this.permissions.can_change_collaborator_roles;
  }

  canModerateComments(): boolean {
    return this.permissions.can_moderate_comments;
  }

  canDeleteComments(): boolean {
    return this.permissions.can_delete_comments;
  }

  canPinComments(): boolean {
    return this.permissions.can_pin_comments;
  }

  // Reporting permissions
  canGenerateReports(): boolean {
    return this.permissions.can_generate_reports;
  }

  canViewDetailedAnalytics(): boolean {
    return this.permissions.can_view_detailed_analytics;
  }

  canExportReports(): boolean {
    return this.permissions.can_export_reports;
  }

  canShareReportsExternally(): boolean {
    return this.permissions.can_share_reports_externally;
  }

  // Administrative permissions
  canArchiveAssessment(): boolean {
    return this.permissions.can_archive_assessment;
  }

  canDuplicateAssessment(): boolean {
    return this.permissions.can_duplicate_assessment;
  }

  canCreateTemplatesFromAssessment(): boolean {
    return this.permissions.can_create_templates_from_assessment;
  }

  // Real-time permissions
  canSeeLiveCollaboration(): boolean {
    return this.permissions.can_see_live_collaboration;
  }

  canSendNotifications(): boolean {
    return this.permissions.can_send_notifications;
  }

  canBroadcastMessages(): boolean {
    return this.permissions.can_broadcast_messages;
  }

  // Utility methods
  isOwner(): boolean {
    return this.role === 'owner';
  }

  hasAnyEvaluationPermission(): boolean {
    return this.canEvaluate() || this.canOverrideEvaluations() || this.canLockEvaluations();
  }

  hasAnyCollaborationPermission(): boolean {
    return this.canRemoveCollaborators() || 
           this.canChangeCollaboratorRoles() || 
           this.canModerateComments();
  }

  hasAnyReportingPermission(): boolean {
    return this.canViewReports() || 
           this.canGenerateReports() || 
           this.canViewDetailedAnalytics();
  }

  hasAdministrativePermissions(): boolean {
    return this.canArchiveAssessment() || 
           this.canDuplicateAssessment() || 
           this.canCreateTemplatesFromAssessment();
  }

  // Permission validation for specific actions
  canPerformAction(action: string, context?: any): boolean {
    switch (action) {
      case 'edit_evaluation':
        return this.canEvaluate();
      case 'lock_evaluation':
        return this.canLockEvaluations();
      case 'override_evaluation':
        return this.canOverrideEvaluations();
      case 'delete_comment':
        return this.canDeleteComments();
      case 'pin_comment':
        return this.canPinComments();
      case 'moderate_comment':
        return this.canModerateComments();
      case 'export_data':
        return this.canExportEvaluations() || this.canExportReports();
      case 'invite_collaborator':
        return this.canInviteOthers();
      case 'remove_collaborator':
        return this.canRemoveCollaborators();
      case 'change_role':
        return this.canChangeCollaboratorRoles();
      default:
        return false;
    }
  }

  // Get permission summary for UI display
  getPermissionSummary(): {
    category: string;
    permissions: Array<{ name: string; granted: boolean; description: string }>;
  }[] {
    return [
      {
        category: 'Core Permissions',
        permissions: [
          { name: 'Edit', granted: this.canEdit(), description: 'Edit assessment details and structure' },
          { name: 'Evaluate', granted: this.canEvaluate(), description: 'Submit evaluations and scores' },
          { name: 'Invite', granted: this.canInviteOthers(), description: 'Invite new collaborators' },
          { name: 'View Reports', granted: this.canViewReports(), description: 'Access assessment reports' },
          { name: 'Comment', granted: this.canComment(), description: 'Add comments and feedback' }
        ]
      },
      {
        category: 'Evaluation Management',
        permissions: [
          { name: 'Override Evaluations', granted: this.canOverrideEvaluations(), description: 'Modify other evaluators\' scores' },
          { name: 'Lock Evaluations', granted: this.canLockEvaluations(), description: 'Lock evaluations to prevent changes' },
          { name: 'View Other Evaluations', granted: this.canViewOtherEvaluations(), description: 'See evaluations from other collaborators' },
          { name: 'Export Evaluations', granted: this.canExportEvaluations(), description: 'Export evaluation data' }
        ]
      },
      {
        category: 'Collaboration Management',
        permissions: [
          { name: 'Remove Collaborators', granted: this.canRemoveCollaborators(), description: 'Remove collaborators from assessment' },
          { name: 'Change Roles', granted: this.canChangeCollaboratorRoles(), description: 'Modify collaborator roles and permissions' },
          { name: 'Moderate Comments', granted: this.canModerateComments(), description: 'Moderate and manage comments' },
          { name: 'Pin Comments', granted: this.canPinComments(), description: 'Pin important comments' }
        ]
      },
      {
        category: 'Administrative',
        permissions: [
          { name: 'Archive Assessment', granted: this.canArchiveAssessment(), description: 'Archive completed assessments' },
          { name: 'Duplicate Assessment', granted: this.canDuplicateAssessment(), description: 'Create copies of assessments' },
          { name: 'Create Templates', granted: this.canCreateTemplatesFromAssessment(), description: 'Convert assessments to templates' }
        ]
      }
    ];
  }
}

// Utility function to create permission checker
export const createPermissionChecker = (collaborator: AssessmentCollaborator): PermissionChecker => {
  return new PermissionChecker(collaborator);
};

// Hook-style utility for React components
export const usePermissionChecker = (collaborator: AssessmentCollaborator | null): PermissionChecker | null => {
  if (!collaborator) return null;
  return new PermissionChecker(collaborator);
};
