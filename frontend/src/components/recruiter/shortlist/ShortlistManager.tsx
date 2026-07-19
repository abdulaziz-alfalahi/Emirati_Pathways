import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageComposer } from '../communication/MessageComposer';
import { ScheduleVideoInterviewDialog } from '../ScheduleVideoInterviewDialog';
import OfferManager from '../offers/OfferManager';
import CreateOfferDialog from '../offers/CreateOfferDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import {
  RefreshCw,
  CalendarDays,
  Send,
  Gift,
  Trash2,
  Mail,
  Phone,
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Info,
  Star,
  X,
  Users,
  Briefcase,
  Clock,

} from 'lucide-react';
import { restClient } from '@/utils/api';
import { getDisplayName, getPrefixedDisplayName } from '@/utils/nameUtils';
import { useAuth } from '@/context/AuthContext';

interface ShortlistedCandidate {
  shortlist_id: string;
  jd_id: string;
  candidate_id: string;
  recruiter_id: string;
  match_score: number;
  match_details: any;
  status: string;
  notes: string;
  tags: string[];
  contacted_at: string | null;
  interview_scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  current_job_title: string;
  current_company: string;
  years_of_experience: number;
  emirates_id: string;
  is_uae_national: boolean;
  interview_rating?: number;
  interview_recommendation?: string;
  interview_feedback?: string;
}

interface ShortlistStats {
  total: number;
  shortlisted: number;
  contacted: number;
  interview_scheduled: number;
  interviewed: number;
  offer_sent: number;
  hired: number;
  rejected: number;
  avg_match_score: number;
  interview_count?: number;
}

interface ShortlistManagerProps {
  jdId: string;
  onClose?: () => void;
}

const statusBadgeVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  shortlisted: 'default',
  contacted: 'secondary',
  interview_scheduled: 'outline',
  interviewed: 'secondary',
  offer_sent: 'default',
  hired: 'default',
  rejected: 'destructive',
  withdrawn: 'outline',
};

const statusBadgeClass: Record<string, string> = {
  shortlisted: 'bg-blue-500 hover:bg-blue-600',
  contacted: 'bg-purple-500 hover:bg-purple-600 text-white',
  interview_scheduled: 'border-amber-400 text-amber-700 bg-amber-50',
  interviewed: 'bg-amber-500 hover:bg-amber-600 text-white',
  offer_sent: 'bg-emerald-500 hover:bg-emerald-600',
  hired: 'bg-emerald-600 hover:bg-emerald-700',
  rejected: '',
  withdrawn: '',
};

const statusLabels: Record<string, string> = {
  shortlisted: 'Shortlisted',
  contacted: 'Contacted',
  interview_scheduled: 'Interview Scheduled',
  interviewed: 'Interviewed',
  offer_sent: 'Offer Sent',
  hired: 'Hired',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
};

