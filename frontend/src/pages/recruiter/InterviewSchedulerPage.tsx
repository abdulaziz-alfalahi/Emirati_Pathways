import React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Box, Container, Typography, IconButton } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate } from 'react-router-dom';
import InterviewScheduler from '@/components/recruiter/interviews/InterviewScheduler';

const InterviewSchedulerPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const jdId = searchParams.get('jdId') || 'jd_test_001'; // Default for testing

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Interview Scheduler
        </Typography>
      </Box>

      <InterviewScheduler jdId={jdId} />
    </Container>
  );
};

export default InterviewSchedulerPage;

