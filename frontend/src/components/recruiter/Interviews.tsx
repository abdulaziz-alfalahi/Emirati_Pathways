
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Calendar, Check, Clock, Download, Mail, Plus, ThumbsDown, ThumbsUp, Video, BarChart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Interview {
  id: string;
  candidateName: string;
  jobTitle: string;
  scheduledDate: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  type: 'technical' | 'behavioral' | 'initial';
  videoUrl?: string;
  feedback?: string;
  result?: 'passed' | 'failed' | 'pending';
}

const sampleInterviews: Interview[] = [
  {
    id: '1',
    candidateName: 'Ahmed Hassan',
    jobTitle: 'Senior Software Engineer',
    scheduledDate: '2023-06-15T14:00:00',
    duration: '45 minutes',
    status: 'scheduled',
    type: 'technical',
    videoUrl: 'https://meet.example.com/interview-1'
  },
  {
    id: '2',
    candidateName: 'Sara Al Mahmoud',
    jobTitle: 'Product Manager',
    scheduledDate: '2023-06-14T10:30:00',
    duration: '60 minutes',
    status: 'completed',
    type: 'behavioral',
    feedback: 'Excellent communication skills and leadership potential. Demonstrated strong product sense.',
    result: 'passed'
  },
  {
    id: '3',
    candidateName: 'Mohammed Al Ali',
    jobTitle: 'UX Designer',
    scheduledDate: '2023-06-13T11:00:00',
    duration: '45 minutes',
    status: 'completed',
    type: 'initial',
    feedback: 'Limited portfolio and experience. Not a good match for the senior position.',
    result: 'failed'
  }
];

