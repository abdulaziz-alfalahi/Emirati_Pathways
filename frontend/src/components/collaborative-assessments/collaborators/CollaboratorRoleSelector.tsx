
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { CollaboratorRole, CollaboratorPermissions } from '@/types/collaborativeAssessments';
import { Settings } from 'lucide-react';

interface CollaboratorRoleSelectorProps {
  currentRole: CollaboratorRole;
  currentPermissions: CollaboratorPermissions;
  onRoleChange: (role: CollaboratorRole, permissions: CollaboratorPermissions) => void;
  disabled?: boolean;
}

const rolePermissions: Record<CollaboratorRole, CollaboratorPermissions> = {
  owner: {
    can_edit: true,
    can_evaluate: true,
    can_invite_others: true,
    can_view_reports: true,
    can_comment: true,
    can_edit_assessment_details: true,
    can_delete_assessment: true,
    can_change_due_date: true,
    can_modify_instructions: true,
    can_evaluate_all_sections: true,
    can_evaluate_specific_sections: [],
    can_override_evaluations: true,
    can_lock_evaluations: true,
    can_view_other_evaluations: true,
    can_export_evaluations: true,
    can_remove_collaborators: true,
    can_change_collaborator_roles: true,
    can_moderate_comments: true,
    can_delete_comments: true,
    can_pin_comments: true,
    can_generate_reports: true,
    can_view_detailed_analytics: true,
    can_export_reports: true,
    can_share_reports_externally: true,
    can_archive_assessment: true,
    can_duplicate_assessment: true,
    can_create_templates_from_assessment: true,
    can_see_live_collaboration: true,
    can_send_notifications: true,
    can_broadcast_messages: true
  },
  trainer: {
    can_edit: true,
    can_evaluate: true,
    can_invite_others: false,
    can_view_reports: true,
    can_comment: true,
    can_edit_assessment_details: true,
    can_delete_assessment: false,
    can_change_due_date: true,
    can_modify_instructions: true,
    can_evaluate_all_sections: true,
    can_evaluate_specific_sections: [],
    can_override_evaluations: true,
    can_lock_evaluations: true,
    can_view_other_evaluations: true,
    can_export_evaluations: true,
    can_remove_collaborators: false,
    can_change_collaborator_roles: false,
    can_moderate_comments: true,
    can_delete_comments: false,
    can_pin_comments: true,
    can_generate_reports: true,
    can_view_detailed_analytics: true,
    can_export_reports: true,
    can_share_reports_externally: false,
    can_archive_assessment: false,
    can_duplicate_assessment: true,
    can_create_templates_from_assessment: true,
    can_see_live_collaboration: true,
    can_send_notifications: true,
    can_broadcast_messages: false
  },
  mentor: {
    can_edit: false,
    can_evaluate: true,
    can_invite_others: false,
    can_view_reports: true,
    can_comment: true,
    can_edit_assessment_details: false,
    can_delete_assessment: false,
    can_change_due_date: false,
    can_modify_instructions: false,
    can_evaluate_all_sections: true,
    can_evaluate_specific_sections: [],
    can_override_evaluations: false,
    can_lock_evaluations: false,
    can_view_other_evaluations: true,
    can_export_evaluations: true,
    can_remove_collaborators: false,
    can_change_collaborator_roles: false,
    can_moderate_comments: false,
    can_delete_comments: false,
    can_pin_comments: false,
    can_generate_reports: true,
    can_view_detailed_analytics: true,
    can_export_reports: true,
    can_share_reports_externally: false,
    can_archive_assessment: false,
    can_duplicate_assessment: false,
    can_create_templates_from_assessment: false,
    can_see_live_collaboration: true,
    can_send_notifications: false,
    can_broadcast_messages: false
  },
  employer: {
    can_edit: false,
    can_evaluate: true,
    can_invite_others: false,
    can_view_reports: true,
    can_comment: true,
    can_edit_assessment_details: false,
    can_delete_assessment: false,
    can_change_due_date: false,
    can_modify_instructions: false,
    can_evaluate_all_sections: true,
    can_evaluate_specific_sections: [],
    can_override_evaluations: false,
    can_lock_evaluations: false,
    can_view_other_evaluations: true,
    can_export_evaluations: true,
    can_remove_collaborators: false,
    can_change_collaborator_roles: false,
    can_moderate_comments: false,
    can_delete_comments: false,
    can_pin_comments: false,
    can_generate_reports: true,
    can_view_detailed_analytics: false,
    can_export_reports: true,
    can_share_reports_externally: true,
    can_archive_assessment: false,
    can_duplicate_assessment: false,
    can_create_templates_from_assessment: false,
    can_see_live_collaboration: true,
    can_send_notifications: false,
    can_broadcast_messages: false
  },
  evaluator: {
    can_edit: false,
    can_evaluate: true,
    can_invite_others: false,
    can_view_reports: false,
    can_comment: true,
    can_edit_assessment_details: false,
    can_delete_assessment: false,
    can_change_due_date: false,
    can_modify_instructions: false,
    can_evaluate_all_sections: true,
    can_evaluate_specific_sections: [],
    can_override_evaluations: false,
    can_lock_evaluations: false,
    can_view_other_evaluations: false,
    can_export_evaluations: false,
    can_remove_collaborators: false,
    can_change_collaborator_roles: false,
    can_moderate_comments: false,
    can_delete_comments: false,
    can_pin_comments: false,
    can_generate_reports: false,
    can_view_detailed_analytics: false,
    can_export_reports: false,
    can_share_reports_externally: false,
    can_archive_assessment: false,
    can_duplicate_assessment: false,
    can_create_templates_from_assessment: false,
    can_see_live_collaboration: true,
    can_send_notifications: false,
    can_broadcast_messages: false
  },
  viewer: {
    can_edit: false,
    can_evaluate: false,
    can_invite_others: false,
    can_view_reports: true,
    can_comment: true,
    can_edit_assessment_details: false,
    can_delete_assessment: false,
    can_change_due_date: false,
    can_modify_instructions: false,
    can_evaluate_all_sections: false,
    can_evaluate_specific_sections: [],
    can_override_evaluations: false,
    can_lock_evaluations: false,
    can_view_other_evaluations: true,
    can_export_evaluations: false,
    can_remove_collaborators: false,
    can_change_collaborator_roles: false,
    can_moderate_comments: false,
    can_delete_comments: false,
    can_pin_comments: false,
    can_generate_reports: false,
    can_view_detailed_analytics: false,
    can_export_reports: false,
    can_share_reports_externally: false,
    can_archive_assessment: false,
    can_duplicate_assessment: false,
    can_create_templates_from_assessment: false,
    can_see_live_collaboration: true,
    can_send_notifications: false,
    can_broadcast_messages: false
  }
};

