import React, { useEffect, useState } from 'react';
import { getDisplayName } from '@/utils/nameUtils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { restClient } from '@/utils/api';
import { Loader2, CheckCircle, XCircle, Clock } from 'lucide-react';
import HybridGovernmentNav from '@/components/layout/HybridGovernmentNav';

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
}

const RoleRequestsPage: React.FC = () => {
    const { toast } = useToast();
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
        <div className="min-h-screen bg-gray-50">
            <HybridGovernmentNav currentPage="admin" userRole="admin" />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Role Access Requests</h1>
                    <Button onClick={fetchRequests} variant="outline" size="sm">
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
                                                {getDisplayName(req)}
                                            </h3>
                                            <p className="text-sm text-gray-600">{req.email}</p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                className="border-red-200 text-red-600 hover:bg-red-50"
                                                onClick={() => handleAction(req.id, 'reject')}
                                                disabled={!!processingId}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-2" />}
                                                Reject
                                            </Button>
                                            <Button
                                                className="bg-green-600 hover:bg-green-700"
                                                onClick={() => handleAction(req.id, 'approve')}
                                                disabled={!!processingId}
                                            >
                                                {processingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                                                Approve Access
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RoleRequestsPage;
