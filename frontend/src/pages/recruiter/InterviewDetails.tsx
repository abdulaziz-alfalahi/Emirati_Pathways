import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const API = (p: string) => `http://127.0.0.1:5005${p}`;

export default function InterviewDetailsPage() {
  const [sp] = useSearchParams();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState(sp.get('session') || '');
  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const [sessions, setSessions] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [recordings, setRecordings] = useState<any>(null);

  const loadSessions = async () => {
    try {
      const r = await fetch(API('/api/video-interview/sessions'), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setSessions(j.sessions || []);
    } catch (e: any) {
      toast({ title: 'Failed to load sessions', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const loadReport = async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(API(`/api/video-interview/sessions/${sessionId}/report`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setReport(j.report || null);
    } catch (e: any) {
      toast({ title: 'Failed to load report', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const loadRecordings = async () => {
    if (!sessionId) return;
    try {
      const r = await fetch(API(`/api/video-interview/sessions/${sessionId}/recordings`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const j = await r.json();
      setRecordings(j.recording_info || null);
    } catch (e: any) {
      toast({ title: 'Failed to load recordings', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  useEffect(() => { loadSessions(); }, []);
  useEffect(() => { loadReport(); loadRecordings(); }, [sessionId]);

  const sess = sessions.find(s => s.session_id === sessionId);

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>Pick a session to view AI analysis and recordings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <select className="p-2 border rounded" value={sessionId} onChange={e => setSessionId(e.target.value)}>
              <option value="">Select session</option>
              {sessions.map(s => (
                <option key={s.session_id} value={s.session_id}>{s.session_id} • {s.status}</option>
              ))}
            </select>
            <Button variant="outline" onClick={loadSessions}>Refresh</Button>
          </div>

          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
            </TabsList>

            <TabsContent value="ai">
              {!report && <div className="text-sm text-slate-500">No report loaded</div>}
              {report && (
                <div className="space-y-2">
                  <div className="text-sm"><b>Summary:</b> {report.summary || '-'}</div>
                  <div className="text-sm"><b>Strengths:</b> {(report.strengths || []).join(', ')}</div>
                  <div className="text-sm"><b>Improvements:</b> {(report.improvements || []).join(', ')}</div>
                  <div className="text-sm"><b>Recommendations:</b> {(report.recommendations || []).join(', ')}</div>
                </div>
              )}
              <div className="mt-3">
                <Button onClick={loadReport} disabled={!sessionId}>Generate/Refresh Report</Button>
              </div>
            </TabsContent>

            <TabsContent value="recordings">
              {!recordings && <div className="text-sm text-slate-500">No recordings found</div>}
              {recordings && (
                <div className="space-y-2">
                  <div className="text-sm">Available: {recordings.available ? 'Yes' : 'No'}</div>
                  {recordings.stream_token && (
                    <div className="text-sm">
                      <a className="text-ehrdc-teal underline" href={API(`/api/video-interview/stream/${sessionId}?token=${encodeURIComponent(recordings.stream_token)}`)} target="_blank">Open Recording</a>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
