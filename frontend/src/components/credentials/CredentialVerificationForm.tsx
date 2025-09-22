
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, GraduationCap, Briefcase, Award } from 'lucide-react';
import EducationForm from './forms/EducationForm';
import EmploymentForm from './forms/EmploymentForm';
import CertificationForm from './forms/CertificationForm';
import {
  getInitialEducationData,
  getInitialEmploymentData,
  getInitialCertificationData,
  useCredentialSubmission
} from './forms/credentialFormUtils';

interface CredentialVerificationFormProps {
  userId: string;
  onVerificationComplete: () => void;
}

const CredentialVerificationForm: React.FC<CredentialVerificationFormProps> = ({
  userId,
  onVerificationComplete
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('education');

  // Form state
  const [educationData, setEducationData] = useState(getInitialEducationData());
  const [employmentData, setEmploymentData] = useState(getInitialEmploymentData());
  const [certificationData, setCertificationData] = useState(getInitialCertificationData());

  const {
    handleEducationSubmit,
    handleEmploymentSubmit,
    handleCertificationSubmit
  } = useCredentialSubmission(userId, onVerificationComplete);

  const onEducationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleEducationSubmit(
      educationData,
      setIsLoading,
      () => setEducationData(getInitialEducationData())
    );
  };

  const onEmploymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleEmploymentSubmit(
      employmentData,
      setIsLoading,
      () => setEmploymentData(getInitialEmploymentData())
    );
  };

  const onCertificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await handleCertificationSubmit(
      certificationData,
      setIsLoading,
      () => setCertificationData(getInitialCertificationData())
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Shield className="mr-2 h-5 w-5" />
          Verify Your Credentials
        </CardTitle>
        <CardDescription>
          Securely verify your education, employment, and certification credentials with UAE national databases
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="education" className="flex items-center">
              <GraduationCap className="mr-2 h-4 w-4" />
              Education
            </TabsTrigger>
            <TabsTrigger value="employment" className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Employment
            </TabsTrigger>
            <TabsTrigger value="certification" className="flex items-center">
              <Award className="mr-2 h-4 w-4" />
              Certifications
            </TabsTrigger>
          </TabsList>

          <TabsContent value="education" className="space-y-4">
            <EducationForm
              data={educationData}
              setData={setEducationData}
              onSubmit={onEducationSubmit}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="employment" className="space-y-4">
            <EmploymentForm
              data={employmentData}
              setData={setEmploymentData}
              onSubmit={onEmploymentSubmit}
              isLoading={isLoading}
            />
          </TabsContent>

          <TabsContent value="certification" className="space-y-4">
            <CertificationForm
              data={certificationData}
              setData={setCertificationData}
              onSubmit={onCertificationSubmit}
              isLoading={isLoading}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CredentialVerificationForm;
