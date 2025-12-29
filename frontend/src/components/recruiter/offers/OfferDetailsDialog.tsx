import React, { useState } from 'react';
import NegotiationDialog from './NegotiationDialog';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Box,
  Chip,
  Divider,
  Alert,
  List,
  ListItem,
  ListItemText,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Handshake as HandshakeIcon,
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Work as WorkIcon,
  CardGiftcard as CardGiftcardIcon,
} from '@mui/icons-material';
import { restClient } from '@/utils/api';

interface JobOffer {
  offer_id: string;
  jd_id: string;
  candidate_id: string;
  recruiter_id: string;
  position_title: string;
  salary_amount: number;
  salary_currency: string;
  salary_period: string;
  benefits: any;
  start_date: string;
  contract_type: string;
  probation_period_months: number;
  work_location?: string;
  work_schedule?: string;
  status: string;
  sent_at: string | null;
  response_deadline: string | null;
  candidate_response: string | null;
  candidate_response_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  negotiation_history?: any[];
  // Candidate details
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface OfferDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  offer: JobOffer;
  onOfferUpdated: () => void;
}

const statusColors: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info'> = {
  draft: 'default',
  pending_approval: 'warning',
  approved: 'info',
  sent: 'primary',
  accepted: 'success',
  rejected: 'error',
  negotiating: 'secondary',
  withdrawn: 'default',
  expired: 'error',
};

