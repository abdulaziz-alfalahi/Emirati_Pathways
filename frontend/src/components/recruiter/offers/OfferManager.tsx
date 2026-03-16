import React, { useState, useEffect } from 'react';
import CreateOfferDialog from './CreateOfferDialog';
import OfferDetailsDialog from './OfferDetailsDialog';
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
  Grid,
  Card,
  CardContent,
  Tooltip,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Visibility as VisibilityIcon,
  Send as SendIcon,
  Edit as EditIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Handshake as HandshakeIcon,
  TrendingUp as TrendingUpIcon,
  Description as DescriptionIcon,
  AttachMoney as AttachMoneyIcon,
} from '@mui/icons-material';
import { restClient } from '@/utils/api';
import { getDisplayName } from '@/utils/nameUtils';

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
  status: string;
  sent_at: string | null;
  response_deadline: string | null;
  candidate_response: string | null;
  candidate_response_at: string | null;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Candidate details
  first_name?: string;
  last_name?: string;
  email?: string;
}

interface OfferStats {
  total_offers: number;
  draft: number;
  pending_approval: number;
  approved: number;
  sent: number;
  accepted: number;
  rejected: number;
  negotiating: number;
  withdrawn: number;
  expired: number;
  acceptance_rate: number | null;
}

interface OfferManagerProps {
  jdId: string;
  onClose?: () => void;
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

const OfferManager: React.FC<OfferManagerProps> = ({ jdId, onClose }) => {
  const [offers, setOffers] = useState<JobOffer[]>([]);
  const [stats, setStats] = useState<OfferStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<JobOffer | null>(null);

  useEffect(() => {
    loadOffers();
    loadStats();
  }, [jdId]);

  const loadOffers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await restClient.get(`/api/recruiter/offers/jd/${jdId}`);
      setOffers(response.data.offers || []);
    } catch (err: any) {
      console.error('Error loading offers:', err);
      setError(err.response?.data?.error || 'Failed to load offers');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/offers/statistics/${jdId}`);
      setStats(response.data.statistics);
    } catch (err: any) {
      console.error('Error loading statistics:', err);
    }
  };

  const handleViewDetails = (offer: JobOffer) => {
    console.log('handleViewDetails called with offer:', offer);
    setSelectedOffer(offer);
    setDetailsDialogOpen(true);
    console.log('Details dialog should now be open');
  };

  const handleOfferCreated = () => {
    loadOffers();
    loadStats();
    setCreateDialogOpen(false);
  };

  const handleOfferUpdated = () => {
    loadOffers();
    loadStats();
    setDetailsDialogOpen(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return `${amount.toLocaleString()} ${currency}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h4" component="h1">
          Offer Management
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          Create New Offer
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Dashboard */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Total Offers
                    </Typography>
                    <Typography variant="h4">{stats.total_offers}</Typography>
                  </Box>
                  <DescriptionIcon sx={{ fontSize: 40, color: 'primary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Sent
                    </Typography>
                    <Typography variant="h4">{stats.sent}</Typography>
                  </Box>
                  <SendIcon sx={{ fontSize: 40, color: 'info.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Accepted
                    </Typography>
                    <Typography variant="h4">{stats.accepted}</Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Acceptance Rate
                    </Typography>
                    <Typography variant="h4">
                      {stats.acceptance_rate !== null ? `${stats.acceptance_rate}%` : 'N/A'}
                    </Typography>
                  </Box>
                  <TrendingUpIcon sx={{ fontSize: 40, color: 'success.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Negotiating
                    </Typography>
                    <Typography variant="h4">{stats.negotiating}</Typography>
                  </Box>
                  <HandshakeIcon sx={{ fontSize: 40, color: 'secondary.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Pending Approval
                    </Typography>
                    <Typography variant="h4">{stats.pending_approval}</Typography>
                  </Box>
                  <EditIcon sx={{ fontSize: 40, color: 'warning.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Rejected
                    </Typography>
                    <Typography variant="h4">{stats.rejected}</Typography>
                  </Box>
                  <CancelIcon sx={{ fontSize: 40, color: 'error.main', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography color="textSecondary" gutterBottom variant="body2">
                      Draft
                    </Typography>
                    <Typography variant="h4">{stats.draft}</Typography>
                  </Box>
                  <DescriptionIcon sx={{ fontSize: 40, color: 'text.disabled', opacity: 0.3 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Offers Table */}
      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Candidate</TableCell>
                <TableCell>Position</TableCell>
                <TableCell>Salary</TableCell>
                <TableCell>Contract Type</TableCell>
                <TableCell>Start Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {offers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} align="center">
                    <Typography variant="body2" color="textSecondary" sx={{ py: 3 }}>
                      No offers found. Click "Create New Offer" to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                offers.map((offer) => (
                  <TableRow key={offer.offer_id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {getDisplayName(offer, offer.candidate_id)}
                      </Typography>
                      {offer.email && (
                        <Typography variant="caption" color="textSecondary">
                          {offer.email}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{offer.position_title}</TableCell>
                    <TableCell>
                      {formatCurrency(offer.salary_amount, offer.salary_currency)}
                      <Typography variant="caption" display="block" color="textSecondary">
                        {offer.salary_period}
                      </Typography>
                    </TableCell>
                    <TableCell>{offer.contract_type}</TableCell>
                    <TableCell>{formatDate(offer.start_date)}</TableCell>
                    <TableCell>
                      <Chip
                        label={offer.status.replace('_', ' ').toUpperCase()}
                        color={statusColors[offer.status] || 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{formatDate(offer.created_at)}</TableCell>
                    <TableCell align="center">
                      <Tooltip title="View Details">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleViewDetails(offer)}
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Offer Dialog */}
      <CreateOfferDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        jdId={jdId}
        onOfferCreated={handleOfferCreated}
      />

      {/* Offer Details Dialog */}
      {selectedOffer ? (
        <OfferDetailsDialog
          open={detailsDialogOpen}
          onClose={() => {
            console.log('Closing details dialog');
            setDetailsDialogOpen(false);
          }}
          offer={selectedOffer}
          onOfferUpdated={handleOfferUpdated}
        />
      ) : (
        console.log('selectedOffer is null, dialog not rendered'),
        null
      )}
    </Box>
  );
};

export default OfferManager;

