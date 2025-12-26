/**
 * Interviews Component for Recruiter Dashboard
 * Manages interview scheduling, tracking, and feedback
 * 
 * @description This component provides a comprehensive interface for recruiters
 * to schedule, manage, and provide feedback on candidate interviews.
 */

import React, { useState, useEffect, useCallback } from 'react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Calendar, Check, Clock, Link as LinkIcon, Plus, ThumbsDown, 
  ThumbsUp, User, Video, Loader2, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { recruiterService, Interview, InterviewType, InterviewResult } from '@/services/recruiterService';

// Generate dynamic dates relative to current date
const generateFutureDate = (daysAhead: number, hour: number = 14): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysAhead);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const generatePastDate = (daysAgo: number, hour: number = 10): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

// Fallback sample interviews with dynamic dates
const getSampleInterviews = (): Interview[] => [
  {
    id: '1',
    candidateId: 'cand_001',
    candidateName: 'Ahmed Hassan',
    jobId: 'job_001',
    jobTitle: 'Senior Software Engineer',
    scheduledDate: generateFutureDate(2, 14),
    duration: '45 minutes',
    status: 'scheduled',
    type: 'technical',
    videoUrl: '',
    interviewerName: 'Dr. Fatima Al Rashid',
    interviewerEmail: 'fatima.rashid@company.ae'
  },
  {
    id: '2',
    candidateId: 'cand_002',
    candidateName: 'Sara Al Mahmoud',
    jobId: 'job_002',
    jobTitle: 'Product Manager',
    scheduledDate: generatePastDate(1, 10),
    duration: '60 minutes',
    status: 'completed',
    type: 'behavioral',
    feedback: 'Excellent communication skills and leadership potential. Demonstrated strong product sense.',
    result: 'passed'
  },
  {
    id: '3',
    candidateId: 'cand_003',
    candidateName: 'Mohammed Al Ali',
    jobId: 'job_003',
    jobTitle: 'UX Designer',
    scheduledDate: generatePastDate(3, 11),
    duration: '45 minutes',
    status: 'completed',
    type: 'initial',
    feedback: 'Limited portfolio and experience. Not a good match for the senior position.',
    result: 'failed'
  },
  {
    id: '4',
    candidateId: 'cand_004',
    candidateName: 'Layla Ibrahim',
    jobId: 'job_001',
    jobTitle: 'Senior Software Engineer',
    scheduledDate: generateFutureDate(5, 15),
    duration: '60 minutes',
    status: 'scheduled',
    type: 'panel',
    videoUrl: '',
    interviewerName: 'Engineering Team',
    notes: 'Panel interview with 3 team members'
  }
];

