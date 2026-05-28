import React, { useState, useEffect } from 'react';
import { ScheduleVideoInterviewDialog } from '../ScheduleVideoInterviewDialog';
import InterviewFeedbackDialog from './InterviewFeedbackDialog';
import {
  Box,
  Paper,
  Typography,
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
  Chip,
  IconButton,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  VideoCall as VideoIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Feedback as FeedbackIcon,
} from '@mui/icons-material';
import { restClient } from '@/utils/api';

interface Interview {
  interview_id: string;
  shortlist_id: string;
  candidate_id: string;
  interview_type: string;
  interview_title: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  confirmation_status: string;
  meeting_link?: string;
  location?: string;
  notes?: string;
  rating?: number;
  recommendation?: string;
  feedback?: string;
}

interface InterviewStats {
  total_interviews: number;
  scheduled: number;
  confirmed: number;
  completed: number;
  cancelled: number;
  avg_rating: number;
  recommendations: {
    hire: number;
    reject: number;
    next_round: number;
    hold: number;
  };
}

interface InterviewSchedulerProps {
  jdId: string;
  recruiterId?: string;
}

export const InterviewScheduler: React.FC<InterviewSchedulerProps> = ({
  jdId,
  recruiterId = 'recruiter_001',
}) => {
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [stats, setStats] = useState<InterviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState(0);

  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState<Interview | null>(null);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

  useEffect(() => {
    fetchInterviews();
    fetchStats();
  }, [jdId]);

  const fetchInterviews = async (status?: string) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.append('status', status);

      const response = await restClient.get(
        `${API_BASE_URL}/api/recruiter/interviews/jd/${jdId}?${params.toString()}`
      );

      if (response.data.success) {
        setInterviews(response.data.interviews);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch interviews');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await restClient.get(
        `${API_BASE_URL}/api/recruiter/interviews/stats/${jdId}`
      );

      if (response.data.success) {
        setStats(response.data.stats);
      }
    } catch (err: any) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTab(newValue);
    const statusMap = ['', 'scheduled', 'confirmed', 'completed'];
    fetchInterviews(statusMap[newValue]);
  };

  const handleConfirmInterview = async (interviewId: string) => {
    try {
      const response = await restClient.post(
        `${API_BASE_URL}/api/recruiter/interviews/${interviewId}/confirm`,
        { confirmation_status: 'confirmed' }
      );

      if (response.data.success) {
        setSuccess('Interview confirmed successfully');
        fetchInterviews();
        fetchStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to confirm interview');
    }
  };

  const handleCancelInterview = async (interviewId: string) => {
    const reason = prompt('Please provide a reason for cancellation:');
    if (!reason) return;

    try {
      const response = await restClient.post(
        `${API_BASE_URL}/api/recruiter/interviews/${interviewId}/cancel`,
        { cancellation_reason: reason }
      );

      if (response.data.success) {
        setSuccess('Interview cancelled successfully');
        fetchInterviews();
        fetchStats();
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel interview');
    }
  };

  const handleOpenFeedback = (interview: Interview) => {
    setSelectedInterview(interview);
    setFeedbackDialogOpen(true);
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, 'default' | 'primary' | 'success' | 'error' | 'warning'> = {
      scheduled: 'primary',
      confirmed: 'success',
      completed: 'default',
      cancelled: 'error',
      rescheduled: 'warning',
    };
    return colors[status] || 'default';
  };

  const getInterviewTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <VideoIcon />;
      case 'phone':
        return <PhoneIcon />;
      case 'in_person':
        return <LocationIcon />;
      case 'panel':
        return <PeopleIcon />;
      default:
        return <EventIcon />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Interview Scheduler</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Schedule Interview
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
                  Total Interviews
                </Typography>
                <Typography variant="h4">{stats.total_interviews}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Scheduled
                </Typography>
                <Typography variant="h4">{stats.scheduled}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Confirmed
                </Typography>
                <Typography variant="h4">{stats.confirmed}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Completed
                </Typography>
                <Typography variant="h4">{stats.completed}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 2 }}>
        <Tabs value={selectedTab} onChange={handleTabChange}>
          <Tab label="All" />
          <Tab label="Scheduled" />
          <Tab label="Confirmed" />
          <Tab label="Completed" />
        </Tabs>
      </Paper>

      {/* Interviews Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Type</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Date & Time</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Confirmation</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {interviews.length > 0 ? (
              interviews.map((interview) => (
                <TableRow key={interview.interview_id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {getInterviewTypeIcon(interview.interview_type)}
                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                        {interview.interview_type.replace('_', ' ')}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{interview.interview_title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">
                      {new Date(interview.scheduled_date).toLocaleDateString()}
                    </Typography>
                    <Typography variant="caption" color="textSecondary">
                      {interview.scheduled_time}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{interview.duration_minutes} min</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={interview.status}
                      color={getStatusColor(interview.status)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={interview.confirmation_status}
                      variant="outlined"
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {interview.status === 'scheduled' && (
                        <IconButton
                          size="small"
                          color="success"
                          onClick={() => handleConfirmInterview(interview.interview_id)}
                          title="Confirm"
                        >
                          <CheckCircleIcon />
                        </IconButton>
                      )}
                      {interview.status === 'confirmed' && (
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenFeedback(interview)}
                          title="Add Feedback"
                        >
                          <FeedbackIcon />
                        </IconButton>
                      )}
                      {interview.status !== 'completed' && interview.status !== 'cancelled' && (
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleCancelInterview(interview.interview_id)}
                          title="Cancel"
                        >
                          <CancelIcon />
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="textSecondary">No interviews found</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create Interview Dialog */}
      <ScheduleVideoInterviewDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        initialJobId={jdId}
        onSuccess={() => {
          fetchInterviews();
          fetchStats();
          setSuccess('Interview scheduled successfully');
        }}
      />

      {/* Feedback Dialog */}
      <InterviewFeedbackDialog
        open={feedbackDialogOpen}
        onClose={() => setFeedbackDialogOpen(false)}
        interview={selectedInterview}
        onSuccess={() => {
          fetchInterviews();
          fetchStats();
          setSuccess('Feedback submitted successfully');
        }}
      />
    </Box>
  );
};

export default InterviewScheduler;

