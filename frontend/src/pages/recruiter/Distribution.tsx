import React, { useEffect, useState } from 'react';
import { restClient } from '@/utils/api';

export default function DistributionPage() {
  const [queued, setQueued] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string>('');
  const [targets, setTargets] = useState<string>('linkedin,indeed');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // attempt to get a recent job id
    (async () => {
      try {
        const res = await restClient.get('/api/hr/jobs/?limit=1');
        const json = res.data;
        const id = json?.data?.job_postings?.[0]?.id;
        if (id) setJobId(id);
      } catch {}
    })();
  }, []);

  const queue = async () => {
    setError(null);
    try {
      const t = targets.split(',').map((s) => s.trim()).filter(Boolean);
      const res = await restClient.post(`/api/hr/distribution/jobs/${jobId}/distribute`, { targets: t, payload: { note: 'from UI' } });
      const json = res.data;
      setQueued(json?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to queue');
    }
  };

  const refresh = async () => {
    setError(null);
    try {
      const res = await restClient.get(`/api/hr/distribution/jobs/${jobId}`);
      const json = res.data;
      setQueued(json?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to refresh');
    }
  };

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">External Distribution</h1>
      <div className="flex items-center space-x-2">
        <input className="border px-2 py-1 rounded w-96" value={jobId} onChange={(e) => setJobId(e.target.value)} placeholder="Job ID" />
        <input className="border px-2 py-1 rounded w-64" value={targets} onChange={(e) => setTargets(e.target.value)} placeholder="Targets (comma separated)" />
        <button className="px-3 py-1 bg-ehrdc-teal text-white rounded" onClick={queue} disabled={!jobId}>Queue</button>
        <button className="px-3 py-1 bg-gray-100 rounded" onClick={refresh} disabled={!jobId}>Refresh</button>
      </div>
      {error && <div className="text-red-600">{error}</div>}
      <ul className="list-disc ps-6">
        {queued.map((row) => (
          <li key={row.id}>
            {row.target} - {row.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
