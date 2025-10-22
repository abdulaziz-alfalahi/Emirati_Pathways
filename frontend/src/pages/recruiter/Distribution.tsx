import React, { useEffect, useState } from 'react';

const api = (path: string) => `http://localhost:5003${path}`;

export default function DistributionPage() {
  const [queued, setQueued] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string>('');
  const [targets, setTargets] = useState<string>('linkedin,indeed');
  const [error, setError] = useState<string | null>(null);

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const authHeaders = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

  useEffect(() => {
    // attempt to get a recent job id
    (async () => {
      try {
        const res = await fetch(api('/api/hr/jobs/?limit=1'), { headers: authHeaders as any });
        if (res.ok) {
          const json = await res.json();
          const id = json?.data?.job_postings?.[0]?.id;
          if (id) setJobId(id);
        }
      } catch {}
    })();
  }, []);

  const queue = async () => {
    setError(null);
    try {
      const t = targets.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await fetch(api(`/api/hr/distribution/jobs/${jobId}/distribute`), { method: 'POST', headers: authHeaders as any, body: JSON.stringify({ targets: t, payload: { note: 'from UI' } }) });
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setQueued(json?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to queue');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">External Distribution</h1>
      <div className="flex items-center space-x-2">
        <input className="border px-2 py-1 rounded w-96" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ID" />
        <input className="border px-2 py-1 rounded w-64" value={targets} onChange={(e) => setTargets(e.target.value)} placeholder="Targets (comma separated)" />
        <button className="px-3 py-1 bg-ehrdc-teal text-white rounded" onClick={queue} disabled={!jobId}>Queue</button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <ul className="list-disc pl-6">
        {queued.map((row) => (
          <li key={row.id}>
            {row.target} - {row.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
