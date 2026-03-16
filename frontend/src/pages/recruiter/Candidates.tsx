import React, { useEffect, useMemo, useState } from 'react';
import { getDisplayName } from '@/utils/nameUtils';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { restClient } from '@/utils/api';

// Removing custom API helper and manual token logic

import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function RecruiterCandidatesPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [filters, setFilters] = useState<any>({ limit: 20 });
  const [results, setResults] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<number | null>(null);
  const [jobId, setJobId] = useState('');
  const [jobs, setJobs] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('registered_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [mPage, setMPage] = useState(1);
  const [mPageSize, setMPageSize] = useState(10);
  const [mSortBy, setMSortBy] = useState<'percentage' | 'name'>('percentage');
  const [mSortOrder, setMSortOrder] = useState<'asc' | 'desc'>('desc');

  // Auth handled by restClient interceptor

  useEffect(() => {
    // Attempt to prefill latest job id
    (async () => {
      try {
        const r = await restClient.get('/api/hr/jobs?limit=20');
        if (r.status === 200) {
          const list = r.data?.data?.job_postings || [];
          setJobs(list);
          const id = list?.[0]?.id;
          if (id) setJobId(id);
        }
      } catch { }
    })();
  }, []);

  const runSearch = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') params.append(k, String(v));
      });
      params.set('limit', String(pageSize));
      params.set('offset', String((page - 1) * pageSize));
      params.set('sort_by', sortBy);
      params.set('sort_order', sortOrder);
      if (jobId) params.set('job_id', jobId);

      const r = await restClient.get(`/api/hr/candidates/search?${params.toString()}`);
      const j = r.data;
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
    setSubmittingId(candidateId);
    try {
      const r = await restClient.post(`/api/hr/jobs/${jobId}/shortlist`, {
        candidate_id: candidateId,
        notes: 'Shortlisted from search'
      });
      toast({ title: 'Shortlisted', description: `Candidate ${candidateId} added to shortlist` });

      // Update local state to reflect shortlist sync
      setResults(prev => prev.map(c =>
        c.id === candidateId ? { ...c, is_shortlisted: true } : c
      ));
      setMatches(prev => prev.map(c =>
        c.candidate_id === candidateId ? { ...c, is_shortlisted: true } : c
      ));
    } catch (e: any) {
      const errorMsg = e.response?.data?.message || e.message || 'Error shortlisting candidate';
      toast({ title: 'Failed to shortlist', description: errorMsg, variant: 'destructive' });
    }
  };

  const SortHeader: React.FC<{ label: string; field: string }> = ({ label, field }) => (
    <th className="p-3 sticky top-0 bg-card z-10">
      <button
        className="text-left w-full flex items-center gap-1"
        onClick={() => {
          if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(field);
            setSortOrder('desc');
          }
          setPage(1);
          runSearch();
        }}
      >
        <span>{label}</span>
        <span className="text-xs text-slate-500">{sortBy === field ? (sortOrder === 'asc' ? '▲' : '▼') : ''}</span>
      </button>
    </th>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button variant="ghost" className="gap-2 pl-0 hover:pl-2 transition-all" onClick={() => {
          try {
            const userStr = localStorage.getItem('user');
            if (userStr) {
              const u = JSON.parse(userStr);
              if (u.role === 'hr_manager' || u.role === 'hr' || u.user_type === 'hr_manager') {
                navigate('/hr-dashboard');
                return;
              }
            }
          } catch (e) { }
          navigate('/recruiter');
        }}>
          <ChevronLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
      </div>
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
              <select className="w-full p-2 border rounded" value={jobId} onChange={e => {
                setJobId(e.target.value);
                // Trigger search reload when job changes to update shortlist status
                if (results.length > 0) setTimeout(() => runSearch(), 100);
              }}>
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
              <div className="flex items-center gap-2 mb-3">
                <Label>Sort by</Label>
                <select className="p-2 border rounded" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                  <option value="registered_at">Registration Date</option>
                  <option value="last_login">Last Login</option>
                  <option value="experience">Experience</option>
                  <option value="applications">Applications</option>
                  <option value="name">Name</option>
                </select>
                <select className="p-2 border rounded" value={sortOrder} onChange={e => setSortOrder(e.target.value as any)}>
                  <option value="desc">Desc</option>
                  <option value="asc">Asc</option>
                </select>
                <Button onClick={() => { setPage(1); runSearch(); }} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
                <div className="ml-auto text-sm text-slate-500">Total: {total}</div>
              </div>
              <div className="text-sm text-slate-500 mb-2">Total: {total}</div>
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full bg-card">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3 sticky top-0 bg-card z-10">ID</th>
                      <SortHeader label="Name" field="name" />
                      <th className="p-3 sticky top-0 bg-card z-10">Emirate</th>
                      <SortHeader label="Education" field="education_level" />
                      <SortHeader label="Experience" field="experience" />
                      <th className="p-3 sticky top-0 bg-card z-10">Skills</th>
                      <th className="p-3 sticky top-0 bg-card z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.length === 0 && (
                      <tr>
                        <td className="p-4 text-center text-sm text-slate-500" colSpan={7}>No candidates found</td>
                      </tr>
                    )}
                    {results.map((c) => (
                      <tr key={c.id} className="border-b hover:bg-muted/50">
                        <td className="p-3 text-xs">{c.id}</td>
                        <td className="p-3">{getDisplayName(c)}</td>
                        <td className="p-3">{c.emirate}</td>
                        <td className="p-3">{c.education_level}</td>
                        <td className="p-3">{c.experience_years}</td>
                        <td className="p-3">
                          {(c.skills || []).map((s: string) => (
                            <Badge key={s} variant="outline" className="mr-1 mb-1">{s}</Badge>
                          ))}
                        </td>
                        <td className="p-3">
                          {c.is_shortlisted ? (
                            <Button size="sm" variant="outline" disabled className="text-green-600 border-green-200 bg-green-50">
                              Shortlisted
                            </Button>
                          ) : (
                            <Button size="sm" onClick={() => shortlist(c.id)} disabled={!jobId || loading || submittingId === c.id}>
                              {submittingId === c.id ? 'Saving...' : 'Shortlist'}
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
                  <select className="p-1 border rounded" value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}>
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => { if (page > 1) { setPage(page - 1); runSearch(); } }} disabled={page === 1}>Prev</Button>
                  <div className="text-sm">Page {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
                  <Button variant="outline" onClick={() => { if (page * pageSize < total) { setPage(page + 1); runSearch(); } }} disabled={page * pageSize >= total}>Next</Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="matches">
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={async () => {
                  try {
                    const r = await restClient.post(`/api/hr/jobs/${jobId}/publish-and-match`);
                    const j = r.data;
                    setMatches(j?.data?.top_matches || []);
                    toast({ title: 'Matched', description: `${(j?.data?.top_matches || []).length} candidates` });
                  } catch (e: any) {
                    toast({ title: 'Match failed', description: e?.message || 'Error', variant: 'destructive' });
                  }
                }}>Publish & Match</Button>
              </div>
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full bg-card">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3 sticky top-0 bg-card z-10">Candidate ID</th>
                      <th className="p-3 sticky top-0 bg-card z-10">Name</th>
                      <th className="p-3 sticky top-0 bg-card z-10">
                        <button
                          className="text-left w-full flex items-center gap-1"
                          onClick={() => {
                            if (mSortBy === 'percentage') setMSortOrder(mSortOrder === 'asc' ? 'desc' : 'asc');
                            else { setMSortBy('percentage'); setMSortOrder('desc'); }
                          }}
                        >
                          <span>Match %</span>
                          <span className="text-xs text-slate-500">{mSortBy === 'percentage' ? (mSortOrder === 'asc' ? '▲' : '▼') : ''}</span>
                        </button>
                      </th>
                      <th className="p-3 sticky top-0 bg-card z-10">Level</th>
                      <th className="p-3 sticky top-0 bg-card z-10">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const sorted = [...matches].sort((a, b) => {
                        const pa = a.match_score?.match_percentage ?? 0;
                        const pb = b.match_score?.match_percentage ?? 0;
                        return mSortOrder === 'asc' ? pa - pb : pb - pa;
                      });
                      const start = (mPage - 1) * mPageSize;
                      const rows = sorted.slice(start, start + mPageSize);
                      if (rows.length === 0) return (
                        <tr><td className="p-4 text-center text-sm text-slate-500" colSpan={5}>No matches yet</td></tr>
                      );
                      return rows.map((m) => (
                        <tr key={m.candidate_id} className="border-b hover:bg-muted/50">
                          <td className="p-3 text-xs">{m.candidate_id}</td>
                          <td className="p-3">{getDisplayName(m)}</td>
                          <td className="p-3">{m.match_score?.match_percentage ?? '-'}</td>
                          <td className="p-3">{m.match_score?.match_level ?? '-'}</td>
                          <td className="p-3">
                            {m.is_shortlisted ? (
                              <Button size="sm" variant="outline" disabled className="text-green-600 border-green-200 bg-green-50">
                                Shortlisted
                              </Button>
                            ) : (
                              <Button size="sm" onClick={() => shortlist(m.candidate_id)} disabled={!jobId || loading || submittingId === m.candidate_id}>
                                {submittingId === m.candidate_id ? 'Saving...' : 'Shortlist'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2 text-sm">
                  <span>Rows:</span>
                  <select className="p-1 border rounded" value={mPageSize} onChange={e => { setMPageSize(Number(e.target.value)); setMPage(1); }}>
                    <option>10</option>
                    <option>20</option>
                    <option>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setMPage(p => Math.max(1, p - 1))} disabled={mPage === 1}>Prev</Button>
                  <div className="text-sm">Page {mPage} / {Math.max(1, Math.ceil((matches?.length || 0) / mPageSize))}</div>
                  <Button variant="outline" onClick={() => setMPage(p => (p * mPageSize < (matches?.length || 0) ? p + 1 : p))} disabled={mPage * mPageSize >= (matches?.length || 0)}>Next</Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
