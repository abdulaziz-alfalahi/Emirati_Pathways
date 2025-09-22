
import React, { useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Personal } from '../types';

interface PersonalInfoFieldsProps {
  data: Personal;
  onChange: (data: Personal) => void;
}

const PersonalInfoFields: React.FC<PersonalInfoFieldsProps> = ({
  data,
  onChange
}) => {
  // Create a safe data object with fallbacks for nullish values
  const safeData = {
    fullName: data?.fullName || '',
    jobTitle: data?.jobTitle || '',
    email: data?.email || '',
    phone: data?.phone || '',
    location: data?.location || '',
    linkedin: data?.linkedin || '',
    website: data?.website || '',
    ...data // This ensures any additional fields are preserved
  };

  // Log the incoming data for debugging
  useEffect(() => {
    console.log('PersonalInfoFields received data:', data);
  }, [data]);

  const handleInputChange = (field: keyof Personal) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    console.log(`PersonalInfoFields: Updating ${field} to:`, value);
    
    // Use a new object to trigger state updates properly
    const updatedData = {
      ...safeData,
      [field]: value
    };
    
    // Call the parent's onChange with the complete updated object
    onChange(updatedData);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={safeData.fullName}
            onChange={handleInputChange('fullName')}
            placeholder="John Doe"
            aria-label="Full Name"
          />
        </div>
        <div>
          <Label htmlFor="jobTitle">Job Title</Label>
          <Input
            id="jobTitle"
            value={safeData.jobTitle}
            onChange={handleInputChange('jobTitle')}
            placeholder="Software Engineer"
            aria-label="Job Title"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={safeData.email}
            onChange={handleInputChange('email')}
            placeholder="john.doe@example.com"
            aria-label="Email Address"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            value={safeData.phone}
            onChange={handleInputChange('phone')}
            placeholder="+1 (555) 123-4567"
            aria-label="Phone Number"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="location">Location</Label>
        <Input
          id="location"
          value={safeData.location}
          onChange={handleInputChange('location')}
          placeholder="San Francisco, CA"
          aria-label="Location"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="linkedin">LinkedIn (optional)</Label>
          <Input
            id="linkedin"
            value={safeData.linkedin}
            onChange={handleInputChange('linkedin')}
            placeholder="https://linkedin.com/in/johndoe"
            aria-label="LinkedIn Profile URL"
          />
        </div>
        <div>
          <Label htmlFor="website">Website (optional)</Label>
          <Input
            id="website"
            value={safeData.website}
            onChange={handleInputChange('website')}
            placeholder="https://johndoe.com"
            aria-label="Personal Website URL"
          />
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoFields;
