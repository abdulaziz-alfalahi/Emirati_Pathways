import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { restClient } from '@/utils/api';
import {
  CheckCircle,
  XCircle,
  Clock,
  Briefcase,
  User,
  DollarSign,
  FileText,
  AlertTriangle,
  Shield
} from 'lucide-react';

interface ApprovalRequest {
  id: string;
  resource_type: string;
  resource_id: string;
  status: string;
  created_at: string;
  approver_id: number;
  requested_by: number;
  comment?: string;
  // Enriched fields from backend JOINs
  position_title?: string;
  candidate_name?: string;
  salary_info?: string;
  requested_by_name?: string;
  approver_name?: string;
}

export default function ApprovalsPage() {
  const [items, setItems] = useState<ApprovalRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [activeFilter, setActiveFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const { toast } = useToast();

  // Confirmation dialog state
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmItem, setConfirmItem] = useState<ApprovalRequest | null>(null);
  const [confirmComment, setConfirmComment] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    load();
  }, [activeFilter]);

  const load = async () => {
    try {
      setLoading(true);
      setError(null);
      const statusParam = activeFilter !== 'all' ? `&status=${activeFilter}` : '';
      const res = await restClient.get(`/api/hr/approvals/requests?limit=${pageSize}${statusParam}`);
      const json = res.data;
      setItems(json?.data?.requests || []);
      setTotal(json?.data?.total_count || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (item: ApprovalRequest, action: 'approve' | 'reject') => {
    setConfirmItem(item);
    setConfirmAction(action);
    setConfirmComment('');
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    if (!confirmItem || !confirmAction) return;
    try {
      setProcessing(true);
      await restClient.post(`/api/hr/approvals/requests/${confirmItem.id}/${confirmAction}`, {
        comment: confirmComment
      });
      toast({
        title: confirmAction === 'approve' ? 'Approved' : 'Rejected',
        description: `${getResourceLabel(confirmItem)} has been ${confirmAction === 'approve' ? 'approved' : 'rejected'}.`
      });
      setConfirmOpen(false);
      setConfirmItem(null);
      setConfirmAction(null);
      setConfirmComment('');
      await load();
    } catch (e: any) {
      toast({
        title: 'Error',
        description: `Failed to ${confirmAction}: ${e?.message || e}`,
        variant: 'destructive'
      });
    } finally {
      setProcessing(false);
    }
  };

  const getResourceLabel = (item: ApprovalRequest) => {
    if (item.resource_type === 'offer') return `Offer for ${item.position_title || 'Unknown Position'}`;
    if (item.resource_type === 'job_posting') return `Job Posting: ${item.position_title || 'Unknown'}`;
    return item.resource_type;
  };

  const getResourceIcon = (type: string) => {
    if (type === 'offer') return <DollarSign className="h-4 w-4 text-green-600" />;
    if (type === 'job_posting') return <Briefcase className="h-4 w-4 text-blue-600" />;
    return <FileText className="h-4 w-4 text-slate-500" />;
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { className: string; icon: React.ReactNode; label: string }> = {
      pending: { className: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      approved: { className: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle className="h-3 w-3" />, label: 'Approved' },
      rejected: { className: 'bg-red-100 text-red-800 border-red-200', icon: <XCircle className="h-3 w-3" />, label: 'Rejected' },
    };
    const c = config[status] || config.pending;
    return (
      <Badge variant="outline" className={`${c.className} flex items-center gap-1`}>
        {c.icon}
        {c.label}
      </Badge>
    );
  };

  const pendingCount = items.filter(i => i.status === 'pending').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-6 w-6 text-teal-600" />
            Approval Requests
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Review and approve offers and job postings from your team
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge className="bg-yellow-100 text-yellow-800 text-sm px-3 py-1">
            {pendingCount} pending
          </Badge>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
          <Button
            key={f}
            size="sm"
            variant={activeFilter === f ? 'default' : 'outline'}
            className={activeFilter === f ? 'bg-teal-600 hover:bg-teal-700' : ''}
            onClick={() => setActiveFilter(f)}
          >
            {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
          </Button>
        ))}
      </div>

      {loading && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <span className="text-red-700">{error}</span>
          </CardContent>
        </Card>
      )}

      {!loading && items.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Shield className="h-12 w-12 text-slate-200 mb-4" />
            <h3 className="text-lg font-semibold text-slate-600">No approval requests</h3>
            <p className="text-sm text-slate-500 mt-1">
              {activeFilter === 'pending'
                ? 'No pending approvals right now. You\'re all caught up!'
                : `No ${activeFilter === 'all' ? '' : activeFilter + ' '}requests found.`}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Approval Cards */}
      <div className="space-y-3">
        {items.map((r) => (
          <Card key={r.id} className={`hover:shadow-md transition-shadow ${r.status === 'pending' ? 'border-s-4 border-s-yellow-400' : ''}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Details */}
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getResourceIcon(r.resource_type)}
                    <span className="font-semibold text-lg">
                      {r.position_title || r.resource_type}
                    </span>
                    {getStatusBadge(r.status)}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    {r.candidate_name && (
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <User className="h-3.5 w-3.5" />
                        <span>{r.candidate_name}</span>
                      </div>
                    )}
                    {r.salary_info && (
                      <div className="flex items-center gap-1.5 text-green-700 font-medium">
                        <DollarSign className="h-3.5 w-3.5" />
                        <span>{r.salary_info} AED</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <User className="h-3.5 w-3.5" />
                      <span>By: {r.requested_by_name || `User #${r.requested_by}`}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '-'}</span>
                    </div>
                  </div>

                  {r.comment && (
                    <p className="text-sm text-slate-500 italic mt-1">"{r.comment}"</p>
                  )}
                </div>

                {/* Right: Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {r.status === 'pending' && (
                    <>
                      <Button
                        size="sm"
                        className="bg-teal-600 hover:bg-teal-700 text-white"
                        onClick={() => handleActionClick(r, 'approve')}
                      >
                        <CheckCircle className="h-4 w-4 me-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        onClick={() => handleActionClick(r, 'reject')}
                      >
                        <XCircle className="h-4 w-4 me-1" />
                        Reject
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {items.length > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <span>Rows:</span>
            <select className="p-1 border rounded" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); load(); }}>
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { if (page > 1) { setPage(page - 1); load(); } }} disabled={page === 1}>Prev</Button>
            <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
            <Button variant="outline" size="sm" onClick={() => { if (page * pageSize < total) { setPage(page + 1); load(); } }} disabled={page * pageSize >= total}>Next</Button>
          </div>
        </div>
      )}

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmAction === 'approve' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              {confirmAction === 'approve' ? 'Approve Request' : 'Reject Request'}
            </DialogTitle>
            <DialogDescription>
              {confirmItem && (
                <>
                  You are about to <strong>{confirmAction}</strong> the request for{' '}
                  <strong>{getResourceLabel(confirmItem)}</strong>
                  {confirmItem.candidate_name && (
                    <> (Candidate: <strong>{confirmItem.candidate_name}</strong>)</>
                  )}.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label htmlFor="comment">
                {confirmAction === 'approve' ? 'Comments (Optional)' : 'Reason for Rejection'}
              </Label>
              <Textarea
                id="comment"
                placeholder={confirmAction === 'approve'
                  ? 'Any notes for the recruiter...'
                  : 'Please provide a reason for rejection...'}
                value={confirmComment}
                onChange={(e) => setConfirmComment(e.target.value)}
                className="mt-2"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button
              onClick={handleConfirm}
              disabled={processing || (confirmAction === 'reject' && !confirmComment.trim())}
              className={confirmAction === 'approve' ? 'bg-teal-600 hover:bg-teal-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {processing && <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white me-2" />}
              {confirmAction === 'approve' ? 'Confirm Approve' : 'Confirm Reject'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
