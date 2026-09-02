import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
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
  createFilterOptions,
  Chip,
  IconButton,
} from '@mui/material';
import {
  AttachMoney as AttachMoneyIcon,
  CalendarToday as CalendarIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import LocationPicker from '../../common/LocationPicker'; // Adjust path if needed, assuming common is in components/common
import { restClient } from '../../../utils/api';
import { getDisplayName } from '../../../utils/nameUtils';

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

const steps = ['Select Candidate', 'Compensation Details', 'Contract Terms', 'Work Location', 'Benefits & Perks'];

const CreateOfferDialog: React.FC<CreateOfferDialogProps> = ({
  open,
  onClose,
  jdId,
  onOfferCreated,
  preselectedCandidate,
}) => {
  const { user } = useAuth();
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
  const [customBenefitInput, setCustomBenefitInput] = useState('');
  /** What the pre-fill wants the recruiter to check before sending. */
  const [prefillNotes, setPrefillNotes] = useState<string[]>([]);

  const initializedRef = React.useRef(false);

  useEffect(() => {
    if (open && !initializedRef.current) {
      initializedRef.current = true;
      loadCandidates();
      loadJobDescription();
      resetForm();
      prefillFromVacancy();

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
      }
    }
    if (!open) {
      initializedRef.current = false;
    }
  }, [open, jdId]);

  const loadJobDescription = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/jd/${jdId}`);
      if (response.data && response.data.success && response.data.jd) {
        setPositionTitle(response.data.jd.basic_info?.title || '');
      }
    } catch (err) {
      console.error('Error loading JD details:', err);
    }
  };

  /**
   * Pre-fill the offer from the vacancy it came from (fb_1788344147).
   *
   * The values are COPIED, not generated. An offer carries somebody's salary,
   * and a plausible invented figure is worse than an empty box — an empty box
   * gets filled in, a plausible number gets sent. Where the vacancy is silent
   * the field stays empty and says so.
   *
   * Each field arrives with its source, and the notes are surfaced rather than
   * dropped: "where did this salary come from" is the first question anybody
   * sensibly asks of a pre-filled offer.
   */
  const prefillFromVacancy = async (candidateId?: string) => {
    try {
      const params = new URLSearchParams({ jd_id: String(jdId) });
      if (candidateId) params.set('candidate_id', candidateId);
      const res = await restClient.get(`/api/recruiter/offers/prefill?${params}`);
      const d = res?.data?.data;
      if (!d) return;

      const notes: string[] = [];
      const take = (field: any) => {
        if (field?.note) notes.push(field.note);
        return field?.value;
      };

      const title = take(d.position_title);
      if (title) setPositionTitle(String(title));
      const salary = take(d.salary_amount);
      if (salary !== null && salary !== undefined) setSalaryAmount(String(salary));
      const currency = take(d.salary_currency);
      if (currency) setSalaryCurrency(String(currency));
      const period = take(d.salary_period);
      if (period) setSalaryPeriod(String(period));
      const location = take(d.work_location);
      if (location) setWorkLocation(String(location));
      const employment = take(d.employment_type);
      if (employment) setContractType(String(employment).replace('_', '-'));
      const probation = take(d.probation_period_months);
      if (probation !== null && probation !== undefined) setProbationPeriod(String(probation));

      const benefits = take(d.benefits) || {};
      if (benefits.annual_leave_days) setAnnualLeave(String(benefits.annual_leave_days));
      if (typeof benefits.health_insurance === 'boolean') setHealthInsurance(benefits.health_insurance);
      if (benefits.housing_allowance) setHousingAllowance(String(benefits.housing_allowance));
      if (benefits.transportation_allowance) setTransportAllowance(String(benefits.transportation_allowance));
      if (benefits.flight_tickets !== undefined) setFlightTickets(String(benefits.flight_tickets));
      const extra = take(d.additional_benefits);
      if (extra) setAdditionalBenefits(String(extra).split(';').map(x => x.trim()).filter(Boolean));

      setPrefillNotes(notes);
    } catch (err) {
      // A pre-fill that fails leaves an empty form, which is what the dialog
      // did before this existed. It must never block creating an offer.
      console.error('Offer pre-fill failed:', err);
    }
  };

  const loadCandidates = async () => {
    try {
      const response = await restClient.get(`/api/recruiter/shortlist/${jdId}`);
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
    // setPositionTitle(''); // Don't reset position title as it comes from JD
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
        recruiter_id: user?.id || 21, // Get from auth context
        recruiter_name: getDisplayName(user, 'Recruiter'), // Store recruiter name for display
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

      await restClient.post('/api/recruiter/offers/create', offerData);
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
        // Contract Terms: Start Date, Type, Schedule, Probation
        return startDate !== '' && contractType !== '';
      case 3:
        // Work Location
        return workLocation !== '';
      case 4:
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
            <Grid size={12}>
              <Autocomplete
                options={candidates}
                getOptionLabel={(option) =>
                  `${getDisplayName(option)} - ${option.current_job_title} (Match: ${option.match_score}%)`
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
            <Grid size={12}>
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
              <Grid size={12}>
                <Alert severity="info">
                  <Typography variant="body2">
                    <strong>Selected:</strong> {getDisplayName(selectedCandidate)}
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
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={{ xs: 12, md: 3 }}>
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
            <Grid size={12}>
              <Alert severity="info">
                Total compensation package will be calculated including base salary and benefits.
              </Alert>
            </Grid>
          </Grid>
        );

      case 2:
        return (
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
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
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                onBlur={(e) => setStartDate(e.target.value)}
                required
                InputLabelProps={{ shrink: true }}
                helperText="Select the proposed start date"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Probation Period (months)"
                type="number"
                value={probationPeriod}
                onChange={(e) => setProbationPeriod(e.target.value)}
                helperText="Standard probation period"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Work Schedule</InputLabel>
                <Select
                  value={workSchedule}
                  onChange={(e) => setWorkSchedule(e.target.value)}
                  label="Work Schedule"
                >
                  <MenuItem value="Standard (9AM - 6PM)">Standard (9AM - 6PM)</MenuItem>
                  <MenuItem value="Flexible">Flexible</MenuItem>
                  <MenuItem value="Shift Based">Shift Based</MenuItem>
                  <MenuItem value="Remote">Remote</MenuItem>
                  <MenuItem value="Hybrid">Hybrid</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );

      case 3:
        // New Step: Work Location
        return (
          <Box sx={{ height: '450px', display: 'flex', flexDirection: 'column' }}>
            <Typography variant="subtitle1" gutterBottom>
              Select Work Location
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
              Click on the map to pin the exact office location for this role.
            </Typography>
            <Box sx={{ flexGrow: 1, border: '1px solid #e0e0e0', borderRadius: 1, overflow: 'hidden' }}>
              <LocationPicker
                lat={workLocation && workLocation.includes("Lat:") ? parseFloat(workLocation.split("Lat:")[1].split(",")[0]) : undefined}
                lng={workLocation && workLocation.includes("Lng:") ? parseFloat(workLocation.split("Lng:")[1]) : undefined}
                onLocationSelect={(lat, lng) => setWorkLocation(`Lat: ${lat.toFixed(6)}, Lng: ${lng.toFixed(6)}`)}
                height="400px"
              />
            </Box>
            <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
              Selected Coordinates: {workLocation || "None"}
            </Typography>
          </Box>
        );

      case 4:
        return (
          <Grid container spacing={3}>
            <Grid size={12}>
              <Typography variant="h6" gutterBottom>
                Standard Benefits
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Annual Leave Days"
                type="number"
                value={annualLeave}
                onChange={(e) => setAnnualLeave(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Flight Tickets per Year"
                type="number"
                value={flightTickets}
                onChange={(e) => setFlightTickets(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Housing Allowance (AED)"
                type="number"
                value={housingAllowance}
                onChange={(e) => setHousingAllowance(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                fullWidth
                label="Transportation Allowance (AED)"
                type="number"
                value={transportAllowance}
                onChange={(e) => setTransportAllowance(e.target.value)}
              />
            </Grid>
            <Grid size={12}>
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
            <Grid size={12}>
              <Autocomplete
                multiple
                freeSolo
                fullWidth
                options={[
                  'Performance Bonus',
                  'Education Allowance',
                  'Gym Membership',
                  'Mobile Allowance',
                  'Meal Allowance',
                  'Professional Development',
                  'Relocation Assistance',
                  'Stock Options',
                  'Childcare Allowance',
                  'Retirement Plan',
                  'Training Budget',
                  'Remote Work Stipend',
                ].filter(opt => !additionalBenefits.includes(opt))}
                value={additionalBenefits}
                onChange={(_, newValue) => {
                  // Clean up any "Add: ..." prefixes from createFilterOptions
                  const cleaned = newValue.map(v => {
                    if (typeof v === 'string' && v.startsWith('Add "') && v.endsWith('"')) {
                      return v.slice(5, -1);
                    }
                    return v;
                  });
                  setAdditionalBenefits(cleaned);
                }}
                filterOptions={(options, params) => {
                  const filtered = options.filter(option =>
                    option.toLowerCase().includes(params.inputValue.toLowerCase())
                  );
                  // Suggest creating a new value if typed text doesn't match any option
                  if (params.inputValue !== '' && !filtered.some(o => o.toLowerCase() === params.inputValue.toLowerCase())) {
                    filtered.push(`Add "${params.inputValue}"`);
                  }
                  return filtered;
                }}
                ListboxProps={{
                  style: {
                    maxHeight: '250px',
                  }
                }}
                componentsProps={{
                  popper: {
                    style: {
                      width: 'fit-content',
                      minWidth: '300px'
                    }
                  }
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip label={option} {...getTagProps({ index })} size="small" color="primary" variant="outlined" />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Additional Benefits"
                    placeholder={additionalBenefits.length === 0 ? 'Select or type custom benefits' : 'Add more...'}
                    fullWidth
                    helperText="Select from suggestions or type a custom benefit and press Enter"
                  />
                )}
              />
            </Grid>
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  size="small"
                  label="Custom Benefit"
                  placeholder="e.g. Company Car, Tuition Reimbursement"
                  value={customBenefitInput}
                  onChange={(e) => setCustomBenefitInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && customBenefitInput.trim()) {
                      e.preventDefault();
                      if (!additionalBenefits.includes(customBenefitInput.trim())) {
                        setAdditionalBenefits([...additionalBenefits, customBenefitInput.trim()]);
                      }
                      setCustomBenefitInput('');
                    }
                  }}
                  sx={{ flex: 1 }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<AddIcon />}
                  disabled={!customBenefitInput.trim()}
                  onClick={() => {
                    if (customBenefitInput.trim() && !additionalBenefits.includes(customBenefitInput.trim())) {
                      setAdditionalBenefits([...additionalBenefits, customBenefitInput.trim()]);
                    }
                    setCustomBenefitInput('');
                  }}
                >
                  Add
                </Button>
              </Box>
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
      <DialogContent dividers sx={{ minHeight: '500px', maxHeight: '70vh' }}>
        <Box sx={{ mt: 2 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {/* What the pre-fill copied, and what it could not. Surfaced rather
              than dropped: "where did this salary come from" is the first
              question anybody sensibly asks of a pre-filled offer, and a note
              the backend wrote but the screen swallowed would leave the
              recruiter to find out by sending it. */}
          {prefillNotes.length > 0 && (
            <Alert severity="info" sx={{ mb: 3 }}>
              <strong>Filled in from the vacancy — please check:</strong>
              <ul style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
                {prefillNotes.map((n, i) => <li key={i}>{n}</li>)}
              </ul>
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <Box sx={{ minHeight: '350px', pb: 2 }}>
            {renderStepContent(activeStep)}
          </Box>
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

