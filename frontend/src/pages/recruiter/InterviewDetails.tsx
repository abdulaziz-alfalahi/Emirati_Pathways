import React, { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { restClient } from '@/utils/api';

const API = (p: string) => `${p}`;

export default function InterviewDetailsPage() {
  const [sp] = useSearchParams();
  const { toast } = useToast();
  const [sessionId, setSessionId] = useState(sp.get('session') || '');

  const [sessions, setSessions] = useState<any[]>([]);
  const [report, setReport] = useState<any>(null);
  const [recordings, setRecordings] = useState<any>(null);

  const loadSessions = async () => {
    try {
      // /api/video-interview/sessions was never implemented — the dropdown
      // called a 404 and was therefore always empty (feedback fb_1785820412).
      // The recruiter's real sessions come from the interviews API.
      const r = await restClient.get('/api/interviews/sessions/my?role=recruiter');
      const rows = r.data?.data || r.data?.sessions || [];
      setSessions((rows as any[]).map((s: any) => ({
        ...s,
        // The analysis/recording endpoints key off interview_id, not the row id.
        session_id: s.interview_id || s.session_id || s.id,
        candidate_name: s.candidate_display_name || s.candidate_name || s.candidate_id,
      })));
    } catch (e: any) {
      toast({ title: 'Failed to load sessions', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const loadReport = async () => {
    if (!sessionId) return;
    try {
      const r = await restClient.get(`/api/video-interview/sessions/${sessionId}/report`);
      setReport(r.data?.report || null);
    } catch (e: any) {
      toast({ title: 'Failed to load report', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const loadRecordings = async () => {
    if (!sessionId) return;
    try {
      const r = await restClient.get(`/api/video-interview/sessions/${sessionId}/recordings`);
      setRecordings(r.data?.recording_info || null);
    } catch (e: any) {
      toast({ title: 'Failed to load recordings', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  useEffect(() => { loadSessions(); }, []);

  useEffect(() => {
    if (!sessionId) {
      setReport(null);
      setRecordings(null);
      return;
    }
    const currentSess = sessions.find(s => s.session_id === sessionId);
    if (currentSess && currentSess.status === 'completed') {
      loadReport();
      loadRecordings();
    } else {
      setReport(null);
      setRecordings(null);
    }
  }, [sessionId, sessions]);

  const sess = sessions.find(s => s.session_id === sessionId);

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Interview Details</CardTitle>
          <CardDescription>
            Review a completed video interview: choose one of your interview sessions to see its
            AI analysis (competency signals and summary) and any recording that was captured.
            Sessions appear here once they have been scheduled; analysis and recordings become
            available after the interview has finished.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <select className="p-2 border rounded" value={sessionId} onChange={e => setSessionId(e.target.value)}>
              <option value="">Select session</option>
              {sessions.map(s => (
                <option key={s.session_id} value={s.session_id}>
                  {[s.candidate_name, s.job_title].filter(Boolean).join(' — ') || s.session_id} • {s.status}
                </option>
              ))}
            </select>
            <Button variant="outline" onClick={loadSessions}>Refresh</Button>
          </div>
          {sessions.length === 0 && (
            <p className="text-sm text-muted-foreground mb-3">
              No interview sessions yet — schedule an interview from a candidate's application and it will appear here.
            </p>
          )}

          <Tabs defaultValue="ai" className="w-full">
            <TabsList className="mb-3">
              <TabsTrigger value="ai">AI Analysis</TabsTrigger>
              <TabsTrigger value="recordings">Recordings</TabsTrigger>
            </TabsList>

            <TabsContent value="ai">
              {sess && sess.status !== 'completed' ? (
                <div className="text-sm text-slate-500 p-4 border border-dashed rounded bg-slate-50/50">
                  AI Analysis report will be available once the interview has been conducted and completed. Current status: <span className="font-semibold capitalize text-teal-600">{sess.status}</span>
                </div>
              ) : (
                <>
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
                    <Button onClick={loadReport} disabled={!sessionId || sess?.status !== 'completed'}>Generate/Refresh Report</Button>
                  </div>
                </>
              )}
            </TabsContent>

            <TabsContent value="recordings">
              {sess && sess.status !== 'completed' ? (
                <div className="text-sm text-slate-500 p-4 border border-dashed rounded bg-slate-50/50">
                  Recording streaming will be available once the interview has been completed.
                </div>
              ) : (
                <>
                  {!recordings && <div className="text-sm text-slate-500">No recordings found</div>}
                  {recordings && (
                    <div className="space-y-2">
                      {/* Payload fields are recording_available/streaming_url — the old
                          available/stream_token reads meant "Available: No" and no link
                          even when a recording existed. */}
                      <div className="text-sm">Available: {recordings.recording_available ? 'Yes' : 'No'}</div>
                      {recordings.streaming_url && (
                        <div className="text-sm">
                          <a className="text-ehrdc-teal underline" href={API(recordings.streaming_url)} target="_blank">Open Recording</a>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
