import React, { useEffect, useState } from 'react';

const api = (path: string) => `http://localhost:5003${path}`;

export default function OffersPage() {
  const [offers, setOffers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await fetch(api('/api/hr/offers/?limit=20'), { headers: authHeaders as any });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        setOffers(json?.data?.offers || []);
      } catch (e: any) {
        setError(e?.message || 'Failed to load offers');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Offers</h1>
      {loading && <div>Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr className="text-left border-b">
            <th className="p-3">ID</th>
            <th className="p-3">Job</th>
            <th className="p-3">Candidate</th>
            <th className="p-3">Status</th>
            <th className="p-3">Actions</th>
          </tr>
        </thead>
        <tbody>
          {offers.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="p-3 text-xs">{o.id}</td>
              <td className="p-3">{o.job_title}</td>
              <td className="p-3">{o.candidate_first_name} {o.candidate_last_name}</td>
              <td className="p-3">{o.status}</td>
              <td className="p-3 space-x-2">
                {/* Placeholder actions */}
                <button className="px-2 py-1 bg-gray-100 rounded" onClick={async() => {
                  const res = await fetch(api(`/api/hr/offers/${o.id}`), { headers: authHeaders as any });
                  alert(await res.text());
                }}>View</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
