import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/utils/apiClient';

export default function ApprovalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [sortBy, setSortBy] = useState<'created'|'status'|'resource'>('created');
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc');
  const { toast } = useToast();

  // Note: apiClient handles authentication automatically via localStorage.getItem('access_token')

  useEffect(() => {
    (async () => { await load(); })();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const json = await apiClient.get<{ data: { requests: any[]; total_count: number } }>(`/api/hr/approvals/requests?limit=${pageSize}`);
      setItems(json?.data?.requests || []);
      setTotal(json?.data?.total_count || 0);
    } catch (e: any) {
      setError(e?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    try {
      await apiClient.post(`/api/hr/approvals/requests/${id}/${action}`, { comment: action });
      await load();
      toast({ title: action === 'approve' ? 'Approved' : 'Rejected' });
    } catch (e: any) {
      alert(`Failed to ${action}: ${e?.message || e}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Approvals</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <div className="overflow-x-auto rounded border">
      <table className="min-w-full bg-white">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3 sticky top-0 bg-white z-10">ID</th>
            <th className="p-3 sticky top-0 bg-white z-10">
              <button className="w-full text-left" onClick={() => { if (sortBy==='resource') setSortOrder(sortOrder==='asc'?'desc':'asc'); else { setSortBy('resource'); setSortOrder('desc'); } }}>
                Resource {sortBy==='resource' ? (sortOrder==='asc'?'▲':'▼') : ''}
              </button>
            </th>
            <th className="p-3 sticky top-0 bg-white z-10">Approver</th>
            <th className="p-3 sticky top-0 bg-white z-10">
              <button className="w-full text-left" onClick={() => { if (sortBy==='status') setSortOrder(sortOrder==='asc'?'desc':'asc'); else { setSortBy('status'); setSortOrder('desc'); } }}>
                Status {sortBy==='status' ? (sortOrder==='asc'?'▲':'▼') : ''}
              </button>
            </th>
            <th className="p-3 sticky top-0 bg-white z-10">
              <button className="w-full text-left" onClick={() => { if (sortBy==='created') setSortOrder(sortOrder==='asc'?'desc':'asc'); else { setSortBy('created'); setSortOrder('desc'); } }}>
                Created {sortBy==='created' ? (sortOrder==='asc'?'▲':'▼') : ''}
              </button>
            </th>
            <th className="p-3 sticky top-0 bg-white z-10">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td className="p-4 text-center text-sm text-slate-500" colSpan={5}>No approval requests</td>
            </tr>
          )}
          {[...items].sort((a,b)=>{
            const dir = sortOrder==='asc'?1:-1;
            if (sortBy==='status') return String(a.status||'').localeCompare(String(b.status||''))*dir;
            if (sortBy==='resource') return String(a.resource_type||'').localeCompare(String(b.resource_type||''))*dir;
            if (sortBy==='created') return String(a.created_at||'').localeCompare(String(b.created_at||''))*dir;
            return 0;
          }).map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-3 text-xs">{r.id}</td>
              <td className="p-3">{r.resource_type}</td>
              <td className="p-3">{r.approver_id}</td>
              <td className="p-3">{r.status === 'approved' ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">approved</Badge> : r.status === 'rejected' ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">rejected</Badge> : <Badge variant="outline">pending</Badge>}</td>
              <td className="p-3">{r.created_at || '-'}</td>
              <td className="p-3 space-x-2 whitespace-nowrap">
                {r.status === 'pending' && (
                  <>
                    <Button size="sm" className="bg-ehrdc-teal text-white" onClick={() => act(r.id, 'approve')}>Approve</Button>
                    <Button size="sm" variant="outline" onClick={() => act(r.id, 'reject')}>Reject</Button>
                  </>
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
          <select className="p-1 border rounded" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); load(); }}>
            <option>10</option>
            <option>20</option>
            <option>50</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => { if (page > 1) { setPage(page - 1); load(); } }} disabled={page === 1}>Prev</Button>
          <div className="text-sm">Page {page}</div>
          <Button variant="outline" onClick={() => { if (items.length === pageSize) { setPage(page + 1); load(); } }} disabled={items.length < pageSize}>Next</Button>
        </div>
      </div>
    </div>
  );
}
