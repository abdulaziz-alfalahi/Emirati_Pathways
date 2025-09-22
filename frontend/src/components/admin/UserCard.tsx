
import React, { useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserRole } from '@/types/auth';
import { Plus, Minus, Loader2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  user_metadata: any;
  created_at: string;
  roles: UserRole[];
}

interface UserCardProps {
  user: User;
  allRoles: UserRole[];
  processingUserId: string | null;
  onAssignRole: (userId: string, role: UserRole) => void;
  onRemoveRole: (userId: string, role: UserRole) => void;
}

const UserCard: React.FC<UserCardProps> = React.memo(({
  user,
  allRoles,
  processingUserId,
  onAssignRole,
  onRemoveRole
}) => {
  const availableRoles = useMemo(() => 
    allRoles.filter(role => !user.roles.includes(role)),
    [allRoles, user.roles]
  );

  const handleAssignRole = useCallback((value: string) => {
    // Ensure the value is a valid UserRole by checking against allRoles
    const selectedRole = allRoles.find(role => role === value) as UserRole;
    if (selectedRole) {
      onAssignRole(user.id, selectedRole);
    } else {
      console.error('Invalid role selected:', value);
    }
  }, [onAssignRole, user.id, allRoles]);

  const handleRemoveRole = useCallback((role: UserRole) => {
    onRemoveRole(user.id, role);
  }, [onRemoveRole, user.id]);

  const isProcessing = processingUserId === user.id;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg">{user.email}</CardTitle>
            <CardDescription>
              User ID: {user.id} • Created: {new Date(user.created_at).toLocaleDateString()}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-1">
            {user.roles.map(role => (
              <RoleBadge
                key={role}
                role={role}
                onRemove={handleRemoveRole}
                disabled={isProcessing}
              />
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Add role:</span>
          <Select
            onValueChange={handleAssignRole}
            disabled={isProcessing}
            value=""
          >
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select a role to add" />
            </SelectTrigger>
            <SelectContent>
              {availableRoles.map(role => (
                <SelectItem key={role} value={role}>
                  <div className="flex items-center gap-2">
                    <Plus className="h-3 w-3" />
                    {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {isProcessing && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
        </div>
      </CardContent>
    </Card>
  );
});

UserCard.displayName = 'UserCard';

interface RoleBadgeProps {
  role: UserRole;
  onRemove: (role: UserRole) => void;
  disabled: boolean;
}

const RoleBadge: React.FC<RoleBadgeProps> = React.memo(({ role, onRemove, disabled }) => {
  const handleRemove = useCallback(() => {
    onRemove(role);
  }, [onRemove, role]);

  return (
    <Badge variant="outline" className="flex items-center gap-1">
      {role.replace(/_/g, ' ')}
      <Button
        size="sm"
        variant="ghost"
        className="h-4 w-4 p-0 hover:bg-destructive hover:text-destructive-foreground"
        onClick={handleRemove}
        disabled={disabled}
      >
        <Minus className="h-3 w-3" />
      </Button>
    </Badge>
  );
});

RoleBadge.displayName = 'RoleBadge';

export { UserCard };
