
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Personal } from '../types';
import PersonalInfoFields from './PersonalInfoFields';

interface ResumePersonalSectionProps {
  data: Personal;
  onChange: (data: Personal) => void;
}

const ResumePersonalSection: React.FC<ResumePersonalSectionProps> = ({
  data,
  onChange
}) => {
  // Log when personal data changes are triggered
  const handlePersonalDataChange = (updatedData: Personal) => {
    console.log('ResumePersonalSection: Updating personal data:', updatedData);
    onChange(updatedData);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
      </CardHeader>
      <CardContent>
        <PersonalInfoFields 
          data={data}
          onChange={handlePersonalDataChange}
        />
      </CardContent>
    </Card>
  );
};

export default ResumePersonalSection;
