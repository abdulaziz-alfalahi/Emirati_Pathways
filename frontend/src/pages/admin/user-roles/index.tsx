

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/types/auth';
import Layout from '@/components/layout/Layout';
import { Users, Search, Shield, Plus, Minus, Loader2 } from 'lucide-react';
import { UserCard } from '@/components/admin/UserCard';
import { sanitizeText, USER_ROLES } from '@/utils/validation';

interface SupabaseUser {
  id: string;
  email: string;
  user_metadata: any;
  created_at: string;
}

interface UserWithRoles extends SupabaseUser {
  roles: UserRole[];
}

const UserRolesAdminPage: React.FC = React.memo(() => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [processingUserId, setProcessingUserId] = useState<string | null>(null);

  // Use the USER_ROLES from validation utility to ensure consistency
  const allRoles: UserRole[] = useMemo(() => [...USER_ROLES], []);

  // Check if user has admin permissions
  const isAuthorized = useMemo(() => 
    hasRole('administrator') || hasRole('super_user'), 
    [hasRole]
  );

  const filteredUsers = useMemo(() => {
    return users.filter(user => {
      const sanitizedSearchTerm = sanitizeText(searchTerm);
      const matchesSearch = user.email.toLowerCase().includes(sanitizedSearchTerm.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.roles.includes(roleFilter as UserRole);
      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  useEffect(() => {
    if (!user) return;
    
    if (!isAuthorized) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive"
      });
      return;
    }

    fetchUsers();
  }, [user, isAuthorized]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all users from the edge function
      const { data: usersData, error: usersError } = await supabase.functions.invoke('get-all-users');
      
      if (usersError) {
        throw usersError;
      }

      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) {
        throw rolesError;
      }

      // Combine users with their roles
      const usersWithRoles: UserWithRoles[] = usersData.map((user: SupabaseUser) => ({
        ...user,
        roles: rolesData?.filter(role => role.user_id === user.id).map(role => role.role as UserRole) || []
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error",
        description: "Failed to fetch users. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const assignRole = useCallback(async (userId: string, role: UserRole) => {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      toast({
        title: "Error",
        description: "Invalid user ID.",
        variant: "destructive"
      });
      return;
    }

    if (!role || typeof role !== 'string') {
      toast({
        title: "Error",
        description: "Invalid role specified.",
        variant: "destructive"
      });
      return;
    }

    // Check if role is valid
    if (!USER_ROLES.includes(role)) {
      toast({
        title: "Error",
        description: "Invalid role specified.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingUserId(userId);

      const { error } = await supabase.functions.invoke('assign-user-role', {
        body: { userId, role }
      });

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, roles: [...user.roles, role] }
          : user
      ));

      toast({
        title: "Success",
        description: `Role "${role}" assigned successfully.`
      });
    } catch (error) {
      console.error('Error assigning role:', error);
      toast({
        title: "Error",
        description: "Failed to assign role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingUserId(null);
    }
  }, [toast]);

  const removeRole = useCallback(async (userId: string, role: UserRole) => {
    // Validate input
    if (!userId || typeof userId !== 'string') {
      toast({
        title: "Error",
        description: "Invalid user ID.",
        variant: "destructive"
      });
      return;
    }

    if (!role || typeof role !== 'string') {
      toast({
        title: "Error",
        description: "Invalid role specified.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessingUserId(userId);

      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', role);

      if (error) {
        throw error;
      }

      // Update local state
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, roles: user.roles.filter(r => r !== role) }
          : user
      ));

      toast({
        title: "Success",
        description: `Role "${role}" removed successfully.`
      });
    } catch (error) {
      console.error('Error removing role:', error);
      toast({
        title: "Error",
        description: "Failed to remove role. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessingUserId(null);
    }
  }, [toast]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitizedValue = sanitizeText(e.target.value);
    setSearchTerm(sanitizedValue);
  }, []);

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <p>Please sign in to access this page.</p>
        </div>
      </Layout>
    );
  }

  if (!isAuthorized) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to access the user role management panel.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">User Role Management</h1>
            <p className="text-muted-foreground">Manage user roles and permissions across the platform</p>
          </div>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {filteredUsers.length} Users
          </Badge>
        </div>

        <div className="flex gap-4 items-center">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by email..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-10"
              maxLength={100}
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {allRoles.map(role => (
                <SelectItem key={role} value={role}>
                  {role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex items-center justify-center min-h-64">
            <div className="flex items-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>Loading users...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredUsers.map(user => (
              <UserCard
                key={user.id}
                user={user}
                allRoles={allRoles}
                processingUserId={processingUserId}
                onAssignRole={assignRole}
                onRemoveRole={removeRole}
              />
            ))}
            
            {filteredUsers.length === 0 && !loading && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Users Found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm || roleFilter !== 'all' 
                      ? 'Try adjusting your search or filter criteria.' 
                      : 'No users are currently registered in the system.'
                    }
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
});

UserRolesAdminPage.displayName = 'UserRolesAdminPage';

export default UserRolesAdminPage;

