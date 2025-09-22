
import React from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { sanitizeText, emailSchema, phoneSchema } from '@/utils/validation';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
}

const TestPersonalInfoFields = () => {
  const [data, setData] = React.useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: ''
  });
  
  const [errors, setErrors] = React.useState<{[key: string]: string}>({});
  const [submittedData, setSubmittedData] = React.useState<PersonalInfo | null>(null);

  const validateField = (field: keyof PersonalInfo, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'fullName':
        if (!value.trim()) {
          newErrors.fullName = 'Full name is required';
        } else if (value.length < 2) {
          newErrors.fullName = 'Full name must be at least 2 characters';
        } else if (value.length > 100) {
          newErrors.fullName = 'Full name must be less than 100 characters';
        } else {
          delete newErrors.fullName;
        }
        break;
      case 'email':
        if (!value.trim()) {
          newErrors.email = 'Email is required';
        } else {
          try {
            emailSchema.parse(value);
            delete newErrors.email;
          } catch (e) {
            newErrors.email = 'Please enter a valid email address';
          }
        }
        break;
      case 'phone':
        if (value.trim()) {
          try {
            phoneSchema.parse(value);
            delete newErrors.phone;
          } catch (e) {
            newErrors.phone = 'Please enter a valid phone number';
          }
        } else {
          delete newErrors.phone;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: keyof PersonalInfo) => (value: string) => {
    console.log(`Updating ${field} to:`, value);
    
    // Sanitize the input
    const sanitizedValue = sanitizeText(value);
    
    setData(prevData => ({
      ...prevData,
      [field]: sanitizedValue
    }));
    
    // Validate the field
    validateField(field, sanitizedValue);
    
    console.log("Current state after update request:", data);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    Object.keys(data).forEach(field => {
      validateField(field as keyof PersonalInfo, data[field as keyof PersonalInfo]);
    });
    
    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      console.log('Form has validation errors:', errors);
      return;
    }
    
    console.log("Submitting data:", data);
    setSubmittedData(data);
  };

  console.log("Component rendering with data:", data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Info Test Fields</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Full Name"
            description="Enter your complete name"
            error={errors.fullName}
            required
          >
            <Input
              value={data.fullName}
              onChange={(e) => handleInputChange('fullName')(e.target.value)}
              placeholder="John Doe"
              maxLength={100}
              required
            />
          </FormField>

          <FormField
            label="Email"
            description="Your email address"
            error={errors.email}
            required
          >
            <Input
              type="email"
              value={data.email}
              onChange={(e) => handleInputChange('email')(e.target.value)}
              placeholder="john.doe@example.com"
              maxLength={255}
              required
            />
          </FormField>

          <FormField
            label="Phone"
            description="Your contact number"
            error={errors.phone}
          >
            <Input
              type="tel"
              value={data.phone}
              onChange={(e) => handleInputChange('phone')(e.target.value)}
              placeholder="+1 (555) 123-4567"
              maxLength={20}
            />
          </FormField>
          
          <Button 
            type="submit"
            disabled={Object.keys(errors).length > 0}
          >
            Submit
          </Button>
        </form>
        
        {submittedData && (
          <div className="mt-6 p-4 border rounded-md bg-slate-50">
            <h3 className="font-medium mb-2">Submitted Personal Info:</h3>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TestPersonalInfoFields;
