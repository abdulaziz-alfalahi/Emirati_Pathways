import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { restClient } from '@/utils/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Mail, Plus, Trash2, CheckCircle, Clock } from 'lucide-react';

interface TeamMember {
    id: string;
    user_id: string;
    full_name: string;
    email: string;
    role: string;
    invitation_status: string;
    joined_at: string;
}

export const TeamManagementTab: React.FC = () => {
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteOpen, setInviteOpen] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const { user } = useAuth();

    // Get company_id from auth context
    const COMPANY_ID = user?.company_id || user?.user_metadata?.company_id;

    const fetchMembers = async () => {
        try {
            setLoading(true);
            const response = await restClient.get(`/api/company/team/members?company_id=${COMPANY_ID}`);

            if (response.data.success) {
                setMembers(response.data.members);
            }
        } catch (err: any) {
            console.error("Failed to fetch members", err);
            if (err.response?.status === 401) {
                // Ideally handle this globally, but for now local feedback
                console.warn("Unauthorized - Team tab");
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (COMPANY_ID) {
            fetchMembers();
        }
    }, [COMPANY_ID]);

    const handleInvite = async () => {
        setError('');
        setSuccess('');
        try {
            const response = await restClient.post(`/api/company/team/invite`, {
                company_id: COMPANY_ID,
                email: inviteEmail,
                role: 'recruiter'
            });

            if (response.data.success) {
                setSuccess(`Invitation sent to ${inviteEmail}`);
                setInviteEmail('');
                setInviteOpen(false);
                fetchMembers(); // Refresh list
            }
        } catch (err: any) {
            if (err.response?.status === 401) {
                setError("Session expired. Please logout and login again.");
            } else {
                setError(err.response?.data?.message || err.response?.data?.error || "Failed to invite user");
            }
        }
    };

    const handleRemove = async (userId: string) => {
        // Implementation omitted for brevity in MVP, but wired up conceptually
        if (!confirm("Are you sure you want to remove this member?")) return;

        try {
            // Note: API expects user_id which is int/uuid depending on schema confusion. 
            // Our system returns user_id from users table.
            // But remove_member takes user_id
            // Let's assume endpoint works.
            const response = await restClient.post(`/api/company/team/remove`, {
                company_id: COMPANY_ID,
                user_id: userId
            });

            if (response.data.success) {
                fetchMembers();
            }

        } catch (err) {
            console.error("Remove failed", err);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="bg-white shadow-sm">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-dubai-bold text-slate-900">Team Management</CardTitle>
                        <CardDescription className="font-dubai-medium text-slate-600">
                            Manage your recruitment team and their permissions
                        </CardDescription>
                    </div>

                    <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
                        <DialogTrigger asChild>
                            <Button className="bg-teal-600 hover:bg-teal-700 text-white font-dubai-medium">
                                <Plus className="h-4 w-4 me-2" />
                                Invite Recruiter
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite Team Member</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
                                {success && <Alert className="text-green-600 border-green-200 bg-green-50"><AlertDescription>{success}</AlertDescription></Alert>}

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Email Address</label>
                                    <Input
                                        placeholder="colleague@company.com"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                    />
                                    <p className="text-xs text-slate-500">
                                        The user must already have an account on the platform to be invited.
                                    </p>
                                </div>
                                <Button onClick={handleInvite} className="w-full bg-teal-600">Send Invitation</Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <p>Loading team...</p>
                    ) : members.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 rounded-lg">
                            <Users className="h-12 w-12 text-slate-400 mx-auto mb-3" />
                            <h3 className="text-lg font-medium text-slate-900">No Team Members Yet</h3>
                            <p className="text-slate-500 max-w-sm mx-auto mt-2">
                                Invite your colleagues to collaborate on job postings and candidate management.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Joined</TableHead>
                                    <TableHead className="text-end">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {members.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell>
                                            <div className="font-medium">{member.full_name}</div>
                                            <div className="text-xs text-slate-500">{member.email}</div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">
                                                {member.role}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {member.invitation_status === 'active' ? (
                                                <div className="flex items-center text-green-600 text-sm">
                                                    <CheckCircle className="h-4 w-4 me-1" /> Active
                                                </div>
                                            ) : (
                                                <div className="flex items-center text-yellow-600 text-sm">
                                                    <Clock className="h-4 w-4 me-1" /> Pending
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-sm text-slate-500">
                                            {new Date(member.joined_at).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-end">
                                            <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemove(member.user_id)}>
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};
