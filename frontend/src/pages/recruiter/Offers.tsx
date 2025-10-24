import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Eye, Send, Link as LinkIcon } from 'lucide-react';

const api = (path: string) => `http://localhost:5003${path}`;

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

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const loadOffers = async () => {
    try {
      setLoading(true);
      const res = await fetch(api(`/api/hr/offers/?limit=${pageSize}&offset=${(page - 1) * pageSize}`), { headers: authHeaders as any });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setOffers(json?.data?.offers || []);
      setTotal(json?.data?.total_count || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sendOffer = async (offerId: string) => {
    try {
      const res = await fetch(api(`/api/hr/offers/${offerId}/send`), {
        method: 'POST',
        headers: { ...(authHeaders as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ expires_in_days: 7 })
      });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
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
      const signUrl = `${api(`/api/offers/${o.id}/accept`)}?token=${o.signature_token}`;
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
    const map: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-800 border-gray-200',
      sent: 'bg-blue-100 text-blue-800 border-blue-200',
      accepted: 'bg-green-100 text-green-800 border-green-200',
      declined: 'bg-red-100 text-red-800 border-red-200',
    };
    return <Badge variant="outline" className={map[status] || 'bg-slate-100 text-slate-800 border-slate-200'}>{status}</Badge>;
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

  const SortHeader: React.FC<{ label: string; field: 'created'|'job'|'candidate'|'status' }>=({label, field}) => (
    <th className="p-3 sticky top-0 bg-white z-10">
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
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Offers</CardTitle>
          <CardDescription>Manage offers sent to candidates</CardDescription>
        </CardHeader>
        <CardContent>
      {loading && <div className="text-sm text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded border">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3 sticky top-0 bg-white z-10">ID</th>
            <SortHeader label="Job" field="job" />
            <SortHeader label="Candidate" field="candidate" />
            <SortHeader label="Status" field="status" />
            <SortHeader label="Created" field="created" />
            <th className="p-3 sticky top-0 bg-white z-10">Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.length === 0 && (
            <tr><td className="p-4 text-center text-sm text-slate-500" colSpan={5}>No offers yet</td></tr>
          )}
          {sortedOffers.map((o) => (
            <tr key={o.id} className="border-b hover:bg-slate-50">
              <td className="p-3 text-xs">{o.id}</td>
              <td className="p-3">{o.job_title}</td>
              <td className="p-3">{o.candidate_first_name} {o.candidate_last_name}</td>
              <td className="p-3">{statusBadge(o.status)}</td>
              <td className="p-3">{o.created_at || '-'}</td>
              <td className="p-3 space-x-2 whitespace-nowrap">
                <Button size="sm" variant="outline" onClick={async() => {
                  const res = await fetch(api(`/api/hr/offers/${o.id}`), { headers: authHeaders as any });
                  const txt = await res.text();
                  toast({ title: 'Offer details', description: txt.substring(0, 200) + (txt.length>200?'...':'') });
                }}>
                  <Eye className="h-4 w-4 mr-1" /> View
                </Button>
                {o.status !== 'accepted' && o.status !== 'declined' && (
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
    </div>
  );
}
