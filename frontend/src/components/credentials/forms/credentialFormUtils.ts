
import { useToast } from '@/hooks/use-toast';
import { credentialVerificationService } from '@/services/credentialVerification/credentialVerificationService';
import {
  EducationVerificationData,
  EmploymentVerificationData,
  CertificationVerificationData
} from '@/types/credentialVerification';

export const getInitialEducationData = (): EducationVerificationData => ({
  emirates_id: '',
  institution_name: '',
  degree_type: '',
  field_of_study: '',
  graduation_year: new Date().getFullYear(),
  gpa: undefined
});

export const getInitialEmploymentData = (): EmploymentVerificationData => ({
  emirates_id: '',
  employer_name: '',
  job_title: '',
  start_date: '',
  end_date: '',
  salary_range: '',
  employment_type: 'full_time'
});

export const getInitialCertificationData = (): CertificationVerificationData => ({
  emirates_id: '',
  certification_name: '',
  issuing_organization: '',
  issue_date: '',
  expiry_date: '',
  certification_number: ''
});

export const useCredentialSubmission = (
  userId: string,
  onVerificationComplete: () => void
) => {
  const { toast } = useToast();

  const handleEducationSubmit = async (
    data: EducationVerificationData,
    setLoading: (loading: boolean) => void,
    resetForm: () => void
  ) => {
    if (!data.emirates_id || !data.institution_name || !data.degree_type) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await credentialVerificationService.verifyEducationCredentials(userId, data);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Education credentials verified successfully',
        });
        onVerificationComplete();
        resetForm();
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'Could not verify education credentials',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEmploymentSubmit = async (
    data: EmploymentVerificationData,
    setLoading: (loading: boolean) => void,
    resetForm: () => void
  ) => {
    if (!data.emirates_id || !data.employer_name || !data.job_title) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await credentialVerificationService.verifyEmploymentCredentials(userId, data);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Employment credentials verified successfully',
        });
        onVerificationComplete();
        resetForm();
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'Could not verify employment credentials',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCertificationSubmit = async (
    data: CertificationVerificationData,
    setLoading: (loading: boolean) => void,
    resetForm: () => void
  ) => {
    if (!data.emirates_id || !data.certification_name || !data.certification_number) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const result = await credentialVerificationService.verifyCertificationCredentials(userId, data);
      
      if (result.success) {
        toast({
          title: 'Success',
          description: 'Certification credentials verified successfully',
        });
        onVerificationComplete();
        resetForm();
      } else {
        toast({
          title: 'Verification Failed',
          description: result.error || 'Could not verify certification credentials',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during verification',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return {
    handleEducationSubmit,
    handleEmploymentSubmit,
    handleCertificationSubmit
  };
};
