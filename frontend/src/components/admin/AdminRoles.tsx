
import React, { useState, useEffect } from 'react';
import {
    Shield, Plus, Search, Edit2, Trash2, Check, X,
    ChevronDown, ChevronRight, Lock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { restClient } from '@/utils/api';

interface Role {
    id: number;
    name: string;
    display_name: string;
    description: string;
    permissions: string[];
    is_system_role: boolean;
    user_count: number;
}

const AVAILABLE_PERMISSIONS = {
    'Users': ['users.view', 'users.create', 'users.edit', 'users.delete'],
    'Roles': ['roles.view', 'roles.create', 'roles.edit', 'roles.delete'],
    'Content': ['content.view', 'content.create', 'content.edit', 'content.delete', 'content.publish'],
    'System': ['system.view_logs', 'system.view_health', 'system.manage_settings']
};

const AdminRoles = () => {
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<Role | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        display_name: '',
        description: '',
        permissions: [] as string[]
    });

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const response = await restClient.get('/api/admin/roles');
            if (response.data.status === 'success') {
                setRoles(response.data.data);
            }
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (role: Role) => {
        setEditingRole(role);
        setFormData({
            name: role.name,
            display_name: role.display_name,
            description: role.description || '',
            permissions: role.permissions || []
        });
        setIsDialogOpen(true);
    };

    const handleCreate = () => {
        setEditingRole(null);
        setFormData({
            name: '',
            display_name: '',
            description: '',
            permissions: []
        });
        setIsDialogOpen(true);
    };

    const handleSubmit = async () => {
        try {
            if (editingRole) {
                await restClient.put(`/api/admin/roles/${editingRole.id}`, formData);
            } else {
                await restClient.post('/api/admin/roles', formData);
            }
            setIsDialogOpen(false);
            fetchRoles();
        } catch (error) {
            console.error('Failed to save role:', error);
            alert('Failed to save role');
        }
    };

    const handleDelete = async (roleId: number) => {
        if (!window.confirm('Are you sure you want to delete this role?')) return;
        try {
            await restClient.delete(`/api/admin/roles/${roleId}`);
            fetchRoles();
        } catch (error) {
            console.error('Failed to delete role:', error);
            alert('Failed to delete role');
        }
    };

    const togglePermission = (perm: string) => {
        setFormData(prev => {
            const perms = prev.permissions.includes(perm)
                ? prev.permissions.filter(p => p !== perm)
                : [...prev.permissions, perm];
            return { ...prev, permissions: perms };
        });
    };

    const filteredRoles = roles.filter(role =>
        role.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        role.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Roles & Permissions</h2>
                    <p className="text-muted-foreground">Manage system roles and access control.</p>
                </div>
                <Button onClick={handleCreate}>
                    <Plus className="mr-2 h-4 w-4" /> Create Role
                </Button>
            </div>

            <div className="flex items-center space-x-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search roles..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-sm"
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredRoles.map(role => (
                    <Card key={role.id} className="relative overflow-hidden">
                        {role.is_system_role && (
                            <div className="absolute top-2 right-2">
                                <Badge variant="secondary" className="flex items-center gap-1">
                                    <Lock className="h-3 w-3" /> System
                                </Badge>
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                {role.display_name}
                            </CardTitle>
                            <CardDescription>{role.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Users Assigned:</span>
                                    <Badge variant="outline">{role.user_count}</Badge>
                                </div>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">Permissions:</span>
                                    <Badge variant="outline">{role.permissions.length}</Badge>
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button variant="outline" className="flex-1" onClick={() => handleEdit(role)}>
                                        <Edit2 className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    {!role.is_system_role && (
                                        <Button variant="ghost" className="text-destructive hover:text-destructive" onClick={() => handleDelete(role.id)}>
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingRole ? 'Edit Role' : 'Create Role'}</DialogTitle>
                        <DialogDescription>
                            Configure role details and permissions.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Role Name (ID)</Label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    disabled={!!editingRole} // Cannot change ID of existing role
                                    placeholder="e.g. junior_hr"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Display Name</Label>
                                <Input
                                    value={formData.display_name}
                                    onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                                    placeholder="e.g. Junior HR"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Description</Label>
                            <Input
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-4 border rounded-md p-4">
                            <Label>Permissions</Label>
                            <div className="grid grid-cols-2 gap-4">
                                {Object.entries(AVAILABLE_PERMISSIONS).map(([category, perms]) => (
                                    <div key={category} className="space-y-2">
                                        <h4 className="font-medium text-sm text-muted-foreground">{category}</h4>
                                        {perms.map(perm => (
                                            <div key={perm} className="flex items-center space-x-2">
                                                <Checkbox
                                                    id={perm}
                                                    checked={formData.permissions.includes(perm) || formData.permissions.includes('*')}
                                                    onCheckedChange={() => togglePermission(perm)}
                                                    disabled={formData.permissions.includes('*')}
                                                />
                                                <label
                                                    htmlFor={perm}
                                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {perm}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSubmit}>Save Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminRoles;
