import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

const API = (p: string) => `http://localhost:5003${p}`;

export default function RecruiterCandidatesPage() {
  const { toast } = useToast();
  const [filters, setFilters] = useState<any>({ limit: 20 });
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  useEffect(() => {
    // Attempt to prefill latest job id
    (async () => {
      try {
        const r = await fetch(API('/api/hr/jobs/?limit=20'), { headers: H as any });
        if (r.ok) {
          const j = await r.json();
          const list = j?.data?.job_postings || [];
          setJobs(list);
          const id = list?.[0]?.id;
          if (id) setJobId(id);
        }
      } catch {}
    })();
  }, [H]);

  const runSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
      });
      const r = await fetch(API(`/api/hr/candidates/search?${params.toString()}`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setResults(j?.data?.candidates || []);
      setTotal(j?.data?.total_count || 0);
    } catch (e: any) {
      toast({ title: 'Failed to search', description: e?.message || 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const shortlist = async (candidateId: number) => {
    if (!jobId) {
      toast({ title: 'Job ID required', description: 'Set a job ID first', variant: 'destructive' });
      return;
    }
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/shortlist`), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, notes: 'Shortlisted from search' })
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Shortlisted', description: `Candidate ${candidateId} added to shortlist` });
    } catch (e: any) {
      toast({ title: 'Failed to shortlist', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Candidate Search</CardTitle>
          <CardDescription>Filter and shortlist candidates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label>Search</Label>
              <Input value={filters.search || ''} onChange={e => setFilters((f: any) => ({ ...f, search: e.target.value }))} placeholder="name, email, skills" />
            </div>
            <div>
              <Label>Emirate</Label>
              <Input value={filters.emirate || ''} onChange={e => setFilters((f: any) => ({ ...f, emirate: e.target.value }))} placeholder="Dubai" />
            </div>
            <div>
              <Label>Education</Label>
              <Input value={filters.education_level || ''} onChange={e => setFilters((f: any) => ({ ...f, education_level: e.target.value }))} placeholder="Bachelor" />
            </div>
            <div>
              <Label>Min Experience</Label>
              <Input type="number" value={filters.min_experience || ''} onChange={e => setFilters((f: any) => ({ ...f, min_experience: e.target.value }))} placeholder="2" />
            </div>
            <div>
              <Label>Skills (comma)</Label>
              <Input value={filters.skills || ''} onChange={e => setFilters((f: any) => ({ ...f, skills: e.target.value }))} placeholder="python, qa" />
            </div>
            <div>
              <Label>Job (for match/shortlist)</Label>
              <select className="w-full p-2 border rounded" value={jobId} onChange={e => setJobId(e.target.value)}>
                {jobs.map(j => (
                  <option key={j.id} value={j.id}>{j.title}</option>
                ))}
              </select>
            </div>
          </div>
          <Tabs defaultValue="search" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="search">Search</TabsTrigger>
              <TabsTrigger value="matches" disabled={!jobId}>Matches for Job</TabsTrigger>
            </TabsList>

            <TabsContent value="search">
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={runSearch} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
              </div>
              <div className="text-sm text-slate-500 mb-2">Total: {total}</div>
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3">ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Emirate</th>
                      <th className="p-3">Education</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">Skills</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-xs">{c.id}</td>
                        <td className="p-3">{c.first_name} {c.last_name}</td>
                        <td className="p-3">{c.emirate}</td>
                        <td className="p-3">{c.education_level}</td>
                        <td className="p-3">{c.experience_years}</td>
                        <td className="p-3">
                          {(c.skills || []).map((s: string) => (
                            <Badge key={s} variant="outline" className="mr-1 mb-1">{s}</Badge>
                          ))}
                        </td>
                        <td className="p-3">
                          <Button size="sm" onClick={() => shortlist(c.id)} disabled={!jobId}>Shortlist</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="matches">
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={async () => {
                  try {
                    const r = await fetch(API(`/api/hr/jobs/${jobId}/publish-and-match`), { method: 'POST', headers: H as any });
                    if (!r.ok) throw new Error(await r.text());
                    const j = await r.json();
                    setMatches(j?.data?.top_matches || []);
                    toast({ title: 'Matched', description: `${(j?.data?.top_matches || []).length} candidates` });
                  } catch (e: any) {
                    toast({ title: 'Match failed', description: e?.message || 'Error', variant: 'destructive' });
                  }
                }}>Publish & Match</Button>
              </div>
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3">Candidate ID</th>
                      <th className="p-3">Name</th>
                      <th className="p-3">Match %</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr key={m.candidate_id} className="border-b hover:bg-slate-50">
                        <td className="p-3 text-xs">{m.candidate_id}</td>
                        <td className="p-3">{m.first_name || ''} {m.last_name || ''}</td>
                        <td className="p-3">{m.match_score?.match_percentage ?? '-'}</td>
                        <td className="p-3">{m.match_score?.match_level ?? '-'}</td>
                        <td className="p-3">
                          <Button size="sm" onClick={() => shortlist(m.candidate_id)} disabled={!jobId}>Shortlist</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