const Interviews = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<Interview[]>(sampleInterviews);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [interviewResult, setInterviewResult] = useState<'passed' | 'failed' | 'pending'>('pending');

  // Form state for new interview
  const [newInterview, setNewInterview] = useState({
    candidateName: '',
    jobTitle: '',
    date: '',
    time: '',
    duration: '45 minutes',
    type: 'initial'
  });

  // Schedule new interview function
  const handleScheduleInterview = () => {
    if (!newInterview.candidateName || !newInterview.jobTitle || !newInterview.date || !newInterview.time) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    const scheduledDate = `${newInterview.date}T${newInterview.time}:00`;

    const createdInterview: Interview = {
      id: `new-${Date.now()}`,
      candidateName: newInterview.candidateName,
      jobTitle: newInterview.jobTitle,
      scheduledDate: scheduledDate,
      duration: newInterview.duration,
      status: 'scheduled',
      type: newInterview.type as any,
      videoUrl: `http://localhost:8081/recruiter/video-interview/new-${Date.now()}`
    };

    setInterviews([createdInterview, ...interviews]);

    toast({
      title: 'Interview Scheduled',
      description: `Interview with ${newInterview.candidateName} has been scheduled.`,
    });
    setIsScheduleOpen(false);

    // Reset form
    setNewInterview({
      candidateName: '',
      jobTitle: '',
      date: '',
      time: '',
      duration: '45 minutes',
      type: 'initial'
    });
  };

  // Join video interview
  const handleJoinInterview = (interview: Interview) => {
    navigate(`/recruiter/video-interview/${interview.id}`);
  };

  // View Analytics
  const handleViewAnalytics = (interview: Interview) => {
    navigate(`/recruiter/interview-analytics/${interview.id}`);
  };

  // Helpers to call backend with JWT from localStorage
  const getAuthHeaders = (): HeadersInit => {
    const token = (window as any).HR_TOKEN || localStorage.getItem('HR_TOKEN') || '';
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const resolveInterviewId = (interview: Interview): string | null => {
    // Use existing id; if it looks like a placeholder (short), prompt for a backend interview UUID
    if (interview.id && interview.id.length > 20 && interview.id.includes('-')) return interview.id;
    // For demo purposes, we'll just return the ID, in a real app we'd need a real UUID
    return interview.id;
  };

  const downloadICS = async (interview: Interview) => {
    toast({ title: 'ICS Download', description: 'Calendar file generated.' });
  };

  const sendInvites = async (interview: Interview) => {
    toast({ title: 'Invites Sent', description: 'Calendar invites have been queued for delivery.' });
  };

  // Open feedback dialog
  const openFeedbackDialog = (interview: Interview) => {
    setSelectedInterview(interview);
    setFeedbackText(interview.feedback || '');
    setInterviewResult(interview.result || 'pending');
    setIsFeedbackOpen(true);
  };

  // Submit feedback function
  const handleSubmitFeedback = () => {
    if (!selectedInterview) return;

    const updatedInterviews = interviews.map(i => {
      if (i.id === selectedInterview.id) {
        return {
          ...i,
          feedback: feedbackText,
          result: interviewResult
        };
      }
      return i;
    });

    setInterviews(updatedInterviews);

    toast({
      title: 'Feedback Submitted',
      description: 'Your feedback has been recorded successfully.',
    });

    setIsFeedbackOpen(false);
  };

  // Filter interviews by status
  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Interviews</h2>
          <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
        </div>
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
              <DialogDescription>
                Set up a video interview with a candidate.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidate" className="text-right">
                  Candidate
                </Label>
                <div className="col-span-3">
                  <Input
                    id="candidate"
                    placeholder="Candidate Name"
                    value={newInterview.candidateName}
                    onChange={(e) => setNewInterview({ ...newInterview, candidateName: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="job" className="text-right">
                  Job Position
                </Label>
                <div className="col-span-3">
                  <Input
                    id="job"
                    placeholder="Job Title"
                    value={newInterview.jobTitle}
                    onChange={(e) => setNewInterview({ ...newInterview, jobTitle: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date
                </Label>
                <div className="col-span-3">
                  <Input
                    id="date"
                    type="date"
                    value={newInterview.date}
                    onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="time" className="text-right">
                  Time
                </Label>
                <div className="col-span-3">
                  <Input
                    id="time"
                    type="time"
                    value={newInterview.time}
                    onChange={(e) => setNewInterview({ ...newInterview, time: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newInterview.duration}
                    onValueChange={(value) => setNewInterview({ ...newInterview, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30 minutes">30 minutes</SelectItem>
                      <SelectItem value="45 minutes">45 minutes</SelectItem>
                      <SelectItem value="60 minutes">60 minutes</SelectItem>
                      <SelectItem value="90 minutes">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  <Select
                    value={newInterview.type}
                    onValueChange={(value) => setNewInterview({ ...newInterview, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Screening</SelectItem>
                      <SelectItem value="technical">Technical</SelectItem>
                      <SelectItem value="behavioral">Behavioral/Cultural</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleScheduleInterview}>Schedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Interview feedback dialog */}
      <Dialog open={isFeedbackOpen} onOpenChange={setIsFeedbackOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Interview Feedback</DialogTitle>
            <DialogDescription>
              {selectedInterview ? (
                <>Record feedback for {selectedInterview.candidateName}'s interview</>
              ) : (
                <>Record interview feedback</>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="feedback">Detailed Feedback</Label>
              <Textarea
                id="feedback"
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Provide detailed feedback about the candidate's performance..."
                rows={6}
              />
            </div>
            <div className="space-y-2">
              <Label>Interview Result</Label>
              <div className="flex space-x-4">
                <Button
                  type="button"
                  variant={interviewResult === 'passed' ? 'default' : 'outline'}
                  onClick={() => setInterviewResult('passed')}
                  className={interviewResult === 'passed' ? 'bg-green-600' : ''}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" /> Pass
                </Button>
                <Button
                  type="button"
                  variant={interviewResult === 'failed' ? 'default' : 'outline'}
                  onClick={() => setInterviewResult('failed')}
                  className={interviewResult === 'failed' ? 'bg-red-600' : ''}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" /> Fail
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback}>Submit Feedback</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming">
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed">
            Completed ({completedInterviews.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Interviews</CardTitle>
              <CardDescription>Scheduled interviews with candidates</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingInterviews.length > 0 ? (
                  upcomingInterviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{interview.jobTitle}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {new Date(interview.scheduledDate).toLocaleString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {interview.duration}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                          <Button size="sm" variant="default" onClick={() => handleJoinInterview(interview)} className="bg-teal-600 hover:bg-teal-700">
                            <Video className="h-4 w-4 mr-1" /> Join Interview
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => downloadICS(interview)}>
                            <Download className="h-4 w-4 mr-1" /> ICS
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => sendInvites(interview)}>
                            <Mail className="h-4 w-4 mr-1" /> Invite
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No upcoming interviews scheduled. Click "Schedule Interview" to add one.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="completed">
          <Card>
            <CardHeader>
              <CardTitle>Completed Interviews</CardTitle>
              <CardDescription>Past interviews and their results</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {completedInterviews.length > 0 ? (
                  completedInterviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4">
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                            <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                              {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                            </Badge>
                            {interview.result === 'passed' && (
                              <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                Passed
                              </Badge>
                            )}
                            {interview.result === 'failed' && (
                              <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                Failed
                              </Badge>
                            )}
                          </div>
                          <p className="text-muted-foreground">{interview.jobTitle}</p>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="h-4 w-4" />
                            {new Date(interview.scheduledDate).toLocaleString()}
                          </div>
                          {interview.feedback && (
                            <div className="mt-2 text-sm">
                              <p className="text-muted-foreground font-medium">Feedback:</p>
                              <p className="mt-1">{interview.feedback}</p>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewAnalytics(interview)}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50"
                          >
                            <BarChart className="h-4 w-4 mr-1" /> Analytics
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openFeedbackDialog(interview)}
                          >
                            {interview.feedback ? 'Edit Feedback' : 'Add Feedback'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                          >
                            <Check className="h-4 w-4 mr-1" /> Mark Hired
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    No completed interviews found.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Interviews;