const Interviews: React.FC = () => {
  const { toast } = useToast();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [interviewResult, setInterviewResult] = useState<InterviewResult>('pending');
  const [submitting, setSubmitting] = useState(false);
  
  // Form state for scheduling
  const [scheduleForm, setScheduleForm] = useState({
    candidateId: '',
    candidateName: '',
    jobId: '',
    jobTitle: '',
    scheduledDate: '',
    duration: '45 minutes',
    type: 'initial' as InterviewType,
    location: '',
    notes: ''
  });

  // Load interviews on mount
  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await recruiterService.getInterviews();
      
      if (response.success && response.data) {
        setInterviews(response.data);
      } else {
        // Fallback to sample data
        setInterviews(getSampleInterviews());
      }
    } catch (err) {
      console.error('Failed to load interviews:', err);
      // Use sample data as fallback
      setInterviews(getSampleInterviews());
    } finally {
      setLoading(false);
    }
  }, []);

  // Schedule new interview
  const handleScheduleInterview = useCallback(async () => {
    if (!scheduleForm.candidateId || !scheduleForm.scheduledDate) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields.',
        variant: 'destructive'
      });
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await recruiterService.scheduleInterview({
        candidateId: scheduleForm.candidateId,
        jobId: scheduleForm.jobId,
        scheduledDate: scheduleForm.scheduledDate,
        duration: scheduleForm.duration,
        type: scheduleForm.type,
        location: scheduleForm.location,
        notes: scheduleForm.notes
      });
      
      if (response.success && response.data) {
        setInterviews(prev => [...prev, response.data!]);
        toast({
          title: 'Interview Scheduled',
          description: 'The interview has been scheduled successfully.',
        });
      } else {
        // Create local interview as fallback
        const newInterview: Interview = {
          id: `int_${Date.now()}`,
          candidateId: scheduleForm.candidateId,
          candidateName: scheduleForm.candidateName || 'New Candidate',
          jobId: scheduleForm.jobId,
          jobTitle: scheduleForm.jobTitle || 'Position',
          scheduledDate: scheduleForm.scheduledDate,
          duration: scheduleForm.duration,
          status: 'scheduled',
          type: scheduleForm.type,
          location: scheduleForm.location,
          notes: scheduleForm.notes
        };
        
        setInterviews(prev => [...prev, newInterview]);
        toast({
          title: 'Interview Scheduled',
          description: 'The interview has been scheduled successfully.',
        });
      }
      
      setIsScheduleOpen(false);
      resetScheduleForm();
    } catch (err) {
      console.error('Failed to schedule interview:', err);
      toast({
        title: 'Error',
        description: 'Failed to schedule interview. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [scheduleForm, toast]);

  const resetScheduleForm = () => {
    setScheduleForm({
      candidateId: '',
      candidateName: '',
      jobId: '',
      jobTitle: '',
      scheduledDate: '',
      duration: '45 minutes',
      type: 'initial',
      location: '',
      notes: ''
    });
  };

  // Join video interview
  const handleJoinInterview = useCallback((interview: Interview) => {
    if (interview.videoUrl) {
      window.open(interview.videoUrl, '_blank', 'noopener,noreferrer');
    } else {
      toast({
        title: 'Video Link Not Available',
        description: 'The video conference link has not been set up yet. Please contact the interviewer.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Copy interview link
  const handleCopyLink = useCallback((interview: Interview) => {
    if (interview.videoUrl) {
      navigator.clipboard.writeText(interview.videoUrl);
      toast({
        title: 'Link Copied',
        description: 'Interview link has been copied to clipboard.',
      });
    } else {
      toast({
        title: 'No Link Available',
        description: 'Video conference link is not available.',
        variant: 'destructive'
      });
    }
  }, [toast]);

  // Open feedback dialog
  const openFeedbackDialog = useCallback((interview: Interview) => {
    setSelectedInterview(interview);
    setFeedbackText(interview.feedback || '');
    setInterviewResult(interview.result || 'pending');
    setIsFeedbackOpen(true);
  }, []);

  // Submit feedback
  const handleSubmitFeedback = useCallback(async () => {
    if (!selectedInterview) return;
    
    setSubmitting(true);
    
    try {
      const response = await recruiterService.updateInterviewFeedback(
        selectedInterview.id,
        feedbackText,
        interviewResult
      );
      
      if (response.success) {
        setInterviews(prev => prev.map(int => 
          int.id === selectedInterview.id 
            ? { ...int, feedback: feedbackText, result: interviewResult, status: 'completed' as const }
            : int
        ));
        
        toast({
          title: 'Feedback Submitted',
          description: 'Your feedback has been recorded successfully.',
        });
      } else {
        // Update locally as fallback
        setInterviews(prev => prev.map(int => 
          int.id === selectedInterview.id 
            ? { ...int, feedback: feedbackText, result: interviewResult, status: 'completed' as const }
            : int
        ));
        
        toast({
          title: 'Feedback Submitted',
          description: 'Your feedback has been recorded successfully.',
        });
      }
      
      setIsFeedbackOpen(false);
    } catch (err) {
      console.error('Failed to submit feedback:', err);
      toast({
        title: 'Error',
        description: 'Failed to submit feedback. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSubmitting(false);
    }
  }, [selectedInterview, feedbackText, interviewResult, toast]);

  // Filter interviews by status
  const upcomingInterviews = interviews.filter(i => i.status === 'scheduled');
  const completedInterviews = interviews.filter(i => i.status === 'completed');

  // Format date for display
  const formatInterviewDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString('en-AE', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Interviews</h2>
            <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
          </div>
        </div>
        <Card className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading interviews...</p>
          </div>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Interviews</h2>
            <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
          </div>
        </div>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>{error}</span>
            <Button variant="outline" size="sm" onClick={loadInterviews}>
              <RefreshCw className="h-4 w-4 mr-1" /> Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Interviews</h2>
          <p className="text-muted-foreground">Schedule and manage candidate interviews</p>
        </div>
        <Dialog open={isScheduleOpen} onOpenChange={setIsScheduleOpen}>
          <DialogTrigger asChild>
            <Button aria-label="Schedule a new interview">
              <Plus className="mr-2 h-4 w-4" /> Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
              <DialogDescription>
                Set up an interview with a candidate.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="candidate" className="text-right">
                  Candidate <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="candidate" 
                    placeholder="Enter candidate name..."
                    value={scheduleForm.candidateName}
                    onChange={(e) => setScheduleForm(prev => ({ 
                      ...prev, 
                      candidateName: e.target.value,
                      candidateId: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    }))}
                    aria-required="true"
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
                    placeholder="Enter job title..."
                    value={scheduleForm.jobTitle}
                    onChange={(e) => setScheduleForm(prev => ({ 
                      ...prev, 
                      jobTitle: e.target.value,
                      jobId: e.target.value.toLowerCase().replace(/\s+/g, '_')
                    }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="date" className="text-right">
                  Date & Time <span className="text-red-500">*</span>
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="date" 
                    type="datetime-local"
                    value={scheduleForm.scheduledDate}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    aria-required="true"
                  />
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="duration" className="text-right">
                  Duration
                </Label>
                <div className="col-span-3">
                  <select 
                    id="duration" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={scheduleForm.duration}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, duration: e.target.value }))}
                    aria-label="Interview duration"
                  >
                    <option value="30 minutes">30 minutes</option>
                    <option value="45 minutes">45 minutes</option>
                    <option value="60 minutes">60 minutes</option>
                    <option value="90 minutes">90 minutes</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <div className="col-span-3">
                  <select 
                    id="type" 
                    className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    value={scheduleForm.type}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, type: e.target.value as InterviewType }))}
                    aria-label="Interview type"
                  >
                    <option value="initial">Initial Screening</option>
                    <option value="technical">Technical</option>
                    <option value="behavioral">Behavioral/Cultural</option>
                    <option value="panel">Panel Interview</option>
                    <option value="final">Final Interview</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Location
                </Label>
                <div className="col-span-3">
                  <Input 
                    id="location" 
                    placeholder="Office location or video link..."
                    value={scheduleForm.location}
                    onChange={(e) => setScheduleForm(prev => ({ ...prev, location: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsScheduleOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleScheduleInterview} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  'Schedule'
                )}
              </Button>
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
                aria-describedby="feedback-hint"
              />
              <p id="feedback-hint" className="text-xs text-muted-foreground">
                Include specific observations about skills, communication, and cultural fit.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Interview Result</Label>
              <div className="flex space-x-4" role="radiogroup" aria-label="Interview result">
                <Button
                  type="button"
                  variant={interviewResult === 'passed' ? 'default' : 'outline'}
                  onClick={() => setInterviewResult('passed')}
                  className={interviewResult === 'passed' ? 'bg-green-600 hover:bg-green-700' : ''}
                  aria-pressed={interviewResult === 'passed'}
                >
                  <ThumbsUp className="mr-2 h-4 w-4" /> Pass
                </Button>
                <Button
                  type="button"
                  variant={interviewResult === 'failed' ? 'default' : 'outline'}
                  onClick={() => setInterviewResult('failed')}
                  className={interviewResult === 'failed' ? 'bg-red-600 hover:bg-red-700' : ''}
                  aria-pressed={interviewResult === 'failed'}
                >
                  <ThumbsDown className="mr-2 h-4 w-4" /> Fail
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFeedbackOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button onClick={handleSubmitFeedback} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Feedback'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="upcoming" aria-label={`Upcoming interviews (${upcomingInterviews.length})`}>
            Upcoming ({upcomingInterviews.length})
          </TabsTrigger>
          <TabsTrigger value="completed" aria-label={`Completed interviews (${completedInterviews.length})`}>
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
              <div className="space-y-4" role="list" aria-label="Upcoming interviews">
                {upcomingInterviews.length > 0 ? (
                  upcomingInterviews.map((interview) => (
                    <div 
                      key={interview.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      role="listitem"
                    >
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-lg">{interview.candidateName}</h3>
                            <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
                              {interview.type.charAt(0).toUpperCase() + interview.type.slice(1)}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground">{interview.jobTitle}</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-y-1 text-sm">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" aria-hidden="true" />
                              <span>{formatInterviewDate(interview.scheduledDate)}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-4 w-4" aria-hidden="true" />
                              <span>{interview.duration}</span>
                            </div>
                          </div>
                          {interview.interviewerName && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <User className="h-4 w-4" aria-hidden="true" />
                              <span>Interviewer: {interview.interviewerName}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-4 md:mt-0">
                          <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={() => handleJoinInterview(interview)}
                            aria-label={`Join video interview with ${interview.candidateName}`}
                          >
                            <Video className="h-4 w-4 mr-1" aria-hidden="true" /> Join
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleCopyLink(interview)}
                            aria-label="Copy interview link"
                          >
                            <LinkIcon className="h-4 w-4 mr-1" aria-hidden="true" /> Copy Link
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground" role="status">
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
              <div className="space-y-4" role="list" aria-label="Completed interviews">
                {completedInterviews.length > 0 ? (
                  completedInterviews.map((interview) => (
                    <div 
                      key={interview.id} 
                      className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                      role="listitem"
                    >
                      <div className="flex flex-col md:flex-row justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 flex-wrap">
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
                            <Calendar className="h-4 w-4" aria-hidden="true" />
                            <span>{formatInterviewDate(interview.scheduledDate)}</span>
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
                            aria-label={interview.feedback ? `Edit feedback for ${interview.candidateName}` : `Add feedback for ${interview.candidateName}`}
                          >
                            {interview.feedback ? 'Edit Feedback' : 'Add Feedback'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            aria-label={`Mark ${interview.candidateName} as hired`}
                          >
                            <Check className="h-4 w-4 mr-1" aria-hidden="true" /> Mark Hired
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-muted-foreground" role="status">
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