const permissionCategories = {
  core: [
    { key: 'can_edit', label: 'Edit Assessment' },
    { key: 'can_evaluate', label: 'Evaluate' },
    { key: 'can_invite_others', label: 'Invite Others' },
    { key: 'can_view_reports', label: 'View Reports' },
    { key: 'can_comment', label: 'Add Comments' }
  ],
  assessment: [
    { key: 'can_edit_assessment_details', label: 'Edit Assessment Details' },
    { key: 'can_delete_assessment', label: 'Delete Assessment' },
    { key: 'can_change_due_date', label: 'Change Due Date' },
    { key: 'can_modify_instructions', label: 'Modify Instructions' }
  ],
  evaluation: [
    { key: 'can_evaluate_all_sections', label: 'Evaluate All Sections' },
    { key: 'can_override_evaluations', label: 'Override Evaluations' },
    { key: 'can_lock_evaluations', label: 'Lock Evaluations' },
    { key: 'can_view_other_evaluations', label: 'View Other Evaluations' },
    { key: 'can_export_evaluations', label: 'Export Evaluations' }
  ],
  collaboration: [
    { key: 'can_remove_collaborators', label: 'Remove Collaborators' },
    { key: 'can_change_collaborator_roles', label: 'Change Collaborator Roles' },
    { key: 'can_moderate_comments', label: 'Moderate Comments' },
    { key: 'can_delete_comments', label: 'Delete Comments' },
    { key: 'can_pin_comments', label: 'Pin Comments' }
  ],
  reporting: [
    { key: 'can_generate_reports', label: 'Generate Reports' },
    { key: 'can_view_detailed_analytics', label: 'View Detailed Analytics' },
    { key: 'can_export_reports', label: 'Export Reports' },
    { key: 'can_share_reports_externally', label: 'Share Reports Externally' }
  ],
  administrative: [
    { key: 'can_archive_assessment', label: 'Archive Assessment' },
    { key: 'can_duplicate_assessment', label: 'Duplicate Assessment' },
    { key: 'can_create_templates_from_assessment', label: 'Create Templates' }
  ],
  realtime: [
    { key: 'can_see_live_collaboration', label: 'See Live Collaboration' },
    { key: 'can_send_notifications', label: 'Send Notifications' },
    { key: 'can_broadcast_messages', label: 'Broadcast Messages' }
  ]
};

