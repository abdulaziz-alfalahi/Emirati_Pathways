import React, { useEffect, useState } from 'react';

const api = (path: string) => `http://localhost:5003${path}`;

export default function ApprovalsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    (async () => { await load(); })();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const res = await fetch(api('/api/hr/approvals/requests?limit=20'), { headers: authHeaders as any });
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
    } catch (e: any) {
      alert(`Failed to ${action}: ${e?.message || e}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Approvals</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">ID</th>
            <th className="p-3">Resource</th>
            <th className="p-3">Approver</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-3 text-xs">{r.id}</td>
              <td className="p-3">{r.resource_type}</td>
              <td className="p-3">{r.approver_id}</td>
              <td className="p-3">{r.status}</td>
              <td className="p-3 space-x-2">
                {r.status === 'pending' && (
                  <>
                    <button className="px-2 py-1 bg-ehrdc-teal text-white rounded" onClick={() => act(r.id, 'approve')}>Approve</button>
                    <button className="px-2 py-1 bg-gray-100 rounded" onClick={() => act(r.id, 'reject')}>Reject</button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
