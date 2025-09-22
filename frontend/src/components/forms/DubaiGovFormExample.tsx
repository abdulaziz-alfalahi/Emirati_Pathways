
import React, { useState } from 'react';
import { FormField } from '@/components/ui/form-field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DubaiGovFormExample: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    emiratesId: '',
    description: '',
    emirate: '',
    gender: '',
    terms: false,
    newsletter: false
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<Record<string, string>>({});

  const validateField = (name: string, value: any) => {
    const newErrors = { ...errors };
    const newSuccess = { ...success };
    
    switch (name) {
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email address';
          delete newSuccess.email;
        } else if (value) {
          delete newErrors.email;
          newSuccess.email = 'Email format is valid';
        } else {
          delete newErrors.email;
          delete newSuccess.email;
        }
        break;
      case 'emiratesId':
        if (value && !/^\d{3}-\d{4}-\d{7}-\d{1}$/.test(value)) {
          newErrors.emiratesId = 'Please enter Emirates ID in format: 784-XXXX-XXXXXXX-X';
          delete newSuccess.emiratesId;
        } else if (value) {
          delete newErrors.emiratesId;
          newSuccess.emiratesId = 'Emirates ID format is valid';
        } else {
          delete newErrors.emiratesId;
          delete newSuccess.emiratesId;
        }
        break;
      default:
        break;
    }
    
    setErrors(newErrors);
    setSuccess(newSuccess);
  };

  const handleInputChange = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    validateField(name, value);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-ehrdc-teal">Dubai Government Standard Form Components</CardTitle>
          <CardDescription>
            Demonstrating standardized form components with WCAG AA compliance and Dubai Government styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Text Input with validation */}
            <FormField
              label="Full Name"
              description="Enter your full name as it appears on your Emirates ID"
              required
            >
              <Input
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="Ahmed Mohammed Al Rashid"
              />
            </FormField>

            {/* Email with validation */}
            <FormField
              label="Email Address"
              description="We'll use this to send important updates about your application"
              error={errors.email}
              success={success.email}
              required
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="ahmed.alrashid@email.com"
              />
            </FormField>

            {/* Emirates ID with custom validation */}
            <FormField
              label="Emirates ID"
              description="15-digit Emirates ID number with dashes"
              error={errors.emiratesId}
              success={success.emiratesId}
              required
            >
              <Input
                value={formData.emiratesId}
                onChange={(e) => handleInputChange('emiratesId', e.target.value)}
                placeholder="784-1234-1234567-1"
                maxLength={18}
              />
            </FormField>

            {/* Select Dropdown */}
            <FormField
              label="Emirate"
              description="Select your emirate of residence"
              required
            >
              <Select value={formData.emirate} onValueChange={(value) => handleInputChange('emirate', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an emirate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dubai">Dubai</SelectItem>
                  <SelectItem value="abudhabi">Abu Dhabi</SelectItem>
                  <SelectItem value="sharjah">Sharjah</SelectItem>
                  <SelectItem value="ajman">Ajman</SelectItem>
                  <SelectItem value="ummalquwain">Umm Al Quwain</SelectItem>
                  <SelectItem value="rasalkhaimah">Ras Al Khaimah</SelectItem>
                  <SelectItem value="fujairah">Fujairah</SelectItem>
                </SelectContent>
              </Select>
            </FormField>

            {/* Radio Group */}
            <FormField
              label="Gender"
              description="Please select your gender"
              required
            >
              <RadioGroup value={formData.gender} onValueChange={(value) => handleInputChange('gender', value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="male" id="male" />
                  <Label htmlFor="male" className="font-normal cursor-pointer">Male</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="female" id="female" />
                  <Label htmlFor="female" className="font-normal cursor-pointer">Female</Label>
                </div>
              </RadioGroup>
            </FormField>

            {/* Textarea */}
            <FormField
              label="Additional Information"
              description="Please provide any additional information that may be relevant to your application"
            >
              <Textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Enter any additional details here..."
                rows={4}
              />
            </FormField>

            {/* Checkboxes */}
            <div className="space-y-4">
              <FormField
                label="Terms and Conditions"
                required
              >
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="terms"
                    checked={formData.terms}
                    onCheckedChange={(checked) => handleInputChange('terms', checked)}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal cursor-pointer leading-relaxed">
                    I agree to the <a href="#" className="text-ehrdc-teal hover:text-ehrdc-dark-teal underline">Terms and Conditions</a> and 
                    <a href="#" className="text-ehrdc-teal hover:text-ehrdc-dark-teal underline ml-1">Privacy Policy</a> of the Dubai Government
                  </Label>
                </div>
              </FormField>

              <FormField label="Newsletter Subscription">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="newsletter"
                    checked={formData.newsletter}
                    onCheckedChange={(checked) => handleInputChange('newsletter', checked)}
                  />
                  <Label htmlFor="newsletter" className="text-sm font-normal cursor-pointer leading-relaxed">
                    Subscribe to receive updates about new government services and initiatives
                  </Label>
                </div>
              </FormField>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Submit Application
              </Button>
              <Button type="button" variant="outline">
                Save as Draft
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default DubaiGovFormExample;