const OfferDetailsDialog: React.FC<OfferDetailsDialogProps> = ({
  open,
  onClose,
  offer,
  onOfferUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [negotiationDialogOpen, setNegotiationDialogOpen] = useState(false);
  const [currentOffer, setCurrentOffer] = useState<JobOffer>(offer);

  // Editable fields
  const [salaryAmount, setSalaryAmount] = useState(currentOffer.salary_amount.toString());
  const [startDate, setStartDate] = useState(currentOffer.start_date);
  const [responseDeadline, setResponseDeadline] = useState(currentOffer.response_deadline || '');

  // Reload offer details when offer prop changes
  React.useEffect(() => {
    setCurrentOffer(offer);
    setSalaryAmount(currentOffer.salary_amount.toString());
    setStartDate(currentOffer.start_date);
    setResponseDeadline(currentOffer.response_deadline || '');
  }, [offer]);

  const reloadOfferDetails = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/offers/${currentOffer.offer_id}`);
      if (response.data.offer) {
        const updatedOffer = response.data.offer;
        setCurrentOffer(updatedOffer);
        // Also update the form field states
        setSalaryAmount(updatedOffer.salary_amount.toString());
        setStartDate(updatedOffer.start_date);
        setResponseDeadline(updatedOffer.response_deadline || '');
      }
    } catch (err) {
      console.error('Error reloading offer details:', err);
    }
  };

  const handleNegotiationUpdated = async () => {
    // Reload the current offer to get updated negotiation history
    await reloadOfferDetails();
    // Also notify parent to refresh the list
    onOfferUpdated();
  };

  const handleSendOffer = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await restClient.post(`/api/recruiter/offers/${currentOffer.offer_id}/send`);
      setSuccess('Offer sent successfully to candidate');

      // Reload offer details to show updated status and timestamps
      await reloadOfferDetails();

      setTimeout(() => {
        onOfferUpdated();
      }, 500);
    } catch (err: any) {
      console.error('Error sending offer:', err);
      setError(err.response?.data?.error || 'Failed to send offer');
    } finally {
      setLoading(false);
    }
  };

  // Note: Offer approval/rejection is handled by HR Managers through the HR Dashboard
  // Recruiters can only view pending approval status and send approved offers

  const handleWithdrawOffer = async () => {
    if (!window.confirm('Are you sure you want to withdraw this offer?')) {
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await restClient.post(`/api/recruiter/offers/${currentOffer.offer_id}/withdraw`, {
        reason: 'Position filled by another candidate',
      });
      setSuccess('Offer withdrawn successfully');

      // Reload offer details to show updated status
      await reloadOfferDetails();

      setTimeout(() => {
        onOfferUpdated();
      }, 500);
    } catch (err: any) {
      console.error('Error withdrawing offer:', err);
      setError(err.response?.data?.error || 'Failed to withdraw offer');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOffer = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const updates: any = {
        salary_amount: parseFloat(salaryAmount),
        start_date: startDate,
      };

      if (responseDeadline) {
        updates.response_deadline = responseDeadline;
      }

      await restClient.put(`/api/recruiter/offers/${currentOffer.offer_id}`, updates);
      setSuccess('Offer updated successfully');
      setEditMode(false);

      // Reload offer details to show updated values
      await reloadOfferDetails();

      // Notify parent to refresh list
      setTimeout(() => {
        onOfferUpdated();
      }, 500);
    } catch (err: any) {
      console.error('Error updating offer:', err);
      setError(err.response?.data?.error || 'Failed to update offer');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordResponse = async (response: 'accepted' | 'rejected' | 'negotiating') => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      await restClient.post(`/api/recruiter/offers/${currentOffer.offer_id}/response`, {
        response: response,
      });
      setSuccess(`Candidate response recorded: ${response}`);

      // Reload offer details to show updated response
      await reloadOfferDetails();

      setTimeout(() => {
        onOfferUpdated();
      }, 500);
    } catch (err: any) {
      console.error('Error recording response:', err);
      setError(err.response?.data?.error || 'Failed to record response');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  const canSend = currentOffer.status === 'approved';
  const canEdit = currentOffer.status === 'draft' || currentOffer.status === 'pending_approval' || currentOffer.status === 'negotiating';
  const canWithdraw = currentOffer.status === 'sent' || currentOffer.status === 'negotiating';
  const canRecordResponse = currentOffer.status === 'sent';
  const canNegotiate = currentOffer.status === 'negotiating';

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center">
              <WorkIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Offer Details</Typography>
            </Box>
            <IconButton onClick={onClose} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {success}
            </Alert>
          )}

          <Grid container spacing={3}>
            {/* Candidate Information */}
            <Grid item xs={12}>
              <Paper sx={{ p: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle2" color="textSecondary" gutterBottom>
                  CANDIDATE INFORMATION
                </Typography>
                <Typography variant="h6">
                  {currentOffer.first_name && currentOffer.last_name
                    ? `${currentOffer.first_name} ${currentOffer.last_name}`
                    : currentOffer.candidate_id}
                </Typography>
                {currentOffer.email && (
                  <Typography variant="body2" color="textSecondary">
                    {currentOffer.email}
                  </Typography>
                )}
              </Paper>
            </Grid>

            {/* Status */}
            <Grid item xs={12}>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="subtitle2" color="textSecondary">
                  Status:
                </Typography>
                <Chip
                  label={currentOffer.status.replace('_', ' ').toUpperCase()}
                  color={statusColors[offer.status] || 'default'}
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Position & Compensation */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                <AttachMoneyIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Position & Compensation
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Position Title
              </Typography>
              <Typography variant="body1">{currentOffer.position_title}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Salary Amount"
                  type="number"
                  value={salaryAmount}
                  onChange={(e) => setSalaryAmount(e.target.value)}
                  size="small"
                />
              ) : (
                <>
                  <Typography variant="body2" color="textSecondary">
                    Salary
                  </Typography>
                  <Typography variant="body1">
                    {formatCurrency(currentOffer.salary_amount, currentOffer.salary_currency)}
                    <Typography component="span" variant="caption" color="textSecondary" sx={{ ml: 1 }}>
                      ({currentOffer.salary_period})
                    </Typography>
                  </Typography>
                </>
              )}
            </Grid>

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Contract Details */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                <CalendarIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Contract Details
              </Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Contract Type
              </Typography>
              <Typography variant="body1">{currentOffer.contract_type}</Typography>
            </Grid>

            <Grid item xs={12} md={6}>
              {editMode ? (
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  size="small"
                  InputLabelProps={{ shrink: true }}
                />
              ) : (
                <>
                  <Typography variant="body2" color="textSecondary">
                    Start Date
                  </Typography>
                  <Typography variant="body1">{formatDate(currentOffer.start_date)}</Typography>
                </>
              )}
            </Grid>

            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="textSecondary">
                Probation Period
              </Typography>
              <Typography variant="body1">{currentOffer.probation_period_months} months</Typography>
            </Grid>

            {currentOffer.work_location && (
              <Grid item xs={12} md={6}>
                <Typography variant="body2" color="textSecondary">
                  Work Location
                </Typography>
                <Typography variant="body1">{currentOffer.work_location}</Typography>
              </Grid>
            )}

            {currentOffer.work_schedule && (
              <Grid item xs={12}>
                <Typography variant="body2" color="textSecondary">
                  Work Schedule
                </Typography>
                <Typography variant="body1">{currentOffer.work_schedule}</Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Divider />
            </Grid>

            {/* Benefits */}
            <Grid item xs={12}>
              <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                <CardGiftcardIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                Benefits & Perks
              </Typography>
            </Grid>

            {currentOffer.benefits && (
              <Grid item xs={12}>
                <List dense>
                  {currentOffer.benefits.annual_leave_days && (
                    <ListItem>
                      <ListItemText
                        primary={`${currentOffer.benefits.annual_leave_days} days annual leave`}
                      />
                    </ListItem>
                  )}
                  {currentOffer.benefits.health_insurance && (
                    <ListItem>
                      <ListItemText primary="Health insurance included" />
                    </ListItem>
                  )}
                  {currentOffer.benefits.housing_allowance > 0 && (
                    <ListItem>
                      <ListItemText
                        primary={`Housing allowance: ${formatCurrency(
                          currentOffer.benefits.housing_allowance,
                          currentOffer.salary_currency
                        )}`}
                      />
                    </ListItem>
                  )}
                  {currentOffer.benefits.transportation_allowance > 0 && (
                    <ListItem>
                      <ListItemText
                        primary={`Transportation allowance: ${formatCurrency(
                          currentOffer.benefits.transportation_allowance,
                          currentOffer.salary_currency
                        )}`}
                      />
                    </ListItem>
                  )}
                  {currentOffer.benefits.flight_tickets && (
                    <ListItem>
                      <ListItemText
                        primary={`${currentOffer.benefits.flight_tickets} flight tickets per year`}
                      />
                    </ListItem>
                  )}
                  {currentOffer.benefits.additional_benefits &&
                    currentOffer.benefits.additional_benefits.length > 0 && (
                      <ListItem>
                        <ListItemText
                          primary="Additional Benefits:"
                          secondary={currentOffer.benefits.additional_benefits.join(', ')}
                        />
                      </ListItem>
                    )}
                </List>
              </Grid>
            )}

            {/* Timeline */}
            {(currentOffer.sent_at || currentOffer.approved_at || currentOffer.candidate_response_at) && (
              <>
                <Grid item xs={12}>
                  <Divider />
                </Grid>
                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    Timeline
                  </Typography>
                </Grid>
                {currentOffer.approved_at && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Approved At
                    </Typography>
                    <Typography variant="body1">{formatDateTime(currentOffer.approved_at)}</Typography>
                  </Grid>
                )}
                {currentOffer.sent_at && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Sent At
                    </Typography>
                    <Typography variant="body1">{formatDateTime(currentOffer.sent_at)}</Typography>
                  </Grid>
                )}
                {currentOffer.response_deadline && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Response Deadline
                    </Typography>
                    <Typography variant="body1">{formatDate(currentOffer.response_deadline)}</Typography>
                  </Grid>
                )}
                {currentOffer.candidate_response && (
                  <Grid item xs={12} md={6}>
                    <Typography variant="body2" color="textSecondary">
                      Candidate Response
                    </Typography>
                    <Chip
                      label={currentOffer.candidate_response.toUpperCase()}
                      color={
                        currentOffer.candidate_response === 'accepted'
                          ? 'success'
                          : currentOffer.candidate_response === 'rejected'
                            ? 'error'
                            : 'secondary'
                      }
                      size="small"
                    />
                    <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                      {formatDateTime(currentOffer.candidate_response_at)}
                    </Typography>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', width: '100%', p: 1 }}>
            {editMode ? (
              <>
                <Button onClick={() => setEditMode(false)} disabled={loading}>
                  Cancel Edit
                </Button>
                <Button
                  variant="contained"
                  onClick={handleUpdateOffer}
                  disabled={loading}
                  startIcon={<CheckCircleIcon />}
                >
                  Save Changes
                </Button>
              </>
            ) : (
              <>
                {canEdit && (
                  <Tooltip title="Edit offer details">
                    <Button
                      startIcon={<EditIcon />}
                      onClick={() => setEditMode(true)}
                      disabled={loading}
                    >
                      Edit
                    </Button>
                  </Tooltip>
                )}
                {/* Show pending approval message for recruiters - approval is done by HR Managers */}
                {currentOffer.status === 'pending_approval' && (
                  <Alert severity="info" sx={{ py: 0.5 }}>
                    This offer is pending HR Manager approval. Once approved, you can send it to the candidate.
                  </Alert>
                )}
                {currentOffer.status === 'rejected' && (
                  <Alert severity="error" sx={{ py: 0.5 }}>
                    This offer was rejected by HR. Please review the feedback and create a new offer if needed.
                  </Alert>
                )}
                {canSend && (
                  <Tooltip title="Send offer to candidate">
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<SendIcon />}
                      onClick={handleSendOffer}
                      disabled={loading}
                    >
                      Send Offer
                    </Button>
                  </Tooltip>
                )}
                {canRecordResponse && (
                  <>
                    <Button
                      color="success"
                      onClick={() => handleRecordResponse('accepted')}
                      disabled={loading}
                    >
                      Mark Accepted
                    </Button>
                    <Button
                      color="error"
                      onClick={() => handleRecordResponse('rejected')}
                      disabled={loading}
                    >
                      Mark Rejected
                    </Button>
                    <Button
                      color="secondary"
                      onClick={() => handleRecordResponse('negotiating')}
                      disabled={loading}
                    >
                      Start Negotiation
                    </Button>
                  </>
                )}
                {canNegotiate && (
                  <Tooltip title="Manage negotiation">
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<HandshakeIcon />}
                      onClick={() => setNegotiationDialogOpen(true)}
                      disabled={loading}
                    >
                      Negotiate
                    </Button>
                  </Tooltip>
                )}
                {canWithdraw && (
                  <Tooltip title="Withdraw this offer">
                    <Button
                      color="error"
                      startIcon={<CancelIcon />}
                      onClick={handleWithdrawOffer}
                      disabled={loading}
                    >
                      Withdraw
                    </Button>
                  </Tooltip>
                )}
              </>
            )}
            <Box sx={{ flex: '1 1 auto' }} />
            <Button onClick={onClose} disabled={loading}>
              Close
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Negotiation Dialog */}
      <NegotiationDialog
        open={negotiationDialogOpen}
        onClose={() => setNegotiationDialogOpen(false)}
        offer={currentOffer}
        onNegotiationUpdated={handleNegotiationUpdated}
      />
    </>
  );
};

export default OfferDetailsDialog;

