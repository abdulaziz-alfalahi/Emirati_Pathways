import React, { useEffect, useState } from 'react';
import { apiClient } from '@/utils/apiClient';

export default function DistributionPage() {
  const [queued, setQueued] = useState<any[]>([]);
  const [jobId, setJobId] = useState<string>('');
  const [targets, setTargets] = useState<string>('linkedin,indeed');
  const [error, setError] = useState<string | null>(null);

  // Note: apiClient handles authentication automatically via localStorage.getItem('access_token')

  useEffect(() => {
    // attempt to get a recent job id
    (async () => {
      try {
        const json = await apiClient.get<{ data: { job_postings?: Array<{ id: string }> } }>('/api/hr/jobs/?limit=1');
        const id = json?.data?.job_postings?.[0]?.id;
        if (id) setJobId(id);
      } catch {}
    })();
  }, []);

  const queue = async () => {
    setError(null);
    try {
      const t = targets.split(',').map((s) => s.trim()).filter(Boolean);
      const json = await apiClient.post<{ data: any[] }>(`/api/hr/distribution/jobs/${jobId}/distribute`, { targets: t, payload: { note: 'from UI' } });
      setQueued(json?.data || []);
    } catch (e: any) {
      setError(e?.message || 'Failed to queue');
    }
  };

  const refresh = async () => {
    setError(null);
    try {
      const json = await apiClient.get<{ data: any[] }>(`/api/hr/distribution/jobs/${jobId}`);
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
