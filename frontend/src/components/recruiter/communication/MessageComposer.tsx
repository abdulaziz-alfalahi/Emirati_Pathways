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
import { restClient } from '@/utils/api';

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

  // API_BASE_URL handled by restClient

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await restClient.get('/api/recruiter/communication/templates');
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
    setMessageType(template.message_type as 'email' | 'sms' | 'both');
    setSelectedTemplate(template.name);
    setShowTemplates(false);
  };

  const handleSendMessage = async () => {
    if (!body.trim()) {
      setError('Message body is required');
      return;
    }

    if (messageType === 'email' && !subject.trim()) {
      setError('Email subject is required');
      return;
    }

    if (candidates.length === 0) {
      setError('No candidates selected');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await restClient.post('/api/recruiter/communication/send', {
        shortlist_ids: candidates.map(c => c.shortlist_id),
        message_type: messageType,
        subject: messageType === 'email' || messageType === 'both' ? subject : undefined,
        body: body,
        recruiter_id: recruiterId,
        jd_id: jdId,
      });

      if (response.data.success) {
        setSuccess(`Message sent successfully to ${candidates.length} candidate(s)`);
        setTimeout(() => {
          if (onSent) onSent();
          if (onClose) onClose();
        }, 2000);
      } else {
        setError(response.data.error || 'Failed to send message');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
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

        {/* Message Form */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom>
                  Compose Message
                </Typography>
                <Button
                  startIcon={<TemplateIcon />}
                  onClick={() => setShowTemplates(!showTemplates)}
                  variant="outlined"
                  size="small"
                  sx={{ mb: 2 }}
                >
                  {showTemplates ? 'Hide Templates' : 'Use Template'}
                </Button>

                {showTemplates && (
                  <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Available Templates
                    </Typography>
                    <Grid container spacing={1}>
                      {templates.map((template) => (
                        <Grid item xs={12} sm={6} key={template.name}>
                          <Button
                            fullWidth
                            variant="outlined"
                            size="small"
                            onClick={() => handleTemplateSelect(template)}
                            sx={{ justifyContent: 'flex-start', textAlign: 'left' }}
                          >
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {template.name}
                              </Typography>
                              <Typography variant="caption" color="textSecondary">
                                {template.category}
                              </Typography>
                            </Box>
                          </Button>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Message Type</InputLabel>
                <Select
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value as 'email' | 'sms' | 'both')}
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
                    Both Email & SMS
                  </MenuItem>
                </Select>
              </FormControl>

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

              <TextField
                fullWidth
                multiline
                rows={8}
                label="Message Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your message here..."
                required
                sx={{ mb: 2 }}
              />

              {selectedTemplate && (
                <Chip
                  label={`Template: ${selectedTemplate}`}
                  onDelete={() => {
                    setSelectedTemplate('');
                    setSubject('');
                    setBody('');
                  }}
                  color="primary"
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
              )}

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onClose && (
                  <Button onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                )}
                <Button
                  variant="contained"
                  onClick={handleSendMessage}
                  disabled={loading || !body.trim()}
                  startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                >
                  {loading ? 'Sending...' : `Send to ${candidates.length} Candidate(s)`}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MessageComposer;

