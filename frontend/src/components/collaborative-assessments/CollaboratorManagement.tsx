
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CollaboratorsList } from './collaborators/CollaboratorsList';
import { CollaboratorInviteDialog } from './collaborators/CollaboratorInviteDialog';
import { Users, UserPlus, Shield, CheckCircle, XCircle } from 'lucide-react';

interface CollaboratorManagementProps {
  assessmentId: string;
}

export const CollaboratorManagement: React.FC<CollaboratorManagementProps> = ({
  assessmentId
}) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Collaborator Management</h2>
        </div>
        <CollaboratorInviteDialog 
          assessmentId={assessmentId}
          trigger={
            <button className="flex items-center space-x-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              <UserPlus className="h-4 w-4" />
              <span>Invite Collaborator</span>
            </button>
          }
        />
      </div>

      <Tabs defaultValue="collaborators" className="w-full">
        <TabsList>
          <TabsTrigger value="collaborators">Current Collaborators</TabsTrigger>
          <TabsTrigger value="permissions">Role Permissions</TabsTrigger>
          <TabsTrigger value="matrix">Permission Matrix</TabsTrigger>
        </TabsList>
        
        <TabsContent value="collaborators">
          <CollaboratorsList assessmentId={assessmentId} />
        </TabsContent>
        
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Role Permissions Overview</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <RolePermissionCard
                    role="Owner"
                    description="Full control over the assessment"
                    permissions={[
                      'Edit assessment',
                      'Evaluate candidates',
                      'Invite collaborators',
                      'View reports',
                      'Add comments',
                      'Delete assessment',
                      'Archive assessment',
                      'Override evaluations',
                      'Manage all collaborators'
                    ]}
                    color="bg-purple-50 border-purple-200"
                  />
                  
                  <RolePermissionCard
                    role="Trainer"
                    description="Can edit and evaluate with advanced features"
                    permissions={[
                      'Edit assessment details',
                      'Evaluate candidates',
                      'View reports',
                      'Add comments',
                      'Lock evaluations',
                      'Override evaluations',
                      'Generate reports',
                      'Moderate comments'
                    ]}
                    color="bg-blue-50 border-blue-200"
                  />
                  
                  <RolePermissionCard
                    role="Mentor"
                    description="Evaluate and guide candidates"
                    permissions={[
                      'Evaluate candidates',
                      'View reports',
                      'Add comments',
                      'View other evaluations',
                      'Export evaluations',
                      'Generate reports'
                    ]}
                    color="bg-green-50 border-green-200"
                  />
                  
                  <RolePermissionCard
                    role="Employer"
                    description="Assess potential employees"
                    permissions={[
                      'Evaluate candidates',
                      'View reports',
                      'Add comments',
                      'View other evaluations',
                      'Export reports',
                      'Share reports externally'
                    ]}
                    color="bg-orange-50 border-orange-200"
                  />
                  
                  <RolePermissionCard
                    role="Evaluator"
                    description="Focused evaluation role"
                    permissions={[
                      'Evaluate candidates',
                      'Add comments',
                      'See live collaboration'
                    ]}
                    color="bg-gray-50 border-gray-200"
                  />
                  
                  <RolePermissionCard
                    role="Viewer"
                    description="View-only access with commenting"
                    permissions={[
                      'View reports',
                      'Add comments',
                      'View other evaluations',
                      'See live collaboration'
                    ]}
                    color="bg-slate-50 border-slate-200"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matrix">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <PermissionMatrix />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

interface RolePermissionCardProps {
  role: string;
  description: string;
  permissions: string[];
  color: string;
}

const RolePermissionCard: React.FC<RolePermissionCardProps> = ({
  role,
  description,
  permissions,
  color
}) => {
  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <h3 className="font-semibold text-lg mb-1">{role}</h3>
      <p className="text-sm text-muted-foreground mb-3">{description}</p>
      <ul className="space-y-1">
        {permissions.map((permission, index) => (
          <li key={index} className="text-sm flex items-center space-x-1">
            <span className="w-1 h-1 bg-current rounded-full"></span>
            <span>{permission}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

const PermissionMatrix: React.FC = () => {
  const roles = ['Owner', 'Trainer', 'Mentor', 'Employer', 'Evaluator', 'Viewer'];
  const permissions = [
    { key: 'edit', label: 'Edit Assessment', matrix: [true, true, false, false, false, false] },
    { key: 'evaluate', label: 'Evaluate', matrix: [true, true, true, true, true, false] },
    { key: 'invite', label: 'Invite Others', matrix: [true, false, false, false, false, false] },
    { key: 'reports', label: 'View Reports', matrix: [true, true, true, true, false, true] },
    { key: 'delete', label: 'Delete Assessment', matrix: [true, false, false, false, false, false] },
    { key: 'override', label: 'Override Evaluations', matrix: [true, true, false, false, false, false] },
    { key: 'lock', label: 'Lock Evaluations', matrix: [true, true, false, false, false, false] },
    { key: 'moderate', label: 'Moderate Comments', matrix: [true, true, false, false, false, false] },
    { key: 'analytics', label: 'View Analytics', matrix: [true, true, true, false, false, false] },
    { key: 'export', label: 'Export Data', matrix: [true, true, true, true, false, false] },
    { key: 'archive', label: 'Archive Assessment', matrix: [true, false, false, false, false, false] },
    { key: 'broadcast', label: 'Broadcast Messages', matrix: [true, false, false, false, false, false] }
  ];

  return (
    <table className="min-w-full border-collapse">
      <thead>
        <tr>
          <th className="text-left p-3 border-b font-medium">Permission</th>
          {roles.map(role => (
            <th key={role} className="text-center p-3 border-b font-medium min-w-[80px]">
              {role}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {permissions.map(permission => (
          <tr key={permission.key} className="hover:bg-muted/50">
            <td className="p-3 border-b font-medium">{permission.label}</td>
            {permission.matrix.map((hasPermission, index) => (
              <td key={index} className="text-center p-3 border-b">
                {hasPermission ? (
                  <CheckCircle className="h-5 w-5 text-green-600 mx-auto" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-400 mx-auto" />
                )}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};
