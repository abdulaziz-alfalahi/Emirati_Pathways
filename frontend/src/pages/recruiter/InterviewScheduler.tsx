import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

const API = (p: string) => `http://localhost:5003${p}`;

export default function InterviewSchedulerPage() {
  const { toast } = useToast();
  const [applicationId, setApplicationId] = useState('');
  const [jobId, setJobId] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [interviewerId, setInterviewerId] = useState('1');
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const schedule = async () => {
    try {
      const body = {
        application_id: applicationId,
        scheduled_date: scheduledDate,
        interviewer_id: Number(interviewerId),
        duration_minutes: Number(duration),
        interview_type: 'video',
        notes,
      };
      const r = await fetch(API('/api/hr/interviews/'), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Interview scheduled' });
    } catch (e: any) {
      toast({ title: 'Schedule failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const reschedule = async () => {
    const id = prompt('Interview ID to reschedule');
    if (!id) return;
    try {
      const r = await fetch(API(`/api/hr/interviews/${id}/reschedule`), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_scheduled_date: scheduledDate, reschedule_reason: 'Updated time' }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Interview rescheduled' });
    } catch (e: any) {
      toast({ title: 'Reschedule failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const cancel = async () => {
    const id = prompt('Interview ID to cancel');
    if (!id) return;
    try {
      const r = await fetch(API(`/api/hr/interviews/${id}/cancel`), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ cancellation_reason: 'Cancelled by HR' }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Interview cancelled' });
    } catch (e: any) {
      toast({ title: 'Cancel failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const feedback = async () => {
    const id = prompt('Interview ID for feedback');
    if (!id) return;
    try {
      const r = await fetch(API(`/api/hr/interviews/${id}/feedback`), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify({ overall_rating: 4, technical_assessment: {}, soft_skills_assessment: {}, recommendation: 'advance', overall_notes: notes }),
      });
      if (!r.ok) throw new Error(await r.text());
      toast({ title: 'Feedback submitted' });
    } catch (e: any) {
      toast({ title: 'Feedback failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const downloadICS = async () => {
    const id = prompt('Interview ID (UUID) to download ICS');
    if (!id) return;
    try {
      const r = await fetch(API(`/api/hr/interviews/${id}/ics`), { headers: H as any });
      if (!r.ok) throw new Error(await r.text());
      const text = await r.text();
      const blob = new Blob([text], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `interview_${id}.ics`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      toast({ title: 'ICS download failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  return (
    <div className="p-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Interview Scheduling</CardTitle>
          <CardDescription>Schedule/reschedule/cancel interviews and submit feedback</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Application ID</Label>
              <Input value={applicationId} onChange={e => setApplicationId(e.target.value)} placeholder="job_application UUID" />
            </div>
            <div>
              <Label>Interviewer ID</Label>
              <Input value={interviewerId} onChange={e => setInterviewerId(e.target.value)} placeholder="1" />
            </div>
            <div>
              <Label>Scheduled Date</Label>
              <Input type="datetime-local" value={scheduledDate} onChange={e => setScheduledDate(e.target.value)} />
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={duration} onChange={e => setDuration(e.target.value)} />
            </div>
            <div className="md:col-span-2">
              <Label>Notes</Label>
              <Textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} />
            </div>
          </div>
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={schedule}>Schedule</Button>
            <Button variant="outline" onClick={reschedule}>Reschedule</Button>
            <Button variant="outline" onClick={cancel}>Cancel</Button>
            <Button variant="outline" onClick={feedback}>Submit Feedback</Button>
            <Button variant="outline" onClick={downloadICS}>Download ICS</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
