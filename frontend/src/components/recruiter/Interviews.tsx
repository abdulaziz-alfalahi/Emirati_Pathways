
import React, { useState } from 'react';
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
import { Calendar, Check, Clock, Link as LinkIcon, Plus, ThumbsDown, ThumbsUp, User, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

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
  const [interviews] = useState<Interview[]>(sampleInterviews);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [interviewResult, setInterviewResult] = useState<'passed' | 'failed' | 'pending'>('pending');

  // Schedule new interview function
  const handleScheduleInterview = () => {
    toast({
      title: 'Feature in Development',
      description: 'Interview scheduling functionality will be implemented soon.',
    });
    setIsScheduleOpen(false);
  };

  // Join video interview
  const handleJoinInterview = (interview: Interview) => {
    if (interview.videoUrl) {
      window.open(interview.videoUrl, '_blank');
    } else {
      toast({
        title: 'Video Link Unavailable',
        description: 'The video conference link is not available.',
        variant: 'destructive'
      });
    }
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
    
    // In a real application, this would update the database
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
                  <Input id="candidate" placeholder="Select candidate..." />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="job" className="text-right">
                  Job Position
                </Label>
                <div className="col-span-3">
                  <Input id="job" placeholder="Select job..." />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date & Time
                </Label>
                <div className="col-span-3">
                  <Input id="date" type="datetime-local" />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <div className="col-span-3">
                  <select id="duration" className="w-full p-2 border rounded">
                    <option>30 minutes</option>
                    <option>45 minutes</option>
                    <option>60 minutes</option>
                    <option>90 minutes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  <select id="type" className="w-full p-2 border rounded">
                    <option value="initial">Initial Screening</option>
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral/Cultural</option>
                  </select>
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
                          <Button size="sm" variant="outline" onClick={() => handleJoinInterview(interview)}>
                            <Video className="h-4 w-4 mr-1" /> Join Interview
                          </Button>
                          <Button size="sm" variant="outline">
                            <LinkIcon className="h-4 w-4 mr-1" /> Copy Link
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