export const CollaboratorRoleSelector: React.FC<CollaboratorRoleSelectorProps> = ({
  currentRole,
  currentPermissions,
  onRoleChange,
  disabled
}) => {
  const [open, setOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<CollaboratorRole>(currentRole);
  const [customPermissions, setCustomPermissions] = useState<CollaboratorPermissions>(currentPermissions);
  const [useCustomPermissions, setUseCustomPermissions] = useState(
    JSON.stringify(currentPermissions) !== JSON.stringify(rolePermissions[currentRole])
  );

  const handleRoleChange = (newRole: CollaboratorRole) => {
    setSelectedRole(newRole);
    if (!useCustomPermissions) {
      setCustomPermissions(rolePermissions[newRole]);
    }
  };

  const handlePermissionChange = (permission: keyof CollaboratorPermissions, value: boolean) => {
    setCustomPermissions(prev => ({
      ...prev,
      [permission]: value
    }));
  };

  const handleSave = () => {
    onRoleChange(selectedRole, customPermissions);
    setOpen(false);
  };

  const handleCancel = () => {
    setSelectedRole(currentRole);
    setCustomPermissions(currentPermissions);
    setUseCustomPermissions(
      JSON.stringify(currentPermissions) !== JSON.stringify(rolePermissions[currentRole])
    );
    setOpen(false);
  };

  const renderPermissionCategory = (categoryName: string, permissions: Array<{key: string, label: string}>) => (
    <div className="space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        {categoryName}
      </h4>
      <div className="space-y-2">
        {permissions.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-2">
            <Checkbox
              id={key}
              checked={customPermissions[key as keyof CollaboratorPermissions] as boolean}
              onCheckedChange={(checked) => 
                handlePermissionChange(key as keyof CollaboratorPermissions, !!checked)
              }
              disabled={!useCustomPermissions}
            />
            <Label htmlFor={key} className="text-sm">
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Update Role & Permissions</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={selectedRole} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="evaluator">Evaluator</SelectItem>
                <SelectItem value="mentor">Mentor</SelectItem>
                <SelectItem value="trainer">Trainer</SelectItem>
                <SelectItem value='employer_admin'>Employer</SelectItem>
                <SelectItem value="viewer">Viewer</SelectItem>
                <SelectItem value="owner">Owner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="custom-permissions"
              checked={useCustomPermissions}
              onCheckedChange={(checked) => {
                setUseCustomPermissions(!!checked);
                if (!checked) {
                  setCustomPermissions(rolePermissions[selectedRole]);
                }
              }}
            />
            <Label htmlFor="custom-permissions">Customize permissions</Label>
          </div>

          {useCustomPermissions && (
            <Tabs defaultValue="core" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="core">Core</TabsTrigger>
                <TabsTrigger value="evaluation">Evaluation</TabsTrigger>
                <TabsTrigger value="collaboration">Collaboration</TabsTrigger>
                <TabsTrigger value="advanced">Advanced</TabsTrigger>
              </TabsList>
              
              <TabsContent value="core" className="space-y-4 mt-4">
                {renderPermissionCategory('Core Permissions', permissionCategories.core)}
                <Separator />
                {renderPermissionCategory('Assessment Management', permissionCategories.assessment)}
              </TabsContent>
              
              <TabsContent value="evaluation" className="space-y-4 mt-4">
                {renderPermissionCategory('Evaluation Permissions', permissionCategories.evaluation)}
              </TabsContent>
              
              <TabsContent value="collaboration" className="space-y-4 mt-4">
                {renderPermissionCategory('Collaboration Management', permissionCategories.collaboration)}
                <Separator />
                {renderPermissionCategory('Real-time Features', permissionCategories.realtime)}
              </TabsContent>
              
              <TabsContent value="advanced" className="space-y-4 mt-4">
                {renderPermissionCategory('Reporting & Analytics', permissionCategories.reporting)}
                <Separator />
                {renderPermissionCategory('Administrative', permissionCategories.administrative)}
              </TabsContent>
            </Tabs>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Update
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
