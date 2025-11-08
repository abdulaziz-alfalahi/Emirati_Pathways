import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Box,
  Alert,
  InputAdornment,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface CreateOfferDialogProps {
  open: boolean;
  onClose: () => void;
  jdId: string;
  onOfferCreated: () => void;
  preselectedCandidate?: {
    shortlist_id: string;
    candidate_id: string;
    name: string;
    email: string;
  };
}

interface ShortlistedCandidate {
  shortlist_id: string;
  candidate_id: string;
  first_name: string;
  last_name: string;
  email: string;
  current_job_title: string;
  match_score: number;
}

const steps = ['Select Candidate', 'Compensation Details', 'Contract Terms', 'Benefits & Perks'];

const CreateOfferDialog: React.FC<CreateOfferDialogProps> = ({
  open,
  onClose,
  jdId,
  onOfferCreated,
  preselectedCandidate,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<ShortlistedCandidate[]>([]);

  // Form data
  const [selectedCandidate, setSelectedCandidate] = useState<ShortlistedCandidate | null>(null);
  const [positionTitle, setPositionTitle] = useState('');
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryCurrency, setSalaryCurrency] = useState('AED');
  const [salaryPeriod, setSalaryPeriod] = useState('annual');
  const [contractType, setContractType] = useState('full-time');
  const [startDate, setStartDate] = useState('');
  const [probationPeriod, setProbationPeriod] = useState('3');
  const [workLocation, setWorkLocation] = useState('');
  const [workSchedule, setWorkSchedule] = useState('');
  
  // Benefits
  const [annualLeave, setAnnualLeave] = useState('30');
  const [healthInsurance, setHealthInsurance] = useState(true);
  const [housingAllowance, setHousingAllowance] = useState('');
  const [transportAllowance, setTransportAllowance] = useState('');
  const [flightTickets, setFlightTickets] = useState('2');
  const [additionalBenefits, setAdditionalBenefits] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      loadCandidates();
      resetForm();
      
      // If preselectedCandidate is provided, set it as selected
      if (preselectedCandidate) {
        const candidate: ShortlistedCandidate = {
          shortlist_id: preselectedCandidate.shortlist_id,
          candidate_id: preselectedCandidate.candidate_id,
          first_name: preselectedCandidate.name.split(' ')[0] || '',
          last_name: preselectedCandidate.name.split(' ').slice(1).join(' ') || '',
          email: preselectedCandidate.email,
          current_job_title: '',
          match_score: 0
        };
        setSelectedCandidate(candidate);
        // Keep on Step 1 so user can see and edit position title
        // Position title will need to be filled manually
      }
    }
  }, [open, jdId, preselectedCandidate]);

  const loadCandidates = async () => {
    try {
      const response = await axios.get(`http://localhost:5003/api/recruiter/shortlist/${jdId}`);
      // The response structure is {success: true, shortlist: [...]}
      setCandidates(response.data.shortlist || []);
    } catch (err: any) {
      console.error('Error loading candidates:', err);
      setError('Failed to load candidates');
    }
  };

  const resetForm = () => {
    setActiveStep(0);
    setError(null);
    setSelectedCandidate(null);
    setPositionTitle('');
    setSalaryAmount('');
    setSalaryCurrency('AED');
    setSalaryPeriod('annual');
    setContractType('full-time');
    setStartDate('');
    setProbationPeriod('3');
    setWorkLocation('');
    setWorkSchedule('');
    setAnnualLeave('30');
    setHealthInsurance(true);
    setHousingAllowance('');
    setTransportAllowance('');
    setFlightTickets('2');
    setAdditionalBenefits([]);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const handleSubmit = async () => {
    if (!selectedCandidate) {
      setError('Please select a candidate');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const benefits = {
        annual_leave_days: parseInt(annualLeave),
        health_insurance: healthInsurance,
        housing_allowance: housingAllowance ? parseFloat(housingAllowance) : 0,
        transportation_allowance: transportAllowance ? parseFloat(transportAllowance) : 0,
        flight_tickets: parseInt(flightTickets),
        additional_benefits: additionalBenefits,
      };

      const offerData = {
        jd_id: jdId,
        shortlist_id: selectedCandidate.shortlist_id,
        candidate_id: selectedCandidate.candidate_id,
        recruiter_id: 'recruiter_001', // TODO: Get from auth context
        position_title: positionTitle,
        salary_amount: parseFloat(salaryAmount),
        salary_currency: salaryCurrency,
        salary_period: salaryPeriod,
        benefits: benefits,
        start_date: startDate,
        employment_type: contractType, // Backend expects employment_type
        probation_period_months: parseInt(probationPeriod),
        work_location: workLocation,
      };

      await axios.post('http://localhost:5003/api/recruiter/offers/create', offerData);
      onOfferCreated();
      onClose();
    } catch (err: any) {
      console.error('Error creating offer:', err);
      setError(err.response?.data?.error || 'Failed to create offer');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (activeStep) {
      case 0:
        return selectedCandidate !== null && positionTitle.trim() !== '';
      case 1:
        return salaryAmount !== '' && parseFloat(salaryAmount) > 0;
      case 2:
        return startDate !== '' && contractType !== '';
      case 3:
        return true; // Benefits are optional
      default:
        return false;
    }
  };

  const renderStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Autocomplete
                options={candidates}
                getOptionLabel={(option) =>
                  `${option.first_name} ${option.last_name} - ${option.current_job_title} (Match: ${option.match_score}%)`
                }
                value={selectedCandidate}
                onChange={(_, newValue) => setSelectedCandidate(newValue)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Candidate"
                    required
                    helperText="Choose a candidate from the shortlist"
                  />
                )}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Position Title"
                value={positionTitle}
                onChange={(e) => setPositionTitle(e.target.value)}
                required
                helperText="Official job title for this position"
              />
            </Grid>
            {selectedCandidate && (
              <Grid item xs={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Selected:</strong> {selectedCandidate.first_name} {selectedCandidate.last_name}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Email:</strong> {selectedCandidate.email}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Current Role:</strong> {selectedCandidate.current_job_title}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Match Score:</strong> {selectedCandidate.match_score}%
                  </Typography>
                </Alert>
              </Grid>
            )}
          </Grid>
        );

      case 1:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Salary Amount"
                type="number"
                value={salaryAmount}
                onChange={(e) => setSalaryAmount(e.target.value)}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <AttachMoneyIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Currency</InputLabel>
                <Select
                  value={salaryCurrency}
                  onChange={(e) => setSalaryCurrency(e.target.value)}
                  label="Currency"
                >
                  <MenuItem value="AED">AED</MenuItem>
                  <MenuItem value="USD">USD</MenuItem>
                  <MenuItem value="EUR">EUR</MenuItem>
                  <MenuItem value="GBP">GBP</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControl fullWidth>
                <InputLabel>Period</InputLabel>
                <Select
                  value={salaryPeriod}
                  onChange={(e) => setSalaryPeriod(e.target.value)}
                  label="Period"
                >
                  <MenuItem value="annual">Annual</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info">
                Total compensation package will be calculated including base salary and benefits.
              </Alert>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth required>
                <InputLabel>Contract Type</InputLabel>
                <Select
                  value={contractType}
                  onChange={(e) => setContractType(e.target.value)}
                  label="Contract Type"
                >
                  <MenuItem value="full-time">Full-Time</MenuItem>
                  <MenuItem value="part-time">Part-Time</MenuItem>
                  <MenuItem value="contract">Contract</MenuItem>
                  <MenuItem value="temporary">Temporary</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Probation Period (months)"
                type="number"
                value={probationPeriod}
                onChange={(e) => setProbationPeriod(e.target.value)}
                helperText="Standard probation period"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Work Location"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="e.g., Dubai, UAE"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Work Schedule"
                value={workSchedule}
                onChange={(e) => setWorkSchedule(e.target.value)}
                placeholder="e.g., Monday-Friday, 9:00 AM - 6:00 PM"
              />
            </Grid>
          </Grid>
        );

      case 3:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Standard Benefits
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Annual Leave Days"
                type="number"
                value={annualLeave}
                onChange={(e) => setAnnualLeave(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Flight Tickets per Year"
                type="number"
                value={flightTickets}
                onChange={(e) => setFlightTickets(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Housing Allowance (AED)"
                type="number"
                value={housingAllowance}
                onChange={(e) => setHousingAllowance(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Transportation Allowance (AED)"
                type="number"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Health Insurance</InputLabel>
                <Select
                  value={healthInsurance ? 'yes' : 'no'}
                  onChange={(e) => setHealthInsurance(e.target.value === 'yes')}
                  label="Health Insurance"
                >
                  <MenuItem value="yes">Yes - Included</MenuItem>
                  <MenuItem value="no">No</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Autocomplete
                multiple
                freeSolo
                options={[
                  'Performance Bonus',
                  'Education Allowance',
                  'Gym Membership',
                  'Mobile Allowance',
                  'Meal Allowance',
                  'Professional Development',
                ]}
                value={additionalBenefits}
                onChange={(_, newValue) => setAdditionalBenefits(newValue)}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Additional Benefits"
                    placeholder="Add benefit and press Enter"
                  />
                )}
              />
            </Grid>
          </Grid>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Box display="flex" alignItems="center">
          <DescriptionIcon sx={{ mr: 1 }} />
          Create New Job Offer
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {renderStepContent(activeStep)}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Cancel
        </Button>
        <Box sx={{ flex: '1 1 auto' }} />
        <Button disabled={activeStep === 0} onClick={handleBack}>
          Back
        </Button>
        {activeStep === steps.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={!isStepValid() || loading}
          >
            {loading ? 'Creating...' : 'Create Offer'}
          </Button>
        ) : (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!isStepValid()}
          >
            Next
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default CreateOfferDialog;

