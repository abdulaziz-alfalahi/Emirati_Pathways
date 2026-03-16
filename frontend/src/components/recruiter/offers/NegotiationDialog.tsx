import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Typography,
  Box,
  Alert,
  Paper,
  Chip,
  IconButton,
  List,
  ListItem,
  Divider,
  Card,
  CardContent,
} from '@mui/material';
import {
  Close as CloseIcon,
  Handshake as HandshakeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Message as MessageIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';

interface JobOffer {
  offer_id: string;
  position_title: string;
  salary_amount: number;
  salary_currency: string;
  negotiation_history?: NegotiationEntry[];
  first_name?: string;
  last_name?: string;
}

interface NegotiationEntry {
  timestamp: string;
  party: string;
  proposed_salary?: number;
  proposed_benefits?: any;
  notes: string;
}

interface NegotiationDialogProps {
  open: boolean;
  onClose: () => void;
  offer: JobOffer;
  onNegotiationUpdated: () => void;
}

const NegotiationDialog: React.FC<NegotiationDialogProps> = ({
  open,
  onClose,
  offer,
  onNegotiationUpdated,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [negotiationHistory, setNegotiationHistory] = useState<NegotiationEntry[]>([]);

  // Form fields
  const [proposedSalary, setProposedSalary] = useState('');
  const [notes, setNotes] = useState('');
  const [housingAllowance, setHousingAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');

  useEffect(() => {
    if (open) {
      loadNegotiationHistory();
      resetForm();
    }
  }, [open, offer.offer_id]);

  const loadNegotiationHistory = async () => {
    try {
      // Fetch fresh offer details to get latest negotiation history
      const response = await restClient.get(`/api/recruiter/offers/${offer.offer_id}`);
      console.log('Loaded offer details:', response.data.offer);
      console.log('Negotiation history from API:', response.data.offer?.negotiation_history);

      if (response.data.offer && response.data.offer.negotiation_history) {
        console.log('Setting negotiation history:', response.data.offer.negotiation_history);
        setNegotiationHistory(response.data.offer.negotiation_history);
      } else {
        console.log('No negotiation history in response, setting empty array');
        setNegotiationHistory([]);
      }
    } catch (err) {
      console.error('Error loading negotiation history:', err);
      // Fallback to offer prop if API fails
      if (offer.negotiation_history && offer.negotiation_history.length > 0) {
        setNegotiationHistory(offer.negotiation_history);
      } else {
        setNegotiationHistory([]);
      }
    }
  };

  const resetForm = () => {
    setProposedSalary('');
    setNotes('');
    setHousingAllowance('');
    setTransportAllowance('');
    setError(null);
    setSuccess(null);
  };

  const handleAddNegotiationEntry = async () => {
    if (!proposedSalary && !notes) {
      setError('Please provide either a salary proposal or notes');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const proposedBenefits: any = {};
      if (housingAllowance) {
        proposedBenefits.housing_allowance = parseFloat(housingAllowance);
      }
      if (transportAllowance) {
        proposedBenefits.transportation_allowance = parseFloat(transportAllowance);
      }

      const payload: any = {
        party: 'recruiter',
        notes: notes,
      };

      if (proposedSalary) {
        payload.proposed_salary = parseFloat(proposedSalary);
      }

      if (Object.keys(proposedBenefits).length > 0) {
        payload.proposed_benefits = proposedBenefits;
      }

      await restClient.post(
        `/api/recruiter/offers/${offer.offer_id}/negotiate`,
        payload
      );

      setSuccess('Negotiation entry added successfully');
      resetForm();

      // Reload negotiation history immediately to show the new entry
      await loadNegotiationHistory();

      // Notify parent to refresh offer list
      setTimeout(() => {
        onNegotiationUpdated();
      }, 500);
    } catch (err: any) {
      console.error('Error adding negotiation entry:', err);
      setError(err.response?.data?.error || 'Failed to add negotiation entry');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getSalaryChange = (proposedSalary: number) => {
    const change = proposedSalary - offer.salary_amount;
    const percentage = ((change / offer.salary_amount) * 100).toFixed(1);
    return { change, percentage };
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center">
            <HandshakeIcon sx={{ mr: 1 }} />
            <Typography variant="h6">Offer Negotiation</Typography>
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

        {/* Current Offer Summary */}
        <Paper sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
          <Typography variant="subtitle2" color="textSecondary" gutterBottom>
            CURRENT OFFER
          </Typography>
          <Typography variant="h6">{offer.position_title}</Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {getDisplayName(offer, 'Candidate')}
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={1}>
            <AttachMoneyIcon color="primary" />
            <Typography variant="h6" color="primary">
              {formatCurrency(offer.salary_amount, offer.salary_currency)}
            </Typography>
          </Box>
        </Paper>

        {/* Negotiation History */}
        {negotiationHistory.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom fontWeight="bold">
              Negotiation History
            </Typography>
            <List sx={{ width: '100%' }}>
              {negotiationHistory.map((entry, index) => {
                const isRecruiter = entry.party === 'recruiter';
                const salaryChange = entry.proposed_salary
                  ? getSalaryChange(entry.proposed_salary)
                  : null;

                return (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start" sx={{ flexDirection: 'column', gap: 1 }}>
                      <Box display="flex" justifyContent="space-between" width="100%" mb={1}>
                        <Chip
                          label={isRecruiter ? 'Recruiter' : 'Candidate'}
                          color={isRecruiter ? 'primary' : 'secondary'}
                          size="small"
                          icon={isRecruiter ? <HandshakeIcon /> : <MessageIcon />}
                        />
                        <Typography variant="caption" color="textSecondary">
                          {formatDateTime(entry.timestamp)}
                        </Typography>
                      </Box>
                      <Card sx={{ width: '100%' }} elevation={2}>
                        <CardContent>
                          {entry.proposed_salary && (
                            <Box mb={2}>
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Proposed Salary:
                              </Typography>
                              <Box display="flex" alignItems="center" gap={1}>
                                <Typography variant="h6">
                                  {formatCurrency(entry.proposed_salary, offer.salary_currency)}
                                </Typography>
                                {salaryChange && (
                                  <Chip
                                    icon={
                                      salaryChange.change > 0 ? (
                                        <TrendingUpIcon />
                                      ) : (
                                        <TrendingDownIcon />
                                      )
                                    }
                                    label={`${salaryChange.change > 0 ? '+' : ''}${salaryChange.percentage
                                      }%`}
                                    color={salaryChange.change > 0 ? 'success' : 'error'}
                                    size="small"
                                  />
                                )}
                              </Box>
                            </Box>
                          )}
                          {entry.proposed_benefits && (
                            <Box mb={2}>
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Proposed Benefits:
                              </Typography>
                              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                                {JSON.stringify(entry.proposed_benefits, null, 2)}
                              </Typography>
                            </Box>
                          )}
                          {entry.notes && (
                            <Box>
                              <Typography variant="body2" fontWeight="bold" gutterBottom>
                                Notes:
                              </Typography>
                              <Typography variant="body2">{entry.notes}</Typography>
                            </Box>
                          )}
                        </CardContent>
                      </Card>
                    </ListItem>
                    {index < negotiationHistory.length - 1 && <Divider component="li" />}
                  </React.Fragment>
                );
              })}
            </List>
          </Box>
        )}

        {/* Add New Negotiation Entry */}
        <Box>
          <Typography variant="subtitle1" gutterBottom fontWeight="bold">
            Add Negotiation Entry
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Proposed Salary"
                type="number"
                value={proposedSalary}
                onChange={(e) => setProposedSalary(e.target.value)}
                helperText="Leave empty if no salary change"
                InputProps={{
                  startAdornment: (
                    <Box sx={{ mr: 1, color: 'text.secondary' }}>
                      {offer.salary_currency}
                    </Box>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              {proposedSalary && (
                <Alert severity="info">
                  {(() => {
                    const change = getSalaryChange(parseFloat(proposedSalary));
                    return (
                      <>
                        Change: {change.change > 0 ? '+' : ''}
                        {formatCurrency(change.change, offer.salary_currency)} (
                        {change.percentage}%)
                      </>
                    );
                  })()}
                </Alert>
              )}
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Housing Allowance"
                type="number"
                value={housingAllowance}
                onChange={(e) => setHousingAllowance(e.target.value)}
                helperText="Optional benefit adjustment"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transportation Allowance"
                type="number"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(e.target.value)}
                helperText="Optional benefit adjustment"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Notes"
                multiline
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add context, reasoning, or candidate feedback..."
              />
            </Grid>
          </Grid>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Close
        </Button>
        <Button
          variant="contained"
          onClick={handleAddNegotiationEntry}
          disabled={loading || (!proposedSalary && !notes)}
          startIcon={<HandshakeIcon />}
        >
          {loading ? 'Adding...' : 'Add Entry'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default NegotiationDialog;

