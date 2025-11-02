import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Rating,
  Typography,
  Box,
  Alert,
  IconButton,
} from '@mui/material';
import { Close as CloseIcon, Star as StarIcon } from '@mui/icons-material';
import axios from 'axios';

interface Interview {
  interview_id: string;
  interview_title: string;
  scheduled_date: string;
  scheduled_time: string;
}

interface InterviewFeedbackDialogProps {
  open: boolean;
  onClose: () => void;
  interview: Interview | null;
  onSuccess: () => void;
}

export const InterviewFeedbackDialog: React.FC<InterviewFeedbackDialogProps> = ({
  open,
  onClose,
  interview,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    feedback: '',
    rating: 3,
    recommendation: 'next_round',
    internal_notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003';

  const handleChange = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!interview) return;

    // Validation
    if (!formData.feedback.trim()) {
      setError('Please provide feedback');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await axios.post(
        `${API_BASE_URL}/api/recruiter/interviews/${interview.interview_id}/complete`,
        formData
      );

      if (response.data.success) {
        onSuccess();
        onClose();
        // Reset form
        setFormData({
          feedback: '',
          rating: 3,
          recommendation: 'next_round',
          internal_notes: '',
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit feedback');
    } finally {
      setLoading(false);
    }
  };

  if (!interview) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Interview Feedback</Typography>
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

        {/* Interview Details */}
        <Box sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Interview
          </Typography>
          <Typography variant="body1" fontWeight="medium">
            {interview.interview_title}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            {new Date(interview.scheduled_date).toLocaleDateString()} at {interview.scheduled_time}
          </Typography>
        </Box>

        {/* Rating */}
        <Box sx={{ mb: 3 }}>
          <Typography component="legend" gutterBottom>
            Overall Rating *
          </Typography>
          <Rating
            name="rating"
            value={formData.rating}
            onChange={(event, newValue) => {
              handleChange('rating', newValue || 1);
            }}
            size="large"
            icon={<StarIcon fontSize="inherit" />}
          />
          <Typography variant="caption" color="textSecondary" sx={{ ml: 1 }}>
            {formData.rating} out of 5
          </Typography>
        </Box>

        {/* Recommendation */}
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Recommendation *</InputLabel>
          <Select
            value={formData.recommendation}
            onChange={(e) => handleChange('recommendation', e.target.value)}
            label="Recommendation *"
          >
            <MenuItem value="hire">✅ Hire</MenuItem>
            <MenuItem value="next_round">➡️ Next Round</MenuItem>
            <MenuItem value="hold">⏸️ Hold</MenuItem>
            <MenuItem value="reject">❌ Reject</MenuItem>
          </Select>
        </FormControl>

        {/* Feedback */}
        <TextField
          fullWidth
          multiline
          rows={5}
          label="Feedback *"
          value={formData.feedback}
          onChange={(e) => handleChange('feedback', e.target.value)}
          placeholder="Provide detailed feedback about the candidate's performance, technical skills, communication, cultural fit, etc."
          sx={{ mb: 3 }}
        />

        {/* Internal Notes */}
        <TextField
          fullWidth
          multiline
          rows={3}
          label="Internal Notes"
          value={formData.internal_notes}
          onChange={(e) => handleChange('internal_notes', e.target.value)}
          placeholder="Private notes for internal use only (not shared with candidate)"
          helperText="These notes are only visible to recruiters"
        />
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
          {loading ? 'Submitting...' : 'Complete Interview'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default InterviewFeedbackDialog;

