import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { restClient } from '@/utils/api';
import { Loader2, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface RoleRequest {
    id: string;
    user_id: string;
    requested_role: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    first_name: string;
    last_name: string;
    email: string;
    admin_notes?: string;
    documents?: Record<string, string>;
}

const AdminRoleRequests: React.FC = () => {
    const { toast } = useToast();
    const navigate = useNavigate();
    const [requests, setRequests] = useState<RoleRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingId, setProcessingId] = useState<string | null>(null);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const { data } = await restClient.get('/api/roles/admin/requests');
            if (data.success) {
                setRequests(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch requests', error);
            toast({
                title: "Error",
                description: "Failed to load role requests.",
                variant: "destructive"
            });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const handleAction = async (requestId: string, action: 'approve' | 'reject') => {
        setProcessingId(requestId);
        try {
            await restClient.put(`/api/roles/admin/request/${requestId}/action`, {
                action,
                notes: action === 'approve' ? 'Approved by Admin' : 'Rejected'
            });

            toast({
                title: "Success",
                description: `Request ${action}d successfully.`,
                variant: "default"
            });

            // Remove from list or refresh
            setRequests(prev => prev.filter(r => r.id !== requestId));

        } catch (error: any) {
            console.error('Action failed', error);
            toast({
                title: "Action Failed",
                description: error.response?.data?.message || "Could not process request.",
                variant: "destructive"
            });
        } finally {
            setProcessingId(null);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Role Access Requests</h2>
                    <p className="text-sm text-muted-foreground">Manage user requests for additional persona access.</p>
                </div>
                <Button onClick={fetchRequests} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {isLoading ? (
                <div className="flex justify-center p-12">
                    <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                </div>
            ) : requests.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center text-gray-500">
                        <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-500" />
                        <p className="text-lg font-medium">All caught up!</p>
                        <p>No pending role requests found.</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4">
                    {requests.map(req => (
                        <Card key={req.id}>
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row justify-between gap-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                                {req.requested_role}
                                            </Badge>
                                            <span className="text-xs text-gray-500 flex items-center">
                                                <Clock className="h-3 w-3 mr-1" />
                                                {new Date(req.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-semibold">
                                            {req.first_name} {req.last_name}
                                        </h3>
                                        <p className="text-sm text-gray-600 mb-3">{req.email}</p>

                                        {/* Structured Details */}
                                        <div className="bg-slate-50 p-3 rounded-md border text-sm mt-2">
                                            <h4 className="font-semibold text-xs text-slate-500 uppercase mb-1">Request Details</h4>
                                            {req.admin_notes ? (
                                                <div className="whitespace-pre-wrap font-mono text-xs text-slate-700">
                                                    {req.admin_notes}
                                                </div>
                                            ) : (
                                                <span className="text-gray-400 italic">No details provided.</span>
                                            )}
                                        </div>

                                        {/* Documents */}
                                        {req.documents && Object.keys(req.documents).length > 0 && (
                                            <div className="mt-3">
                                                <h4 className="font-semibold text-xs text-slate-500 uppercase mb-1">Attachments</h4>
                                                <div className="flex gap-2">
                                                    {Object.entries(req.documents).map(([key, val]) => (
                                                        <Badge key={key} variant="secondary" className="flex items-center gap-1 cursor-pointer hover:bg-slate-200">
                                                            <CheckCircle className="h-3 w-3" />
                                                            {key}: {String(val)}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                const fullName = `${req.first_name} ${req.last_name}`;
                                                navigate(`/messages?userId=${req.user_id}&userName=${encodeURIComponent(fullName)}`);
                                            }}
                                            className="w-full"
                                        >
                                            <RefreshCw className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                        <div className="border-t my-1"></div>
                                        <Button
                                            className="bg-green-600 hover:bg-green-700 w-full"
                                            onClick={() => handleAction(req.id, 'approve')}
                                            disabled={!!processingId}
                                        >
                                            {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                            Approve
                                        </Button>
                                        <Button
                                            variant="outline"
                                            className="border-red-200 text-red-600 hover:bg-red-50 w-full"
                                            onClick={() => handleAction(req.id, 'reject')}
                                            disabled={!!processingId}
                                        >
                                            <XCircle className="h-4 w-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
};

export default AdminRoleRequests;
