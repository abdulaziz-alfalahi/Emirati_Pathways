
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { sanitizeText, emailSchema } from '@/utils/validation';

const SimpleTestForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    description: ''
  });
  
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [submittedData, setSubmittedData] = useState<null | typeof formData>(null);

  const validateField = (field: string, value: string) => {
    const newErrors = { ...errors };
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          newErrors.name = 'Name is required';
        } else if (value.length < 2) {
          newErrors.name = 'Name must be at least 2 characters';
        } else if (value.length > 100) {
          newErrors.name = 'Name must be less than 100 characters';
        } else {
          delete newErrors.name;
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
      case 'description':
        if (value.length > 500) {
          newErrors.description = 'Description must be less than 500 characters';
        } else {
          delete newErrors.description;
        }
        break;
    }
    
    setErrors(newErrors);
  };

  const handleInputChange = (field: string, value: string) => {
    console.log(`Input changed: ${field} = ${value}`);
    
    // Sanitize the input
    const sanitizedValue = sanitizeText(value);
    
    setFormData(prevData => ({
      ...prevData,
      [field]: sanitizedValue
    }));
    
    // Validate the field
    validateField(field, sanitizedValue);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate all fields before submission
    Object.keys(formData).forEach(field => {
      validateField(field, formData[field as keyof typeof formData]);
    });
    
    // Check if there are any errors
    if (Object.keys(errors).length > 0) {
      console.log('Form has validation errors:', errors);
      return;
    }
    
    console.log('Form submitted with data:', formData);
    setSubmittedData(formData);
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Simple Test Form</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormField
            label="Name"
            description="Enter your full name"
            error={errors.name}
            required
          >
            <Input
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Enter your name"
              maxLength={100}
              required
            />
          </FormField>
          
          <FormField
            label="Email"
            description="We'll never share your email"
            error={errors.email}
            required
          >
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email"
              maxLength={255}
              required
            />
          </FormField>
          
          <FormField
            label="Description"
            description="Tell us about yourself"
            error={errors.description}
          >
            <Textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Write something about yourself"
              className="min-h-[100px]"
              maxLength={500}
            />
          </FormField>
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={Object.keys(errors).length > 0}
          >
            Submit Form
          </Button>
        </form>
        
        {submittedData && (
          <div className="mt-6 p-4 border rounded-md bg-slate-50">
            <h3 className="font-medium mb-2">Submitted Data:</h3>
            <pre className="text-sm whitespace-pre-wrap">
              {JSON.stringify(submittedData, null, 2)}
            </pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SimpleTestForm;
