import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

const api = (path: string) => `http://localhost:5003${path}`;

export default function ApprovalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { toast } = useToast();

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    (async () => { await load(); })();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(api(`/api/hr/approvals/requests?limit=${pageSize}`), { headers: authHeaders as any });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setItems(json?.data?.requests || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to load approvals');
    } finally {
      setLoading(false);
    }
  };

  const act = async (id: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(api(`/api/hr/approvals/requests/${id}/${action}`), {
        method: 'POST',
        headers: { ...(authHeaders as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: action })
      });
      if (!res.ok) throw new Error(await res.text());
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
            <th className="p-3 sticky top-0 bg-white z-10">Resource</th>
            <th className="p-3 sticky top-0 bg-white z-10">Approver</th>
            <th className="p-3 sticky top-0 bg-white z-10">Status</th>
            <th className="p-3 sticky top-0 bg-white z-10">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.length === 0 && (
            <tr>
              <td className="p-4 text-center text-sm text-slate-500" colSpan={5}>No approval requests</td>
            </tr>
          )}
          {items.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-3 text-xs">{r.id}</td>
              <td className="p-3">{r.resource_type}</td>
              <td className="p-3">{r.approver_id}</td>
              <td className="p-3">{r.status === 'approved' ? <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">approved</Badge> : r.status === 'rejected' ? <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">rejected</Badge> : <Badge variant="outline">pending</Badge>}</td>
              <td className="p-3 space-x-2">
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
    </div>
  );
}
