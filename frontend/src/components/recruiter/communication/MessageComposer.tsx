import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Divider,
} from '@mui/material';
import {
  Send as SendIcon,
  Email as EmailIcon,
  Sms as SmsIcon,
  Close as CloseIcon,
  InsertDriveFile as TemplateIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface Candidate {
  shortlist_id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone_number?: string;
}

interface MessageTemplate {
  name: string;
  category: string;
  subject: string;
  body: string;
  variables: string[];
  message_type: string;
}

interface MessageComposerProps {
  candidates: Candidate[];
  jdId?: string;
  recruiterId: string;
  onClose?: () => void;
  onSent?: () => void;
}

export const MessageComposer: React.FC<MessageComposerProps> = ({
  candidates,
  jdId,
  recruiterId,
  onClose,
  onSent,
}) => {
  const [messageType, setMessageType] = useState<'email' | 'sms' | 'both'>('email');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [templates, setTemplates] = useState<MessageTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showTemplates, setShowTemplates] = useState(false);

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5003';

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/recruiter/communication/templates`);
      if (response.data.success) {
        setTemplates(response.data.templates);
      }
    } catch (err: any) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSubject(template.subject);
    setBody(template.body);
    setSelectedTemplate(template.name);
    setShowTemplates(false);
  };

  const handleSendMessage = async () => {
    if (!body.trim()) {
      setError('Message body is required');
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      setError('Subject is required for emails');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/recruiter/communication/send`, {
        shortlist_ids: candidates.map(c => c.shortlist_id),
        message_type: messageType,
        subject: subject,
        body: body,
        recruiter_id: recruiterId,
      });

      if (response.data.success) {
        setSuccess(`Messages sent to ${response.data.successful}/${response.data.total} candidates`);
        
        // Reset form
        setSubject('');
        setBody('');
        setSelectedTemplate('');
        
        // Call callback
        if (onSent) {
          onSent();
        }
        
        // Close after 2 seconds
        setTimeout(() => {
          if (onClose) {
            onClose();
          }
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send messages');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Send Message to Candidates
      </Typography>

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

      <Grid container spacing={3}>
        {/* Recipients */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                <PersonIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                Recipients ({candidates.length})
              </Typography>
              <Divider sx={{ my: 2 }} />
              <List dense>
                {candidates.map((candidate) => (
                  <ListItem key={candidate.shortlist_id}>
                    <ListItemText
                      primary={`${candidate.first_name} ${candidate.last_name}`}
                      secondary={
                        <>
                          {candidate.email && <div>{candidate.email}</div>}
                          {candidate.phone_number && <div>{candidate.phone_number}</div>}
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Message Composer */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            {/* Message Type */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Message Type</InputLabel>
              <Select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value as any)}
                label="Message Type"
              >
                <MenuItem value="email">
                  <EmailIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Email Only
                </MenuItem>
                <MenuItem value="sms">
                  <SmsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  SMS Only
                </MenuItem>
                <MenuItem value="both">
                  <EmailIcon sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                  <SmsIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Email & SMS
                </MenuItem>
              </Select>
            </FormControl>

            {/* Template Selector */}
            <Box sx={{ mb: 2 }}>
              <Button
                startIcon={<TemplateIcon />}
                onClick={() => setShowTemplates(true)}
                variant="outlined"
                fullWidth
              >
                {selectedTemplate || 'Use Template'}
              </Button>
            </Box>

            {/* Subject (for email) */}
            {(messageType === 'email' || messageType === 'both') && (
              <TextField
                fullWidth
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                sx={{ mb: 2 }}
                required
              />
            )}

            {/* Message Body */}
            <TextField
              fullWidth
              multiline
              rows={12}
              label="Message"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Enter your message here..."
              required
              sx={{ mb: 2 }}
            />

            {/* Variable Hints */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" color="textSecondary">
                Available variables: {{'{{'}}candidate_name{{'}}'}}, {{'{{'}}company_name{{'}}'}}, {{'{{'}}job_title{{'}}'}}, 
                {{'{{'}}recruiter_name{{'}}'}}, {{'{{'}}interview_date{{'}}'}}, {{'{{'}}interview_time{{'}}'}}
              </Typography>
            </Box>

            {/* Actions */}
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              {onClose && (
                <Button onClick={onClose} disabled={loading}>
                  Cancel
                </Button>
              )}
              <Button
                variant="contained"
                startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                onClick={handleSendMessage}
                disabled={loading || !body.trim()}
              >
                {loading ? 'Sending...' : `Send to ${candidates.length} Candidate${candidates.length > 1 ? 's' : ''}`}
              </Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Templates Dialog */}
      <Dialog open={showTemplates} onClose={() => setShowTemplates(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Message Templates
          <IconButton
            onClick={() => setShowTemplates(false)}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            {templates.map((template) => (
              <Grid item xs={12} key={template.name}>
                <Card
                  sx={{
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'action.hover' },
                    border: selectedTemplate === template.name ? 2 : 0,
                    borderColor: 'primary.main',
                  }}
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {template.name}
                    </Typography>
                    <Chip label={template.category} size="small" sx={{ mb: 1 }} />
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      <strong>Subject:</strong> {template.subject}
                    </Typography>
                    <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
                      {template.body.substring(0, 150)}...
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowTemplates(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MessageComposer;

