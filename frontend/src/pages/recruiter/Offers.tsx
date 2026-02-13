import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, Link as LinkIcon, Clock, CheckCircle, XCircle, AlertTriangle, X, User, Briefcase, DollarSign, Calendar, Gift } from 'lucide-react';
import { restClient } from '@/utils/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface ApprovalStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'created' | 'job' | 'candidate' | 'status'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [approvalStats, setApprovalStats] = useState<ApprovalStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [activeTab, setActiveTab] = useState('all');
  const [selectedOfferDetails, setSelectedOfferDetails] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Get user data from localStorage for data isolation
  const getUserData = () => {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : {};
    } catch {
      return {};
    }
  };
  const userData = getUserData();
  const recruiterId = userData.id || '';
  const companyId = userData.company_id || '';

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);

      // CRITICAL: Block data loading when company_id is missing to prevent data leakage
      if (!companyId) {
        console.warn('No company_id found - skipping offers fetch to prevent data leakage');
        setOffers([]);
        setTotal(0);
        setLoading(false);
        return;
      }

      // Build company_id parameter for data isolation
      const companyParam = `?company_id=${companyId}`;

      // Try the recruiter offers endpoint first (queries both offers and job_offers tables)
      try {
        const res = await restClient.get(`/api/recruiter/offers/approvals/all${companyParam}`);
        if (res.data?.success && res.data?.data?.length > 0) {
          // Transform approval data to offer format
          const transformedOffers = res.data.data.map((item: any) => ({
            id: item.offer_id || item.id,
            job_posting_id: item.job_posting_id,
            candidate_id: item.candidate_id,
            status: item.status,
            created_at: item.created_at || item.request_date,
            job_title: item.position || item.job_title,
            candidate_first_name: item.candidate_name?.split(' ')[0] || '',
            candidate_last_name: item.candidate_name?.split(' ').slice(1).join(' ') || '',
            offer_data: item.offer_data || {
              salary: item.salary,
              benefits: item.benefits
            }
          }));
          setOffers(transformedOffers);
          setTotal(transformedOffers.length);
          return;
        }
      } catch (e) {
        console.log('Recruiter approvals endpoint failed, trying HR offers endpoint');
      }

      // Fallback to HR offers endpoint (also needs company filter)
      const res = await restClient.get(`/api/hr/offers/?limit=${pageSize}&offset=${(page - 1) * pageSize}&company_id=${companyId}`);
      const json = res.data;
      setOffers(json?.data?.offers || []);
      setTotal(json?.data?.total_count || 0);
    } catch (e: any) {
      console.error('Failed to load offers:', e);
      // Don't show error if we just have no offers
      setOffers([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const loadApprovalStats = async () => {
    try {
      const res = await restClient.get('/api/recruiter/offers/approval-stats');
      if (res.data?.success) {
        setApprovalStats(res.data.data);
      }
    } catch (e) {
      console.error('Failed to load approval stats:', e);
    }
  };

  useEffect(() => {
    loadOffers();
    loadApprovalStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOffer = async (offerId: string) => {
    try {
      // First check if offer is approved
      const offer = offers.find(o => o.id === offerId);
      if (offer?.status === 'pending_approval') {
        toast({
          title: 'Cannot send offer',
          description: 'This offer is pending HR Manager approval. Please wait for approval before sending.',
          variant: 'destructive'
        });
        return;
      }

      if (offer?.status !== 'approved' && offer?.status !== 'draft') {
        toast({
          title: 'Cannot send offer',
          description: `Offer status is "${offer?.status}". Only approved offers can be sent to candidates.`,
          variant: 'destructive'
        });
        return;
      }

      const res = await restClient.post(`/api/hr/offers/${offerId}/send`, { expires_in_days: 7 });
      const json = res.data;
      const signUrl = json?.data?.sign_url;

      if (signUrl && navigator.clipboard) {
        await navigator.clipboard.writeText(signUrl);
        toast({ title: 'Offer sent', description: 'Sign URL copied to clipboard.' });
      } else if (signUrl) {
        toast({ title: 'Offer sent', description: signUrl });
      } else {
        toast({ title: 'Offer sent' });
      }
      await loadOffers();
    } catch (e: any) {
      toast({ title: 'Failed to send offer', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const copySignUrl = async (o: any) => {
    try {
      if (!o.signature_token) {
        toast({ title: 'No signature token', description: 'Send the offer first.', variant: 'destructive' });
        return;
      }
      const signUrl = `${window.location.origin}/api/offers/${o.id}/accept?token=${o.signature_token}`;
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(signUrl);
        toast({ title: 'Copied', description: 'Sign URL copied to clipboard.' });
      } else {
        toast({ title: 'Copy this sign URL', description: signUrl });
      }
    } catch (e: any) {
      toast({ title: 'Failed to copy link', variant: 'destructive' });
    }
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { className: string; icon?: React.ReactNode }> = {
      draft: { className: 'bg-gray-100 text-gray-800 border-gray-200' },
      pending_approval: {
        className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        icon: <Clock className="h-3 w-3 mr-1" />
      },
      approved: {
        className: 'bg-green-100 text-green-800 border-green-200',
        icon: <CheckCircle className="h-3 w-3 mr-1" />
      },
      rejected: {
        className: 'bg-red-100 text-red-800 border-red-200',
        icon: <XCircle className="h-3 w-3 mr-1" />
      },
      sent: { className: 'bg-blue-100 text-blue-800 border-blue-200' },
      accepted: { className: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
      declined: { className: 'bg-red-100 text-red-800 border-red-200' },
    };
    const config = map[status] || { className: 'bg-slate-100 text-slate-800 border-slate-200' };
    const displayStatus = status === 'pending_approval' ? 'Pending Approval' : status;

    return (
      <Badge variant="outline" className={`${config.className} flex items-center`}>
        {config.icon}
        {displayStatus}
      </Badge>
    );
  };

  const sortedOffers = [...offers].sort((a, b) => {
    const dir = sortOrder === 'asc' ? 1 : -1;
    if (sortBy === 'created') {
      const da = new Date(a.created_at || 0).getTime();
      const db = new Date(b.created_at || 0).getTime();
      return (da - db) * dir;
    }
    if (sortBy === 'job') {
      return String(a.job_title || '').localeCompare(String(b.job_title || '')) * dir;
    }
    if (sortBy === 'candidate') {
      const na = `${a.candidate_first_name || ''} ${a.candidate_last_name || ''}`;
      const nb = `${b.candidate_first_name || ''} ${b.candidate_last_name || ''}`;
      return na.localeCompare(nb) * dir;
    }
    if (sortBy === 'status') {
      return String(a.status || '').localeCompare(String(b.status || '')) * dir;
    }
    return 0;
  });

  // Filter offers based on active tab
  const filteredOffers = sortedOffers.filter(o => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return o.status === 'pending_approval';
    if (activeTab === 'approved') return o.status === 'approved';
    if (activeTab === 'rejected') return o.status === 'rejected';
    return true;
  });

  const SortHeader: React.FC<{ label: string; field: 'created' | 'job' | 'candidate' | 'status' }> = ({ label, field }) => (
    <th className="p-3 sticky top-0 bg-card z-10">
      <button className="w-full text-left flex items-center gap-1" onClick={() => {
        if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        else { setSortBy(field); setSortOrder('desc'); }
      }}>
        <span>{label}</span>
        <span className="text-xs text-slate-500">{sortBy === field ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Approval Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-card shadow-sm">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{approvalStats.total}</p>
                <p className="text-sm text-gray-500">Total Offers</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-l-4 border-l-yellow-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-yellow-600">{approvalStats.pending}</p>
                <p className="text-sm text-gray-500">Pending Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-l-4 border-l-green-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-green-600">{approvalStats.approved}</p>
                <p className="text-sm text-gray-500">Approved</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card shadow-sm border-l-4 border-l-red-500">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-red-600">{approvalStats.rejected}</p>
                <p className="text-sm text-gray-500">Rejected</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Info Banner for Pending Approvals */}
      {approvalStats.pending > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex items-center gap-3">
          <Clock className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="font-medium text-yellow-800">
              {approvalStats.pending} offer{approvalStats.pending > 1 ? 's' : ''} pending HR Manager approval
            </p>
            <p className="text-sm text-yellow-700">
              Offers must be approved by an HR Manager before they can be sent to candidates.
            </p>
          </div>
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          <CardDescription>Manage offers sent to candidates. New offers require HR Manager approval before sending.</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">All Offers</TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Pending ({approvalStats.pending})
              </TabsTrigger>
              <TabsTrigger value="approved" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Approved ({approvalStats.approved})
              </TabsTrigger>
              <TabsTrigger value="rejected" className="flex items-center gap-1">
                <XCircle className="h-3 w-3" />
                Rejected ({approvalStats.rejected})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {loading && <div className="text-sm text-slate-500">Loading...</div>}
          {error && <div className="text-red-600">{error}</div>}

          <div className="overflow-x-auto rounded border">
            <table className="min-w-full bg-card">
              <thead>
                <tr className="text-left border-b">
                  <th className="p-3 sticky top-0 bg-card z-10">ID</th>
                  <SortHeader label="Job" field="job" />
                  <SortHeader label="Candidate" field="candidate" />
                  <SortHeader label="Status" field="status" />
                  <SortHeader label="Created" field="created" />
                  <th className="p-3 sticky top-0 bg-card z-10">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOffers.length === 0 && (
                  <tr><td className="p-4 text-center text-sm text-slate-500" colSpan={6}>No offers found</td></tr>
                )}
                {filteredOffers.map((o) => (
                  <tr key={o.id} className="border-b hover:bg-muted/50">
                    <td className="p-3 text-xs font-mono">{String(o.id).substring(0, 8)}...</td>
                    <td className="p-3">{o.job_title || o.position_title || '-'}</td>
                    <td className="p-3">{o.candidate_first_name} {o.candidate_last_name}</td>
                    <td className="p-3">{statusBadge(o.status)}</td>
                    <td className="p-3">{o.created_at ? new Date(o.created_at).toLocaleDateString() : '-'}</td>
                    <td className="p-3 space-x-2 whitespace-nowrap">
                      <Button size="sm" variant="outline" onClick={async () => {
                        try {
                          setDetailsLoading(true);
                          setDetailsDialogOpen(true);
                          const res = await restClient.get(`/api/hr/offers/${o.id}`);
                          setSelectedOfferDetails(res.data?.data || res.data);
                        } catch (err: any) {
                          toast({ title: 'Error loading offer', description: err?.message || 'Failed to load offer details', variant: 'destructive' });
                          setDetailsDialogOpen(false);
                        } finally {
                          setDetailsLoading(false);
                        }
                      }}>
                        <Eye className="h-4 w-4 mr-1" /> View
                      </Button>

                      {/* Show different actions based on status */}
                      {o.status === 'pending_approval' && (
                        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Awaiting HR Approval
                        </Badge>
                      )}

                      {o.status === 'approved' && (
                        <Button size="sm" className="bg-ehrdc-teal text-white" onClick={() => sendOffer(o.id)}>
                          <Send className="h-4 w-4 mr-1" /> Send to Candidate
                        </Button>
                      )}

                      {o.status === 'rejected' && (
                        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                          <XCircle className="h-3 w-3 mr-1" />
                          Rejected by HR
                        </Badge>
                      )}

                      {(o.status === 'sent' || o.status === 'draft') && o.status !== 'accepted' && o.status !== 'declined' && (
                        <Button size="sm" className="bg-ehrdc-teal text-white" onClick={() => sendOffer(o.id)}>
                          <Send className="h-4 w-4 mr-1" /> Send
                        </Button>
                      )}

                      {o.signature_token && (
                        <Button size="sm" variant="outline" onClick={() => copySignUrl(o)}>
                          <LinkIcon className="h-4 w-4 mr-1" /> Copy Link
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows:</span>
              <select className="p-1 border rounded" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); loadOffers(); }}>
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => { if (page > 1) { setPage(page - 1); loadOffers(); } }} disabled={page === 1}>Prev</Button>
              <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
              <Button variant="outline" onClick={() => { if (page * pageSize < total) { setPage(page + 1); loadOffers(); } }} disabled={page * pageSize >= total}>Next</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Offer Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-teal-600" />
              Offer Details
            </DialogTitle>
            <DialogDescription>
              Review the offer information below.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-teal-600"></div>
            </div>
          ) : selectedOfferDetails ? (
            <div className="space-y-6">
              {/* Candidate Info */}
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-slate-500" />
                  <span className="text-sm font-medium text-slate-500">CANDIDATE</span>
                </div>
                <p className="text-lg font-semibold">
                  {selectedOfferDetails.candidate_first_name || selectedOfferDetails.first_name || ''}{' '}
                  {selectedOfferDetails.candidate_last_name || selectedOfferDetails.last_name || ''}
                  {!selectedOfferDetails.candidate_first_name && !selectedOfferDetails.first_name && (
                    <span className="text-slate-400">Candidate #{selectedOfferDetails.candidate_id}</span>
                  )}
                </p>
                {(selectedOfferDetails.candidate_email || selectedOfferDetails.email) && (
                  <p className="text-sm text-slate-500">{selectedOfferDetails.candidate_email || selectedOfferDetails.email}</p>
                )}
              </div>

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-500">Status:</span>
                {statusBadge(selectedOfferDetails.status || 'unknown')}
              </div>

              {/* Candidate Response Banner */}
              {(selectedOfferDetails.status === 'declined' || selectedOfferDetails.status === 'accepted' || selectedOfferDetails.status === 'negotiating') && (
                <div className={`rounded-lg p-4 border ${selectedOfferDetails.status === 'declined' ? 'bg-red-50 border-red-200' :
                    selectedOfferDetails.status === 'negotiating' ? 'bg-amber-50 border-amber-200' :
                      'bg-green-50 border-green-200'
                  }`}>
                  <div className="flex items-center gap-2 mb-1">
                    {selectedOfferDetails.status === 'declined' && <XCircle className="h-4 w-4 text-red-600" />}
                    {selectedOfferDetails.status === 'negotiating' && <AlertTriangle className="h-4 w-4 text-amber-600" />}
                    {selectedOfferDetails.status === 'accepted' && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <span className={`font-semibold text-sm ${selectedOfferDetails.status === 'declined' ? 'text-red-800' :
                        selectedOfferDetails.status === 'negotiating' ? 'text-amber-800' :
                          'text-green-800'
                      }`}>
                      {selectedOfferDetails.status === 'declined' ? 'Candidate Declined This Offer' :
                        selectedOfferDetails.status === 'negotiating' ? 'Candidate Wants to Negotiate' :
                          'Candidate Accepted This Offer'}
                    </span>
                  </div>
                  {(selectedOfferDetails.offer_data?.candidate_message || selectedOfferDetails.response_notes) && (
                    <div className="mt-2 pl-6">
                      <p className="text-sm text-slate-700 italic">
                        "{selectedOfferDetails.offer_data?.candidate_message || selectedOfferDetails.response_notes}"
                      </p>
                    </div>
                  )}
                  {selectedOfferDetails.offer_data?.responded_at && (
                    <p className="text-xs text-slate-500 mt-2 pl-6">
                      Responded: {new Date(selectedOfferDetails.offer_data.responded_at).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Position & Compensation */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-teal-600" />
                  <span className="font-semibold">Position & Compensation</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Position</p>
                    <p className="font-medium">{selectedOfferDetails.position_title || selectedOfferDetails.job_title || '-'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Salary</p>
                    <p className="font-medium">
                      {selectedOfferDetails.salary_amount
                        ? `${Number(selectedOfferDetails.salary_amount).toLocaleString()} ${selectedOfferDetails.salary_currency || 'AED'}`
                        : selectedOfferDetails.offer_data?.salary || '-'}
                      {selectedOfferDetails.salary_period && (
                        <span className="text-sm text-slate-400 ml-1">({selectedOfferDetails.salary_period})</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              {(selectedOfferDetails.contract_type || selectedOfferDetails.start_date || selectedOfferDetails.probation_period_months) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-teal-600" />
                    <span className="font-semibold">Contract Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {selectedOfferDetails.contract_type && (
                      <div>
                        <p className="text-sm text-slate-500">Contract Type</p>
                        <p className="font-medium">{selectedOfferDetails.contract_type}</p>
                      </div>
                    )}
                    {selectedOfferDetails.start_date && (
                      <div>
                        <p className="text-sm text-slate-500">Start Date</p>
                        <p className="font-medium">{new Date(selectedOfferDetails.start_date).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedOfferDetails.probation_period_months && (
                      <div>
                        <p className="text-sm text-slate-500">Probation Period</p>
                        <p className="font-medium">{selectedOfferDetails.probation_period_months} months</p>
                      </div>
                    )}
                    {selectedOfferDetails.work_location && (
                      <div>
                        <p className="text-sm text-slate-500">Work Location</p>
                        <p className="font-medium">{selectedOfferDetails.work_location}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Benefits */}
              {selectedOfferDetails.benefits && typeof selectedOfferDetails.benefits === 'object' && Object.keys(selectedOfferDetails.benefits).length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Gift className="h-4 w-4 text-teal-600" />
                    <span className="font-semibold">Benefits & Perks</span>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <ul className="space-y-1 text-sm">
                      {selectedOfferDetails.benefits.annual_leave_days && (
                        <li>• {selectedOfferDetails.benefits.annual_leave_days} days annual leave</li>
                      )}
                      {selectedOfferDetails.benefits.health_insurance && (
                        <li>• Health insurance included</li>
                      )}
                      {selectedOfferDetails.benefits.housing_allowance > 0 && (
                        <li>• Housing allowance: {Number(selectedOfferDetails.benefits.housing_allowance).toLocaleString()} {selectedOfferDetails.salary_currency || 'AED'}</li>
                      )}
                      {selectedOfferDetails.benefits.transportation_allowance > 0 && (
                        <li>• Transportation allowance: {Number(selectedOfferDetails.benefits.transportation_allowance).toLocaleString()} {selectedOfferDetails.salary_currency || 'AED'}</li>
                      )}
                      {selectedOfferDetails.benefits.flight_tickets && (
                        <li>• {selectedOfferDetails.benefits.flight_tickets} flight tickets per year</li>
                      )}
                      {selectedOfferDetails.benefits.additional_benefits?.map((b: string, i: number) => (
                        <li key={i}>• {b}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Timeline */}
              {(selectedOfferDetails.sent_at || selectedOfferDetails.approved_at || selectedOfferDetails.created_at) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-teal-600" />
                    <span className="font-semibold">Timeline</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    {selectedOfferDetails.created_at && (
                      <div>
                        <p className="text-slate-500">Created</p>
                        <p>{new Date(selectedOfferDetails.created_at).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOfferDetails.approved_at && (
                      <div>
                        <p className="text-slate-500">Approved</p>
                        <p>{new Date(selectedOfferDetails.approved_at).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOfferDetails.sent_at && (
                      <div>
                        <p className="text-slate-500">Sent</p>
                        <p>{new Date(selectedOfferDetails.sent_at).toLocaleString()}</p>
                      </div>
                    )}
                    {selectedOfferDetails.response_deadline && (
                      <div>
                        <p className="text-slate-500">Response Deadline</p>
                        <p>{new Date(selectedOfferDetails.response_deadline).toLocaleDateString()}</p>
                      </div>
                    )}
                    {selectedOfferDetails.candidate_response && (
                      <div>
                        <p className="text-slate-500">Candidate Response</p>
                        <p className="font-medium">{selectedOfferDetails.candidate_response}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">No offer details available.</div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