export const ShortlistManager: React.FC<ShortlistManagerProps> = ({ jdId, onClose }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [shortlist, setShortlist] = useState<ShortlistedCandidate[]>([]);
  const [stats, setStats] = useState<ShortlistStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [newNote, setNewNote] = useState('');
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);

  const [interviewDialogOpen, setInterviewDialogOpen] = useState(false);
  const [selectedShortlistId, setSelectedShortlistId] = useState<string | null>(null);
  const [statusNotes, setStatusNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showOfferManager, setShowOfferManager] = useState(false);
  const [createOfferDialogOpen, setCreateOfferDialogOpen] = useState(false);
  const [selectedCandidateForOffer, setSelectedCandidateForOffer] = useState<ShortlistedCandidate | null>(null);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<number>(3);
  const [feedbackRecommendation, setFeedbackRecommendation] = useState<string>('next_round');
  const [feedbackNotes, setFeedbackNotes] = useState<string>('');
  const [viewInterviewsDialogOpen, setViewInterviewsDialogOpen] = useState(false);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [viewDetailsDialogOpen, setViewDetailsDialogOpen] = useState(false);
  const [selectedCandidateDetails, setSelectedCandidateDetails] = useState<ShortlistedCandidate | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<string | null>(null);
  const [cancelInterviewDialogOpen, setCancelInterviewDialogOpen] = useState(false);
  const [interviewToCancel, setInterviewToCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [interviewToReschedule, setInterviewToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  // ─── API Handlers ────────────────────────────────────────────────

  const handleCancelInterview = async () => {
    if (!interviewToCancel || !cancellationReason) return;
    try {
      const response = await restClient.post(
        `/api/recruiter/interviews/${interviewToCancel.interview_id}/cancel`,
        { reason: cancellationReason }
      );
      if (response.data?.success) {
        setSuccess('Interview cancelled successfully');
        setCancelInterviewDialogOpen(false);
        setCancellationReason('');
        setInterviewToCancel(null);
        handleViewInterviews();
      } else {
        setError(response.data?.error || 'Failed to cancel interview');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to cancel interview');
    }
  };

  const handleRescheduleInterview = async () => {
    if (!interviewToReschedule || !rescheduleDate || !rescheduleTime) return;
    try {
      const response = await restClient.put(
        `/api/recruiter/interviews/${interviewToReschedule.interview_id}`,
        { scheduled_date: rescheduleDate, scheduled_time: rescheduleTime }
      );
      if (response.data?.success) {
        setSuccess('Interview rescheduled successfully');
        setRescheduleDialogOpen(false);
        setInterviewToReschedule(null);
        handleViewInterviews();
      } else {
        setError(response.data?.error || 'Failed to reschedule interview');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reschedule interview');
    }
  };

  useEffect(() => {
    loadShortlist();
    loadStats();
  }, [jdId]);

  const loadShortlist = async () => {
    try {
      setLoading(true);
      const response = await restClient.get(`/api/recruiter/shortlist/${jdId}`);
      if (response.data?.success) {
        setShortlist(response.data.shortlist);
      } else {
        setError(response.data?.message || 'Failed to load shortlist');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/shortlist/${jdId}/stats`);
      if (response.data?.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedCandidate || !newStatus) return;
    try {
      const response = await restClient.put(
        `/api/recruiter/shortlist/${selectedCandidate.shortlist_id}/status`,
        { status: newStatus, notes: statusNotes }
      );
      if (response.data?.success) {
        setSuccess('Status updated successfully');
        setStatusDialogOpen(false);
        setNewStatus('');
        setStatusNotes('');
        loadShortlist();
        loadStats();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!selectedCandidate || !newNote.trim()) return;
    try {
      const response = await restClient.post(
        `/api/recruiter/shortlist/${selectedCandidate.shortlist_id}/notes`,
        { note: newNote, recruiter_id: user?.id?.toString() || '45' }
      );
      if (response.data?.success) {
        setSuccess('Note added successfully');
        setNoteDialogOpen(false);
        setNewNote('');
        loadShortlist();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add note');
    }
  };

  const handleCreateOfferForSelected = () => {
    if (selectedCandidates.length === 0) return;
    const candidate = shortlist.find(c => c.shortlist_id === selectedCandidates[0]);
    if (candidate) {
      setSelectedCandidateForOffer(candidate);
      setCreateOfferDialogOpen(true);
    }
  };

  const handleOpenFeedbackDialog = (candidate: ShortlistedCandidate) => {
    setSelectedCandidate(candidate);
    setFeedbackRating(candidate.interview_rating || 3);
    setFeedbackRecommendation(candidate.interview_recommendation || 'next_round');
    setFeedbackNotes(candidate.interview_feedback || '');
    setFeedbackDialogOpen(true);
  };

  const handleAddFeedback = async () => {
    if (!selectedCandidate) return;
    try {
      const interviewResponse = await restClient.get(`/api/recruiter/interviews/jd/${jdId}`);
      const interview = interviewResponse.data.interviews?.find(
        (i: any) => i.shortlist_id === selectedCandidate.shortlist_id
      );
      if (!interview) {
        setError('No interview found. Please schedule an interview first.');
        return;
      }
      await restClient.put(`/api/recruiter/interviews/${interview.interview_id}`, {
        rating: feedbackRating,
        recommendation: feedbackRecommendation,
        feedback: feedbackNotes,
      });
      setSuccess('Interview feedback added successfully!');
      setFeedbackDialogOpen(false);
      setFeedbackRating(3);
      setFeedbackRecommendation('next_round');
      setFeedbackNotes('');
      loadShortlist();
    } catch (err: any) {
      setError(err.message || 'Failed to add interview feedback');
    }
  };

  const handleViewInterviews = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/interviews/jd/${jdId}`);
      if (response.data?.success) {
        // Enrich interview data with candidate names from the shortlist
        const enriched = (response.data.interviews || []).map((interview: any) => {
          const match = shortlist.find(c => c.shortlist_id === interview.shortlist_id);
          return {
            ...interview,
            candidate_first_name: interview.candidate_first_name || match?.first_name || '',
            candidate_last_name: interview.candidate_last_name || match?.last_name || '',
          };
        });
        setInterviews(enriched);
        setViewInterviewsDialogOpen(true);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load interviews');
    }
  };

  const handleViewDetails = (candidate: ShortlistedCandidate) => {
    setSelectedCandidateDetails(candidate);
    setViewDetailsDialogOpen(true);
  };

  const handleRemoveFromShortlist = (shortlistId: string) => {
    if (!shortlistId) {
      setError('Cannot delete candidate (missing ID)');
      return;
    }
    setCandidateToDelete(shortlistId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!candidateToDelete) return;
    try {
      const response = await restClient.delete(`/api/recruiter/shortlist/${candidateToDelete}`);
      if (response.data?.success) {
        setSuccess('Candidate removed from shortlist');
        loadShortlist();
        loadStats();
      } else {
        setError(response.data?.message || 'Failed to remove candidate');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to remove candidate');
    } finally {
      setDeleteDialogOpen(false);
      setCandidateToDelete(null);
    }
  };

  // ─── Render ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Users className="h-6 w-6 text-emerald-600" />
              Shortlisted Candidates
            </h2>
            <p className="text-sm text-muted-foreground mt-1">JD ID: {jdId}</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => { loadShortlist(); loadStats(); }}>
              <RefreshCw className="h-4 w-4 me-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewInterviews}>
              <CalendarDays className="h-4 w-4 me-2" />
              View Interviews
            </Button>

            <Button
              size="sm"
              onClick={handleCreateOfferForSelected}
              disabled={selectedCandidates.length === 0}
            >
              <Gift className="h-4 w-4 me-2" />
              Create Offer ({selectedCandidates.length})
            </Button>
            <Button
              size="sm"
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
              onClick={() => setShowOfferManager(true)}
            >
              <Gift className="h-4 w-4 me-2" />
              Manage Offers
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription className="flex justify-between items-center">
              {error}
              <Button variant="ghost" size="sm" onClick={() => setError(null)}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}
        {success && (
          <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800">
            <AlertDescription className="flex justify-between items-center">
              {success}
              <Button variant="ghost" size="sm" onClick={() => setSuccess(null)}>
                <X className="h-4 w-4" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Total Shortlisted</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Contacted</p>
                <p className="text-3xl font-bold">{stats.contacted}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Interviews</p>
                <p className="text-3xl font-bold">{stats.interview_count || 0}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-sm text-muted-foreground">Avg Match Score</p>
                <p className="text-3xl font-bold">
                  {stats.avg_match_score ? Number(stats.avg_match_score).toFixed(1) : '0'}%
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Shortlist Table */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40px]" />
                  <TableHead>Candidate</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Current Role</TableHead>
                  <TableHead className="text-center">Match</TableHead>
                  <TableHead>Interview</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>UAE National</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shortlist && shortlist.length > 0 ? (
                  shortlist.map((candidate) => (
                    <TableRow key={candidate.shortlist_id} className="hover:bg-muted/50">
                      <TableCell>
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.shortlist_id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedCandidates([...selectedCandidates, candidate.shortlist_id]);
                            } else {
                              setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.shortlist_id));
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                            <span className="text-emerald-700 font-semibold text-sm">
                              {candidate.first_name?.[0]}{candidate.last_name?.[0]}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium">
                              {getDisplayName(candidate, 'Candidate')}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {candidate.years_of_experience || 0} yrs exp · ID: {candidate.shortlist_id}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-sm">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            <span className="truncate max-w-[180px]">{candidate.email || 'No email'}</span>
                          </div>
                          {candidate.phone_number && (
                            <div className="flex items-center gap-1 text-sm">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {candidate.phone_number}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{candidate.current_job_title || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">{candidate.current_company || 'N/A'}</p>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={parseFloat(candidate.match_score as any) >= 80 ? 'default' : 'outline'}
                          className={
                            parseFloat(candidate.match_score as any) >= 80
                              ? 'bg-emerald-500 hover:bg-emerald-600'
                              : parseFloat(candidate.match_score as any) >= 60
                                ? 'bg-blue-500 hover:bg-blue-600 text-white'
                                : ''
                          }
                        >
                          {parseFloat(candidate.match_score as any).toFixed(1)}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.interview_rating ? (
                          <div>
                            <span className="text-sm">⭐ {candidate.interview_rating}/5</span>
                            {candidate.interview_recommendation && (
                              <p className="text-xs text-muted-foreground">{candidate.interview_recommendation}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={statusBadgeVariant[candidate.status] || 'outline'}
                          className={statusBadgeClass[candidate.status] || ''}
                        >
                          {statusLabels[candidate.status] || candidate.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {candidate.is_uae_national ? (
                          <CheckCircle className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-gray-300" />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedShortlistId(candidate.shortlist_id);
                                  setInterviewDialogOpen(true);
                                }}
                              >
                                <Calendar className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Schedule Interview</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleOpenFeedbackDialog(candidate)}
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add Feedback</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  setNewStatus(candidate.status);
                                  setStatusDialogOpen(true);
                                }}
                              >
                                <Clock className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Update Status</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  setSelectedCandidate(candidate);
                                  setNoteDialogOpen(true);
                                }}
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add Note</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleViewDetails(candidate)}>
                                <Info className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View Details</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-blue-600 hover:text-blue-700"
                                onClick={async () => {
                                  if (user) {
                                    try {
                                      const response = await restClient.post('/api/communication/conversations', {
                                        participants: [String(user.id), candidate.candidate_id],
                                        title: 'Recruiter Chat',
                                        job_id: jdId,
                                        sender_role: 'recruiter',
                                      });
                                      if (response.data?.success) {
                                        const conversationId = response.data.data.id || response.data.data.conversation?.id;
                                        if (conversationId) {
                                          navigate(`/recruiter?tab=messages&conversationId=${conversationId}`);
                                        }
                                      }
                                    } catch (error) {
                                      console.error('Failed to start conversation:', error);
                                    }
                                  }
                                }}
                              >
                                <Send className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Message</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-500 hover:text-red-600"
                                onClick={() => handleRemoveFromShortlist(candidate.shortlist_id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Remove</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                      <p className="text-muted-foreground">No candidates in shortlist</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* ─── Dialogs ──────────────────────────────────────────── */}

        {/* Update Status Dialog */}
        <Dialog open={statusDialogOpen} onOpenChange={setStatusDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Candidate Status</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shortlisted">Shortlisted</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interview_scheduled">Interview Scheduled</SelectItem>
                    <SelectItem value="interviewed">Interviewed</SelectItem>
                    <SelectItem value="offer_sent">Offer Sent</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                    <SelectItem value="withdrawn">Withdrawn</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Notes (optional)</label>
                <Textarea
                  rows={3}
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleUpdateStatus}>Update</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Candidate</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove this candidate from the shortlist? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={confirmDelete}>
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Note Dialog */}
        <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Note</DialogTitle>
            </DialogHeader>
            <Textarea
              rows={4}
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Enter your notes about this candidate..."
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddNote}>Add Note</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>



        {/* Schedule Interview Dialog */}
        <ScheduleVideoInterviewDialog
          open={interviewDialogOpen}
          onOpenChange={(val) => {
            setInterviewDialogOpen(val);
            if (!val) setSelectedShortlistId(null);
          }}
          initialJobId={jdId}
          initialShortlistId={selectedShortlistId || undefined}
          onSuccess={() => {
            setSuccess('Interview scheduled successfully');
            loadShortlist();
          }}
        />

        {/* Offer Management Dialog */}
        <Dialog open={showOfferManager} onOpenChange={setShowOfferManager}>
          <DialogContent className="max-w-5xl max-h-[80vh] overflow-y-auto">
            <OfferManager jdId={jdId} onClose={() => setShowOfferManager(false)} />
          </DialogContent>
        </Dialog>

        {/* Interview Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Interview Feedback</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Rating (1-5)</label>
                <Select value={String(feedbackRating)} onValueChange={(v) => setFeedbackRating(Number(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 - Poor</SelectItem>
                    <SelectItem value="2">2 - Below Average</SelectItem>
                    <SelectItem value="3">3 - Average</SelectItem>
                    <SelectItem value="4">4 - Good</SelectItem>
                    <SelectItem value="5">5 - Excellent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Recommendation</label>
                <Select value={feedbackRecommendation} onValueChange={setFeedbackRecommendation}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hire">Hire</SelectItem>
                    <SelectItem value="reject">Reject</SelectItem>
                    <SelectItem value="next_round">Next Round</SelectItem>
                    <SelectItem value="hold">Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Feedback Notes</label>
                <Textarea
                  rows={4}
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Enter detailed feedback about the interview..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddFeedback} disabled={!feedbackNotes.trim()}>
                Save Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Create Offer Dialog */}
        {selectedCandidateForOffer && (
          <CreateOfferDialog
            open={createOfferDialogOpen}
            onClose={() => {
              setCreateOfferDialogOpen(false);
              setSelectedCandidateForOffer(null);
              setSelectedCandidates([]);
            }}
            jdId={jdId}
            preselectedCandidate={{
              shortlist_id: selectedCandidateForOffer.shortlist_id,
              candidate_id: selectedCandidateForOffer.candidate_id,
              name: getDisplayName(selectedCandidateForOffer),
              email: selectedCandidateForOffer.email,
            }}
            onOfferCreated={() => {
              setSuccess('Offer created successfully!');
              loadShortlist();
            }}
          />
        )}

        {/* View Interviews Dialog */}
        <Dialog open={viewInterviewsDialogOpen} onOpenChange={setViewInterviewsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Scheduled Interviews</DialogTitle>
            </DialogHeader>
            {interviews.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Recommendation</TableHead>
                    <TableHead className="text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {interviews.map((interview: any) => (
                    <TableRow key={interview.interview_id}>
                      <TableCell className="font-medium">
                        {getPrefixedDisplayName(interview, 'candidate_')}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{interview.interview_type}</Badge>
                      </TableCell>
                      <TableCell>
                        {interview.scheduled_date && (
                          <div>
                            <p className="text-sm">{new Date(interview.scheduled_date).toLocaleDateString()}</p>
                            <p className="text-xs text-muted-foreground">{interview.scheduled_time}</p>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={interview.status === 'completed' ? 'default' : interview.status === 'cancelled' ? 'destructive' : 'outline'}
                          className={interview.status === 'completed' ? 'bg-emerald-500' : ''}
                        >
                          {interview.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {interview.rating ? (
                          <span className="text-sm">⭐ {interview.rating}/5</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {interview.recommendation ? (
                          <Badge variant={interview.recommendation === 'hire' ? 'default' : 'outline'}
                            className={interview.recommendation === 'hire' ? 'bg-emerald-500' : ''}
                          >
                            {interview.recommendation}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            size="sm"
                            disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                            onClick={() => {
                              // Determine the video room URL
                              let videoUrl = '';
                              if (interview.meeting_link) {
                                // Use stored meeting link
                                videoUrl = interview.meeting_link;
                              } else if (interview.interview_type === 'video') {
                                // Generate video room URL from interview ID for legacy entries
                                videoUrl = `/recruiter/video-interview/${interview.interview_id}`;
                              }

                              if (videoUrl) {
                                // Extract the path from absolute URLs for SPA navigation
                                if (videoUrl.startsWith('http')) {
                                  try {
                                    const url = new URL(videoUrl);
                                    navigate(url.pathname);
                                  } catch {
                                    window.open(videoUrl, '_blank');
                                  }
                                } else {
                                  navigate(videoUrl);
                                }
                              } else {
                                // Non-video interview: navigate to Interviews tab
                                navigate(`/recruiter/interviews`);
                              }
                            }}
                          >
                            Join
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                            onClick={() => {
                              setInterviewToReschedule(interview);
                              setRescheduleDate(interview.scheduled_date);
                              setRescheduleTime(interview.scheduled_time);
                              setRescheduleDialogOpen(true);
                            }}
                          >
                            <Calendar className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500"
                            disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                            onClick={() => {
                              setInterviewToCancel(interview);
                              setCancelInterviewDialogOpen(true);
                            }}
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8">
                <CalendarDays className="h-12 w-12 mx-auto text-gray-300 mb-4" />
                <p className="text-muted-foreground">No interviews scheduled yet.</p>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Cancel Interview Dialog */}
        <Dialog open={cancelInterviewDialogOpen} onOpenChange={setCancelInterviewDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Cancel Interview</DialogTitle>
              <DialogDescription>
                Cancel the interview with {getPrefixedDisplayName(interviewToCancel, 'candidate_')}?
              </DialogDescription>
            </DialogHeader>
            <Input
              placeholder="Reason for cancellation"
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setCancelInterviewDialogOpen(false)}>Back</Button>
              <Button
                variant="destructive"
                onClick={handleCancelInterview}
                disabled={!cancellationReason.trim()}
              >
                Confirm Cancel
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reschedule Interview Dialog */}
        <Dialog open={rescheduleDialogOpen} onOpenChange={setRescheduleDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reschedule Interview</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">New Date</label>
                <Input type="date" value={rescheduleDate} onChange={(e) => setRescheduleDate(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">New Time</label>
                <Input type="time" value={rescheduleTime} onChange={(e) => setRescheduleTime(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleRescheduleInterview}>Reschedule</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Details Dialog */}
        <Dialog open={viewDetailsDialogOpen} onOpenChange={setViewDetailsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Candidate Details</DialogTitle>
            </DialogHeader>
            {selectedCandidateDetails && (
              <div className="space-y-4">
                {/* Basic Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Basic Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Name</p>
                        <p className="font-medium">{getDisplayName(selectedCandidateDetails)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Email</p>
                        <p className="font-medium">{selectedCandidateDetails.email}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedCandidateDetails.phone_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">UAE National</p>
                        <p className="font-medium">{selectedCandidateDetails.is_uae_national ? 'Yes' : 'No'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Professional */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Current Job Title</p>
                        <p className="font-medium">{selectedCandidateDetails.current_job_title || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Current Company</p>
                        <p className="font-medium">{selectedCandidateDetails.current_company || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Years of Experience</p>
                        <p className="font-medium">{selectedCandidateDetails.years_of_experience || 0} years</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Emirates ID</p>
                        <p className="font-medium">{selectedCandidateDetails.emirates_id || 'N/A'}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Shortlist Info */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Shortlist Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Match Score</p>
                        <p className="font-medium">{selectedCandidateDetails.match_score}%</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <Badge
                          variant={statusBadgeVariant[selectedCandidateDetails.status] || 'outline'}
                          className={statusBadgeClass[selectedCandidateDetails.status] || ''}
                        >
                          {statusLabels[selectedCandidateDetails.status] || selectedCandidateDetails.status}
                        </Badge>
                      </div>
                      <div className="col-span-2">
                        <p className="text-muted-foreground">Notes</p>
                        <p className="font-medium">{selectedCandidateDetails.notes || 'No notes available'}</p>
                      </div>
                      {selectedCandidateDetails.tags && selectedCandidateDetails.tags.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-muted-foreground mb-1">Tags</p>
                          <div className="flex flex-wrap gap-1">
                            {selectedCandidateDetails.tags.map((tag: string, idx: number) => (
                              <Badge key={idx} variant="outline">{tag}</Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Match Details */}
                {selectedCandidateDetails.match_details && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">Match Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="bg-muted p-3 rounded-md text-xs overflow-auto max-h-[200px]">
                        {JSON.stringify(selectedCandidateDetails.match_details, null, 2)}
                      </pre>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
};

export default ShortlistManager;
