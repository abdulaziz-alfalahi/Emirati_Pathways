import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MessageComposer } from '../communication/MessageComposer';
import CreateInterviewDialog from '../interviews/CreateInterviewDialog';
import OfferManager from '../offers/OfferManager';
import CreateOfferDialog from '../offers/CreateOfferDialog';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  Avatar,
  Tooltip,
  Alert,
} from '@mui/material';
import {
  Delete as DeleteIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Event as EventIcon,
  CalendarToday as CalendarIcon,
  CalendarMonth as CalendarMonthIcon,
  Notes as NotesIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Send as SendIcon,
  Close as CloseIcon,
  CardGiftcard as CardGiftcardIcon,
  RateReview as RateReviewIcon,
  Refresh as RefreshCw,
} from '@mui/icons-material';
// import axios from 'axios'; // Removed axios
import { restClient } from '@/utils/api';
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
  // Candidate details
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
  current_job_title: string;
  current_company: string;
  years_of_experience: number;
  emirates_id: string;
  is_uae_national: boolean;
  // Interview details
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

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  shortlisted: 'info',
  contacted: 'primary',
  interview_scheduled: 'secondary',
  interviewed: 'warning',
  offer_sent: 'success',
  hired: 'success',
  rejected: 'error',
  withdrawn: 'default',
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
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
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

  // New state for interview management
  const [cancelInterviewDialogOpen, setCancelInterviewDialogOpen] = useState(false);
  const [interviewToCancel, setInterviewToCancel] = useState<any>(null);
  const [cancellationReason, setCancellationReason] = useState('');

  const [rescheduleDialogOpen, setRescheduleDialogOpen] = useState(false);
  const [interviewToReschedule, setInterviewToReschedule] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');

  const handleCancelInterview = async () => {
    if (!interviewToCancel || !cancellationReason) return;

    try {
      const response = await restClient.post(
        `/api/recruiter/interviews/${interviewToCancel.interview_id}/cancel`,
        { reason: cancellationReason }
      );

      if (response.data && response.data.success) {
        setSuccess('Interview cancelled successfully');
        setCancelInterviewDialogOpen(false);
        setCancellationReason('');
        setInterviewToCancel(null);
        handleViewInterviews(); // Refresh list
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
        {
          scheduled_date: rescheduleDate,
          scheduled_time: rescheduleTime
        }
      );

      if (response.data && response.data.success) {
        setSuccess('Interview rescheduled successfully');
        setRescheduleDialogOpen(false);
        setInterviewToReschedule(null);
        // handleViewInterviews(); // Refresh list - wait, handleViewInterviews depends on state? It just calls API and sets state.
        // But handleViewInterviews uses `jdId` from props, which is available in closure.
        handleViewInterviews();
      } else {
        setError(response.data?.error || 'Failed to reschedule interview');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to reschedule interview');
    }
  };

  // API_BASE_URL is handled by restClient

  useEffect(() => {
    loadShortlist();
    loadStats();
  }, [jdId]);

  const loadShortlist = async () => {
    console.log('ShortlistManager: Loading shortlist for JD:', jdId);
    try {
      setLoading(true);
      const response = await restClient.get(`/api/recruiter/shortlist/${jdId}`);
      console.log('ShortlistManager: API Response:', response.data);

      // restClient returns { data: ..., success: ... } structure
      if (response.data && response.data.success) {
        setShortlist(response.data.shortlist);
        console.log('ShortlistManager: Set shortlist state:', response.data.shortlist);
      } else {
        // Handle cases where success might be false in the body
        console.warn('Shortlist load failed:', response.data);
        setError(response.data?.message || 'Failed to load shortlist');
      }
    } catch (err: any) {
      console.error('Load shortlist error:', err);
      setError(err.message || 'Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/shortlist/${jdId}/stats`);
      if (response.data && response.data.success) {
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
        {
          status: newStatus,
          notes: statusNotes,
        }
      );

      if (response.data && response.data.success) {
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
        {
          note: newNote,
          recruiter_id: user?.id?.toString() || '45',
        }
      );

      if (response.data && response.data.success) {
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

    // Get the first selected candidate
    const candidate = shortlist.find(c => c.shortlist_id === selectedCandidates[0]);
    if (candidate) {
      setSelectedCandidateForOffer(candidate);
      setCreateOfferDialogOpen(true);
    }
  };

  const handleOpenFeedbackDialog = (candidate: ShortlistedCandidate) => {
    setSelectedCandidate(candidate);
    // Pre-fill with existing feedback if available
    setFeedbackRating(candidate.interview_rating || 3);
    setFeedbackRecommendation(candidate.interview_recommendation || 'next_round');
    setFeedbackNotes(candidate.interview_feedback || '');
    setFeedbackDialogOpen(true);
  };

  const handleAddFeedback = async () => {
    if (!selectedCandidate) return;

    try {
      // Find the interview for this candidate
      const interviewResponse = await restClient.get(
        `/api/recruiter/interviews/jd/${jdId}`
      );

      const interview = interviewResponse.data.interviews?.find(
        (i: any) => i.shortlist_id === selectedCandidate.shortlist_id
      );

      if (!interview) {
        setError('No interview found for this candidate. Please schedule an interview first.');
        return;
      }

      // Update the interview with feedback
      await restClient.put(
        `/api/recruiter/interviews/${interview.interview_id}`,
        {
          rating: feedbackRating,
          recommendation: feedbackRecommendation,
          feedback: feedbackNotes
        }
      );

      setSuccess('Interview feedback added successfully!');
      setFeedbackDialogOpen(false);
      setFeedbackRating(3);
      setFeedbackRecommendation('next_round');
      setFeedbackNotes('');
      loadShortlist(); // Reload to show updated feedback
    } catch (err: any) {
      setError(err.message || 'Failed to add interview feedback');
    }
  };

  const handleViewInterviews = async () => {
    try {
      const response = await restClient.get(
        `/api/recruiter/interviews/jd/${jdId}`
      );

      if (response.data && response.data.success) {
        setInterviews(response.data.interviews || []);
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
    console.log('handleRemoveFromShortlist called with ID:', shortlistId);
    if (!shortlistId) {
      console.error('Error: shortlistId is missing!');
      setError('Error: Cannot delete candidate (missing ID)');
      return;
    }
    setCandidateToDelete(shortlistId);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!candidateToDelete) return;

    console.log('User confirmed delete. Sending DELETE request...');
    try {
      const response = await restClient.delete(
        `/api/recruiter/shortlist/${candidateToDelete}`
      );

      console.log('DELETE response:', response);

      if (response.data && response.data.success) {
        console.log('Delete successful');
        setSuccess('Candidate removed from shortlist');
        loadShortlist();
        loadStats();
      } else {
        console.error('Delete failed:', response.data);
        setError(response.data?.message || 'Failed to remove candidate');
      }
    } catch (err: any) {
      console.error('Delete error:', err);
      setError(err.message || 'Failed to remove candidate');
    } finally {
      setDeleteDialogOpen(false);
      setCandidateToDelete(null);
    }
  };

  if (loading) {
    return (
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Typography>Loading shortlist...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">
          Shortlisted Candidates
          <Typography variant="caption" display="block" color="textSecondary">
            JD ID: {jdId}
          </Typography>
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<RefreshCw />}
            onClick={() => {
              loadShortlist();
              loadStats();
            }}
          >
            Refresh
          </Button>
          <Button
            variant="outlined"
            startIcon={<CalendarMonthIcon />}
            onClick={handleViewInterviews}
          >
            View Interviews
          </Button>
          <Button
            variant="contained"
            startIcon={<SendIcon />}
            onClick={() => setMessageDialogOpen(true)}
            disabled={selectedCandidates.length === 0}
          >
            Message Selected ({selectedCandidates.length})
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<CardGiftcardIcon />}
            onClick={handleCreateOfferForSelected}
            disabled={selectedCandidates.length === 0}
          >
            Create Offer{selectedCandidates.length > 1 ? 's' : ''} ({selectedCandidates.length})
          </Button>
          <Button
            variant="contained"
            color="success"
            startIcon={<CardGiftcardIcon />}
            onClick={() => setShowOfferManager(true)}
          >
            Manage Offers
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" onClose={() => setSuccess(null)} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Total Shortlisted
                </Typography>
                <Typography variant="h4">{stats.total}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Contacted
                </Typography>
                <Typography variant="h4">{stats.contacted}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Interviews
                </Typography>
                <Typography variant="h4">{stats.interview_count || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Avg Match Score
                </Typography>
                <Typography variant="h4">
                  {stats.avg_match_score ? Number(stats.avg_match_score).toFixed(1) : '0'}%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Shortlist Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox"></TableCell>
              <TableCell>Candidate</TableCell>
              <TableCell>Contact</TableCell>
              <TableCell>Current Role</TableCell>
              <TableCell align="center">Match Score</TableCell>
              <TableCell>Interview</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>UAE National</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shortlist && shortlist.length > 0 && shortlist.map((candidate) => (
              <TableRow key={candidate.shortlist_id}>
                <TableCell padding="checkbox">
                  <input
                    type="checkbox"
                    checked={selectedCandidates.includes(candidate.shortlist_id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCandidates([...selectedCandidates, candidate.shortlist_id]);
                      } else {
                        setSelectedCandidates(selectedCandidates.filter(id => id !== candidate.shortlist_id));
                      }
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar>
                      {candidate.first_name?.[0]}
                      {candidate.last_name?.[0]}
                    </Avatar>
                    <Box>
                      <Typography variant="body1">
                        {candidate.first_name || 'Test'} {candidate.last_name || 'Candidate'}
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {candidate.years_of_experience || 0} years exp. | ID: {candidate.shortlist_id}
                      </Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Typography variant="body2">{candidate.email || 'No email'}</Typography>
                    </Box>
                    {candidate.phone_number && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <PhoneIcon fontSize="small" color="action" />
                        <Typography variant="body2">{candidate.phone_number}</Typography>
                      </Box>
                    )}
                  </Box>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">{candidate.current_job_title || 'N/A'}</Typography>
                  <Typography variant="caption" color="textSecondary">
                    {candidate.current_company || 'N/A'}
                  </Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip
                    label={`${parseFloat(candidate.match_score as any).toFixed(1)}%`}
                    color={parseFloat(candidate.match_score as any) >= 80 ? 'success' : parseFloat(candidate.match_score as any) >= 60 ? 'warning' : 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {candidate.interview_rating ? (
                    <Typography variant="body2">
                      ⭐ {candidate.interview_rating}/5
                      {candidate.interview_recommendation && (
                        <Typography variant="caption" display="block" color="textSecondary">
                          {candidate.interview_recommendation}
                        </Typography>
                      )}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="textSecondary">-</Typography>
                  )}
                </TableCell>
                <TableCell>
                  <Chip
                    label={statusLabels[candidate.status] || candidate.status}
                    color={statusColors[candidate.status] || 'default'}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {candidate.is_uae_national ? (
                    <CheckCircleIcon color="success" />
                  ) : (
                    <CancelIcon color="disabled" />
                  )}
                </TableCell>
                <TableCell align="right">
                  <Tooltip title="Schedule Interview">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => {
                        setSelectedShortlistId(candidate.shortlist_id);
                        setInterviewDialogOpen(true);
                      }}
                    >
                      <CalendarIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Interview Feedback">
                    <IconButton
                      size="small"
                      color="secondary"
                      onClick={() => handleOpenFeedbackDialog(candidate)}
                    >
                      <RateReviewIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Update Status">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setNewStatus(candidate.status);
                        setStatusDialogOpen(true);
                      }}
                    >
                      <EventIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add Note">
                    <IconButton
                      size="small"
                      onClick={() => {
                        setSelectedCandidate(candidate);
                        setNoteDialogOpen(true);
                      }}
                    >
                      <NotesIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton
                      size="small"
                      onClick={() => handleViewDetails(candidate)}
                    >
                      <InfoIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Message Candidate">
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={async () => {
                        if (user) {
                          try {
                            const response = await restClient.post('/api/communication/conversations', {
                              participants: [String(user.id), candidate.candidate_id],
                              title: 'Recruiter Chat'
                            });
                            if (response.data && response.data.success) {
                              const conversationId = response.data.data.id || response.data.data.conversation?.id;
                              if (conversationId) {
                                // Use window.location or navigate if available. 
                                // Since this component might be used where navigate isn't directly passed or available easily, 
                                // we should try to use a hook if possible. ShortlistManager doesn't utilize `useNavigate` yet.
                                // We need to add `useNavigate` hook first.
                                navigate(`/messages?conversationId=${conversationId}`);
                              }
                            }
                          } catch (error) {
                            console.error('Failed to start conversation:', error);
                          }
                        }
                      }}
                    >
                      <SendIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove from Shortlist">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleRemoveFromShortlist(candidate.shortlist_id)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
            {(!shortlist || shortlist.length === 0) && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">No candidates in shortlist</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Status Update Dialog */}
      <Dialog open={statusDialogOpen} onClose={() => setStatusDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Candidate Status</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} label="Status">
              <MenuItem value="shortlisted">Shortlisted</MenuItem>
              <MenuItem value="contacted">Contacted</MenuItem>
              <MenuItem value="interview_scheduled">Interview Scheduled</MenuItem>
              <MenuItem value="interviewed">Interviewed</MenuItem>
              <MenuItem value="offer_sent">Offer Sent</MenuItem>
              <MenuItem value="hired">Hired</MenuItem>
              <MenuItem value="rejected">Rejected</MenuItem>
              <MenuItem value="withdrawn">Withdrawn</MenuItem>
            </Select>
          </FormControl>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes (optional)"
            value={statusNotes}
            onChange={(e) => setStatusNotes(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setStatusDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleUpdateStatus} variant="contained">
            Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to remove this candidate from the shortlist? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Note Dialog */}
      <Dialog open={noteDialogOpen} onClose={() => setNoteDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Note"
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            sx={{ mt: 2 }}
            placeholder="Enter your notes about this candidate..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleAddNote} variant="contained">
            Add Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Message Composer Dialog */}
      <Dialog
        open={messageDialogOpen}
        onClose={() => setMessageDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>
          Send Message to Selected Candidates
          <IconButton
            aria-label="close"
            onClick={() => setMessageDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <MessageComposer
            candidates={shortlist
              .filter(c => selectedCandidates.includes(c.shortlist_id))
              .map(c => ({
                shortlist_id: c.shortlist_id,
                candidate_id: c.candidate_id,
                first_name: c.first_name || 'Test',
                last_name: c.last_name || 'Candidate',
                email: c.email || '',
                phone_number: c.phone_number,
              }))}
            jdId={jdId}
            recruiterId={user?.id?.toString() || "45"}
            onClose={() => setMessageDialogOpen(false)}
            onSent={() => {
              setMessageDialogOpen(false);
              setSelectedCandidates([]);
              loadShortlist();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Schedule Interview Dialog */}
      <CreateInterviewDialog
        open={interviewDialogOpen}
        onClose={() => {
          setInterviewDialogOpen(false);
          setSelectedShortlistId(null);
        }}
        jdId={jdId}
        shortlistId={selectedShortlistId || undefined}
        recruiterId={user?.id?.toString() || "45"}
        onSuccess={() => {
          setSuccess('Interview scheduled successfully');
          loadShortlist();
        }}
      />

      {/* Offer Management Dialog */}
      <Dialog
        open={showOfferManager}
        onClose={() => setShowOfferManager(false)}
        maxWidth="xl"
        fullWidth
      >
        <OfferManager
          jdId={jdId}
          onClose={() => setShowOfferManager(false)}
        />
      </Dialog>

      {/* Interview Feedback Dialog */}
      <Dialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add Interview Feedback</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Rating (1-5)</InputLabel>
              <Select
                value={feedbackRating}
                onChange={(e) => setFeedbackRating(Number(e.target.value))}
                label="Rating (1-5)"
              >
                <MenuItem value={1}>1 - Poor</MenuItem>
                <MenuItem value={2}>2 - Below Average</MenuItem>
                <MenuItem value={3}>3 - Average</MenuItem>
                <MenuItem value={4}>4 - Good</MenuItem>
                <MenuItem value={5}>5 - Excellent</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Recommendation</InputLabel>
              <Select
                value={feedbackRecommendation}
                onChange={(e) => setFeedbackRecommendation(e.target.value)}
                label="Recommendation"
              >
                <MenuItem value="hire">Hire</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
                <MenuItem value="next_round">Next Round</MenuItem>
                <MenuItem value="hold">Hold</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              multiline
              rows={4}
              label="Feedback Notes"
              value={feedbackNotes}
              onChange={(e) => setFeedbackNotes(e.target.value)}
              placeholder="Enter detailed feedback about the interview..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setFeedbackDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleAddFeedback}
            disabled={!feedbackNotes.trim()}
          >
            Save Feedback
          </Button>
        </DialogActions>
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
            name: `${selectedCandidateForOffer.first_name} ${selectedCandidateForOffer.last_name}`,
            email: selectedCandidateForOffer.email
          }}
          onOfferCreated={() => {
            setSuccess('Offer created successfully!');
            loadShortlist();
          }}
        />
      )}

      {/* View Interviews Dialog */}
      <Dialog
        open={viewInterviewsDialogOpen}
        onClose={() => setViewInterviewsDialogOpen(false)}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Scheduled Interviews</DialogTitle>
        <DialogContent>
          {interviews.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Candidate</TableCell>
                    <TableCell>Interview Type</TableCell>
                    <TableCell>Date & Time</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Rating</TableCell>
                    <TableCell>Recommendation</TableCell>
                    <TableCell>Feedback</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {interviews.map((interview: any) => (
                    <TableRow key={interview.interview_id}>
                      <TableCell>
                        {interview.candidate_first_name} {interview.candidate_last_name}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={interview.interview_type}
                          size="small"
                          color="primary"
                        />
                      </TableCell>
                      <TableCell>
                        {interview.scheduled_date && (
                          <Box>
                            <Typography variant="body2">
                              {new Date(interview.scheduled_date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="caption" color="textSecondary">
                              {interview.scheduled_time}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={interview.status}
                          size="small"
                          color={interview.status === 'completed' ? 'success' : interview.status === 'cancelled' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        {interview.rating ? (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Typography>⭐</Typography>
                            <Typography>{interview.rating}/5</Typography>
                          </Box>
                        ) : (
                          <Typography color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {interview.recommendation ? (
                          <Chip
                            label={interview.recommendation}
                            size="small"
                            color={interview.recommendation === 'hire' ? 'success' : 'default'}
                          />
                        ) : (
                          <Typography color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {interview.feedback ? (
                          <Tooltip title={interview.feedback}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}
                            >
                              {interview.feedback}
                            </Typography>
                          </Tooltip>
                        ) : (
                          <Typography color="textSecondary">-</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                          <Button
                            variant="contained"
                            size="small"
                            color="primary"
                            disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                            onClick={() => window.open(`/recruiter-dashboard?tab=interviews`, '_blank')}
                          >
                            Join
                          </Button>
                          <IconButton
                            size="small"
                            color="primary"
                            disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                            onClick={() => {
                              setInterviewToReschedule(interview);
                              setRescheduleDate(interview.scheduled_date);
                              setRescheduleTime(interview.scheduled_time);
                              setRescheduleDialogOpen(true);
                            }}
                          >
                            <EventIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            disabled={interview.status === 'completed' || interview.status === 'cancelled'}
                            onClick={() => {
                              setInterviewToCancel(interview);
                              setCancelInterviewDialogOpen(true);
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">
                No interviews scheduled for this job description yet.
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewInterviewsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Interview Dialog */}
      <Dialog open={cancelInterviewDialogOpen} onClose={() => setCancelInterviewDialogOpen(false)}>
        <DialogTitle>Cancel Interview</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to cancel the interview with {interviewToCancel?.candidate_first_name} {interviewToCancel?.candidate_last_name}?
          </Typography>
          <TextField
            fullWidth
            label="Reason for Cancellation"
            value={cancellationReason}
            onChange={(e) => setCancellationReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelInterviewDialogOpen(false)}>Back</Button>
          <Button
            onClick={handleCancelInterview}
            color="error"
            variant="contained"
            disabled={!cancellationReason.trim()}
          >
            Confirm Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Reschedule Interview Dialog */}
      <Dialog open={rescheduleDialogOpen} onClose={() => setRescheduleDialogOpen(false)}>
        <DialogTitle>Reschedule Interview</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="New Date"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={rescheduleDate}
              onChange={(e) => setRescheduleDate(e.target.value)}
            />
            <TextField
              label="New Time"
              type="time"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={rescheduleTime}
              onChange={(e) => setRescheduleTime(e.target.value)}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRescheduleDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRescheduleInterview} color="primary" variant="contained">
            Reschedule
          </Button>
        </DialogActions>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog
        open={viewDetailsDialogOpen}
        onClose={() => setViewDetailsDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Candidate Details
        </DialogTitle>
        <DialogContent>
          {selectedCandidateDetails && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                {/* Basic Information */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Basic Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Name
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.first_name} {selectedCandidateDetails.last_name}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Email
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Phone
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.phone_number || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            UAE National
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.is_uae_national ? 'Yes' : 'No'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Professional Information */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Professional Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Current Job Title
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.current_job_title || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Current Company
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.current_company || 'N/A'}
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Years of Experience
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.years_of_experience || 0} years
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Emirates ID
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.emirates_id || 'N/A'}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Shortlist Information */}
                <Grid item xs={12}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Shortlist Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Match Score
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.match_score}%
                          </Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" color="textSecondary">
                            Status
                          </Typography>
                          <Chip
                            label={selectedCandidateDetails.status}
                            size="small"
                            color={statusColors[selectedCandidateDetails.status] || 'default'}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <Typography variant="body2" color="textSecondary">
                            Notes
                          </Typography>
                          <Typography variant="body1">
                            {selectedCandidateDetails.notes || 'No notes available'}
                          </Typography>
                        </Grid>
                        {selectedCandidateDetails.tags && selectedCandidateDetails.tags.length > 0 && (
                          <Grid item xs={12}>
                            <Typography variant="body2" color="textSecondary" gutterBottom>
                              Tags
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                              {selectedCandidateDetails.tags.map((tag: string, index: number) => (
                                <Chip key={index} label={tag} size="small" />
                              ))}
                            </Box>
                          </Grid>
                        )}
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Match Details */}
                {selectedCandidateDetails.match_details && (
                  <Grid item xs={12}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Match Details
                        </Typography>
                        <Box sx={{
                          backgroundColor: '#f5f5f5',
                          p: 2,
                          borderRadius: 1,
                          maxHeight: 200,
                          overflow: 'auto'
                        }}>
                          <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                            {JSON.stringify(selectedCandidateDetails.match_details, null, 2)}
                          </pre>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewDetailsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ShortlistManager;

