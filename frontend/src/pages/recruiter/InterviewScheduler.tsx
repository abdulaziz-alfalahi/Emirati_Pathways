import React, { useEffect, useMemo, useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import VideoInterviewRoom from '@/components/recruiter/interviews/VideoInterviewRoom';
import { restClient } from '@/utils/api';

const API = (p: string) => `http://127.0.0.1:5005${p}`;

export default function InterviewSchedulerPage() {
  const { toast } = useToast();
  const [applicationId, setApplicationId] = useState('');
  const [interviewerId, setInterviewerId] = useState('1');
  const [scheduledDate, setScheduledDate] = useState('');
  const [duration, setDuration] = useState('60');
  const [notes, setNotes] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [showVideoRoom, setShowVideoRoom] = useState(false);

  const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
  const H = useMemo(() => (token ? { Authorization: `Bearer ${token}` } : {}), [token]);

  const schedule = async () => {
    try {
      // Use the advanced video interview endpoint
      const body = {
        application_id: applicationId,
        scheduled_time: scheduledDate, // Note: backend expects scheduled_time
        duration_minutes: Number(duration),
        notes,
      };

      const r = await fetch(API('/api/video-interview/schedule'), {
        method: 'POST',
        headers: { ...(H as any), 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!r.ok) throw new Error(await r.text());

      const data = await r.json();
      toast({
        title: 'Video Interview Scheduled',
        description: `Session ID: ${data.session_id}`
      });

      // Auto-fill session ID for immediate joining (demo convenience)
      setActiveSessionId(data.session_id);
    } catch (e: any) {
      toast({ title: 'Schedule failed', description: e?.message || 'Error', variant: 'destructive' });
    }
  };

  const startInterview = () => {
    if (!activeSessionId) {
      const id = prompt('Enter Session ID to join:');
      if (id) {
        setActiveSessionId(id);
        setShowVideoRoom(true);
      }
    } else {
      setShowVideoRoom(true);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>AI Video Interview Scheduler</CardTitle>
          <CardDescription>Schedule advanced video interviews with real-time AI analysis</CardDescription>
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
            <Button onClick={schedule} className="bg-teal-600 hover:bg-teal-700">
              Schedule Video Interview
            </Button>
            <Button variant="outline" onClick={startInterview}>
              Join Interview Room
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showVideoRoom} onOpenChange={setShowVideoRoom}>
        <DialogContent className="max-w-6xl h-[80vh] p-0 bg-slate-950 border-slate-800">
          {activeSessionId && (
            <VideoInterviewRoom
              sessionId={activeSessionId}
              onEnd={() => setShowVideoRoom(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
