import React, { useState, useEffect } from 'react';
import { MessageComposer } from '../communication/MessageComposer';
import CreateInterviewDialog from '../interviews/CreateInterviewDialog';
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
  Notes as NotesIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Info as InfoIcon,
  Send as SendIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import axios from 'axios';

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

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003';

  useEffect(() => {
    loadShortlist();
    loadStats();
  }, [jdId]);

  const loadShortlist = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_BASE_URL}/api/recruiter/shortlist/${jdId}`);
      if (response.data.success) {
        setShortlist(response.data.shortlist);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load shortlist');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recruiter/shortlist/${jdId}/stats`);
      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to load stats:', err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedCandidate || !newStatus) return;

    try {
      const response = await axios.put(
        `${API_BASE_URL}/api/recruiter/shortlist/${selectedCandidate.shortlist_id}/status`,
        {
          status: newStatus,
          notes: statusNotes,
        }
      );

      if (response.data.success) {
        setSuccess('Status updated successfully');
        setStatusDialogOpen(false);
        setNewStatus('');
        setStatusNotes('');
        loadShortlist();
        loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update status');
    }
  };

  const handleAddNote = async () => {
    if (!selectedCandidate || !newNote.trim()) return;

    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/recruiter/shortlist/${selectedCandidate.shortlist_id}/notes`,
        {
          note: newNote,
          recruiter_id: 'current_recruiter', // TODO: Get from auth context
        }
      );

      if (response.data.success) {
        setSuccess('Note added successfully');
        setNoteDialogOpen(false);
        setNewNote('');
        loadShortlist();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to add note');
    }
  };

  const handleRemoveFromShortlist = async (shortlistId: string) => {
    if (!window.confirm('Are you sure you want to remove this candidate from the shortlist?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${API_BASE_URL}/api/recruiter/shortlist/${shortlistId}`
      );

      if (response.data.success) {
        setSuccess('Candidate removed from shortlist');
        loadShortlist();
        loadStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to remove candidate');
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
        </Typography>
        <Button
          variant="contained"
          startIcon={<SendIcon />}
          onClick={() => setMessageDialogOpen(true)}
          disabled={selectedCandidates.length === 0}
        >
          Message Selected ({selectedCandidates.length})
        </Button>
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
                <Typography variant="h4">{stats.interview_scheduled}</Typography>
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
                  {stats.avg_match_score ? parseFloat(stats.avg_match_score).toFixed(1) : '0'}%
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
              <TableCell>Status</TableCell>
              <TableCell>UAE National</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {shortlist && shortlist.length > 0 ? shortlist.map((candidate) => (
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
                        {candidate.years_of_experience || 0} years exp.
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
                    label={`${parseFloat(candidate.match_score).toFixed(1)}%`}
                    color={parseFloat(candidate.match_score) >= 80 ? 'success' : parseFloat(candidate.match_score) >= 60 ? 'warning' : 'default'}
                    size="small"
                  />
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
                    <IconButton size="small">
                      <InfoIcon />
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
            )) : (
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
            recruiterId="recruiter_001"
            onClose={() => setMessageDialogOpen(false)}
            onSent={() => {
              setMessageDialogOpen(false);
              setSelectedCandidates([]);
              fetchShortlist();
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
        recruiterId="recruiter_001"
        onSuccess={() => {
          setSuccess('Interview scheduled successfully');
          fetchShortlist();
        }}
      />
    </Box>
  );
};

export default ShortlistManager;

