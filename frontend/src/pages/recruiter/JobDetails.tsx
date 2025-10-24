import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Upload, Users, MessageSquare } from 'lucide-react';

const API = (p: string) => `http://localhost:5003${p}`;

export default function JobDetailsPage() {
  const { id: routeId } = useParams();
  const [jobId, setJobId] = useState<string>(routeId || '');
  const [job, setJob] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [docs, setDocs] = useState<any[]>([]);
  const [shortlist, setShortlist] = useState<any[]>([]);
  const [matches, setMatches] = useState<any[]>([]);
  const [fileList, setFileList] = useState<FileList | null>(null);
  const { toast } = useToast();

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const loadJob = async () => {
    if (!jobId) return;
    setLoading(true);
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setJob(j?.data || null);
    } catch (e: any) {
      toast({ title: 'Failed to load job', description: e?.message || 'Error', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadDocuments = async () => {
    if (!jobId) return;
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/documents`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setDocs(j?.data || []);
    } catch (e: any) {
      toast({ title: 'Failed to load documents', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const uploadDocuments = async () => {
    if (!jobId || !fileList || fileList.length === 0) return;
    try {
      for (let i = 0; i < fileList.length; i++) {
        const fd = new FormData();
        fd.append('file', fileList[i]);
        const r = await fetch(API(`/api/hr/jobs/${jobId}/documents`), {
          method: 'POST',
          headers: { ...(H as any) },
          body: fd,
        });
        if (!r.ok) throw new Error(await r.text());
      }
      toast({ title: 'Documents uploaded' });
      await loadDocuments();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const deleteDocument = async (docId: string) => {
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/documents/${docId}`), { method: 'DELETE', headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Document deleted' });
      await loadDocuments();
    } catch (e: any) {
      toast({ title: 'Delete failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const loadShortlist = async () => {
    if (!jobId) return;
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/shortlist`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setShortlist(j?.data || []);
    } catch (e: any) {
      toast({ title: 'Failed to load shortlist', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const removeFromShortlist = async (candidateId: number) => {
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/shortlist/${candidateId}`), { method: 'DELETE', headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Removed from shortlist' });
      await loadShortlist();
    } catch (e: any) {
      toast({ title: 'Remove failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const shortlistCandidate = async (candidateId: number) => {
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/shortlist`), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidate_id: candidateId, notes: 'Shortlisted from matches' }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Shortlisted' });
      await loadShortlist();
    } catch (e: any) {
      toast({ title: 'Shortlist failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const publishAndMatch = async () => {
    try {
      const r = await fetch(API(`/api/hr/jobs/${jobId}/publish-and-match`), { method: 'POST', headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setMatches(j?.data?.top_matches || []);
      toast({ title: 'Matched', description: `${(j?.data?.top_matches || []).length} candidates` });
    } catch (e: any) {
      toast({ title: 'Match failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  useEffect(() => {
    if (!jobId) return;
    loadJob();
    loadDocuments();
    loadShortlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Job Details</h1>
          <div className="text-sm text-slate-500">{jobId ? `ID: ${jobId}` : 'No job selected'}</div>
        </div>
        <div className="text-sm">
          <Link to="/recruiter/jobs/new"><Button variant="outline">Create New Job</Button></Link>
        </div>
      </div>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>{job?.title || 'Loading…'}</CardTitle>
          <CardDescription>
            {job?.location} • {job?.employment_type} • {job?.experience_level} • Status: <Badge variant="outline">{job?.status}</Badge>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="documents" className="w-full">
            <TabsList className="mb-4">
              <TabsTrigger value="documents">Documents</TabsTrigger>
              <TabsTrigger value="shortlist">Shortlist</TabsTrigger>
              <TabsTrigger value="candidates">Candidates</TabsTrigger>
            </TabsList>

            <TabsContent value="documents">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Input type="file" multiple onChange={e => setFileList(e.target.files)} />
                  <Button onClick={uploadDocuments} disabled={!jobId}><Upload className="h-4 w-4 mr-1" /> Upload</Button>
                </div>
                <div className="overflow-x-auto rounded border">
                  <table className="min-w-full bg-white">
                    <thead>
                      <tr className="text-left border-b">
                        <th className="p-3">Filename</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Size</th>
                        <th className="p-3">Uploaded</th>
                        <th className="p-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {docs.map((d) => (
                        <tr key={d.id} className="border-b hover:bg-slate-50">
                          <td className="p-3">{d.original_filename}</td>
                          <td className="p-3">{d.document_type || '-'}</td>
                          <td className="p-3">{d.size_bytes || 0}</td>
                          <td className="p-3">{d.created_at}</td>
                          <td className="p-3">
                            <Button size="sm" variant="outline" onClick={() => deleteDocument(d.id)}>
                              <Trash2 className="h-4 w-4 mr-1" /> Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="shortlist">
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Education</th>
                      <th className="p-3">Experience</th>
                      <th className="p-3">Notes</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shortlist.map((s) => (
                      <tr key={s.candidate_id} className="border-b hover:bg-slate-50">
                        <td className="p-3">{s.first_name || ''} {s.last_name || ''} (#{s.candidate_id})</td>
                        <td className="p-3">{s.education_level || '-'}</td>
                        <td className="p-3">{s.experience_years ?? '-'}</td>
                        <td className="p-3">{s.notes || '-'}</td>
                        <td className="p-3 space-x-2">
                          <Button size="sm" variant="outline" onClick={() => removeFromShortlist(s.candidate_id)}>Remove</Button>
                          <Link to={`/messages?to=${s.candidate_id}&job=${jobId}`}>
                            <Button size="sm" variant="outline"><MessageSquare className="h-4 w-4 mr-1" /> Message</Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </TabsContent>

            <TabsContent value="candidates">
              <div className="flex items-center gap-2 mb-4">
                <Button onClick={publishAndMatch} disabled={!jobId}><Users className="h-4 w-4 mr-1" /> Publish & Match</Button>
              </div>
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full bg-white">
                  <thead>
                    <tr className="text-left border-b">
                      <th className="p-3">Candidate</th>
                      <th className="p-3">Match %</th>
                      <th className="p-3">Level</th>
                      <th className="p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matches.map((m) => (
                      <tr key={m.candidate_id} className="border-b hover:bg-slate-50">
                        <td className="p-3">{m.first_name || ''} {m.last_name || ''} (#{m.candidate_id})</td>
                        <td className="p-3">{m.match_score?.match_percentage ?? '-'}</td>
                        <td className="p-3">{m.match_score?.match_level ?? '-'}</td>
                        <td className="p-3">
                          <Button size="sm" onClick={() => shortlistCandidate(m.candidate_id)}>Shortlist</Button>
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
