import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Typography,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import axios from 'axios';

interface CreateInterviewDialogProps {
  open: boolean;
  onClose: () => void;
  jdId: string;
  shortlistId?: string;
  recruiterId: string;
  onSuccess: () => void;
}

interface ShortlistCandidate {
  shortlist_id: string;
  candidate_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
}

export const CreateInterviewDialog: React.FC<CreateInterviewDialogProps> = ({
  open,
  onClose,
  jdId,
  shortlistId,
  recruiterId,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    shortlist_id: shortlistId || '',
    interview_type: 'video',
    interview_round: 1,
    interview_title: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    meeting_link: '',
    meeting_platform: 'zoom',
    location: '',
    notes: '',
  });

  const [candidates, setCandidates] = useState<ShortlistCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003';

  useEffect(() => {
    if (open && !shortlistId) {
      fetchShortlistCandidates();
    }
  }, [open, jdId]);

  useEffect(() => {
    if (shortlistId) {
      setFormData((prev) => ({ ...prev, shortlist_id: shortlistId }));
    }
  }, [shortlistId]);

  const fetchShortlistCandidates = async () => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/api/recruiter/shortlist/${jdId}`
      );
      
      if (response.data.success) {
        setCandidates(response.data.shortlist);
      }
    } catch (err: any) {
      console.error('Failed to fetch candidates:', err);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.shortlist_id) {
      setError('Please select a candidate');
      return;
    }
    if (!formData.scheduled_date || !formData.scheduled_time) {
      setError('Please provide date and time');
      return;
    }
    if (!formData.interview_title) {
      setError('Please provide interview title');
      return;
    }
    if (formData.interview_type === 'video' && !formData.meeting_link) {
      setError('Meeting link is required for video interviews');
      return;
    }
    if (formData.interview_type === 'in_person' && !formData.location) {
      setError('Location is required for in-person interviews');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/recruiter/interviews/create`,
        {
          ...formData,
          recruiter_id: recruiterId,
          jd_id: jdId,
        }
      );

      if (response.data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          shortlist_id: '',
          interview_type: 'video',
          interview_round: 1,
          interview_title: '',
          scheduled_date: '',
          scheduled_time: '',
          duration_minutes: 60,
          meeting_link: '',
          meeting_platform: 'zoom',
          location: '',
          notes: '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create interview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Schedule Interview</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <Grid container spacing={2} sx={{ mt: 1 }}>
          {/* Candidate Selection */}
          {!shortlistId && (
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Candidate *</InputLabel>
                <Select
                  value={formData.shortlist_id}
                  onChange={(e) => handleChange('shortlist_id', e.target.value)}
                  label="Candidate *"
                >
                  {candidates.map((candidate) => (
                    <MenuItem key={candidate.shortlist_id} value={candidate.shortlist_id}>
                      {candidate.first_name || candidate.last_name
                        ? `${candidate.first_name || ''} ${candidate.last_name || ''}`.trim()
                        : candidate.candidate_id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          )}

          {/* Interview Title */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Interview Title *"
              value={formData.interview_title}
              onChange={(e) => handleChange('interview_title', e.target.value)}
              placeholder="e.g., Technical Interview - Python & React"
            />
          </Grid>

          {/* Interview Type */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Interview Type *</InputLabel>
              <Select
                value={formData.interview_type}
                onChange={(e) => handleChange('interview_type', e.target.value)}
                label="Interview Type *"
              >
                <MenuItem value="video">Video Call</MenuItem>
                <MenuItem value="phone">Phone Call</MenuItem>
                <MenuItem value="in_person">In-Person</MenuItem>
                <MenuItem value="panel">Panel Interview</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Interview Round */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="number"
              label="Interview Round"
              value={formData.interview_round}
              onChange={(e) => handleChange('interview_round', parseInt(e.target.value))}
              inputProps={{ min: 1 }}
            />
          </Grid>

          {/* Date */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="date"
              label="Date *"
              value={formData.scheduled_date}
              onChange={(e) => handleChange('scheduled_date', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Time */}
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              type="time"
              label="Time *"
              value={formData.scheduled_time}
              onChange={(e) => handleChange('scheduled_time', e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {/* Duration */}
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel>Duration</InputLabel>
              <Select
                value={formData.duration_minutes}
                onChange={(e) => handleChange('duration_minutes', e.target.value)}
                label="Duration"
              >
                <MenuItem value={30}>30 minutes</MenuItem>
                <MenuItem value={45}>45 minutes</MenuItem>
                <MenuItem value={60}>1 hour</MenuItem>
                <MenuItem value={90}>1.5 hours</MenuItem>
                <MenuItem value={120}>2 hours</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Meeting Platform */}
          {(formData.interview_type === 'video') && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Platform</InputLabel>
                  <Select
                    value={formData.meeting_platform}
                    onChange={(e) => handleChange('meeting_platform', e.target.value)}
                    label="Platform"
                  >
                    <MenuItem value="zoom">Zoom</MenuItem>
                    <MenuItem value="teams">Microsoft Teams</MenuItem>
                    <MenuItem value="meet">Google Meet</MenuItem>
                    <MenuItem value="webex">Webex</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Meeting Link *"
                  value={formData.meeting_link}
                  onChange={(e) => handleChange('meeting_link', e.target.value)}
                  placeholder="https://zoom.us/j/123456789"
                  helperText="Required for video interviews"
                />
              </Grid>
            </>
          )}

          {/* Location for in-person */}
          {formData.interview_type === 'in_person' && (
            <Grid item xs={12}>
              <TextField
                fullWidth
                required
                label="Location *"
                value={formData.location}
                onChange={(e) => handleChange('location', e.target.value)}
                placeholder="Office address or meeting room"
                helperText="Required for in-person interviews"
              />
            </Grid>
          )}

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Notes"
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Interview agenda, topics to cover, etc."
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading ? 'Scheduling...' : 'Schedule Interview'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateInterviewDialog;

