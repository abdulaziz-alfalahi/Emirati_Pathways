
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EducationVerificationData } from '@/types/credentialVerification';

interface EducationFormProps {
  data: EducationVerificationData;
  setData: React.Dispatch<React.SetStateAction<EducationVerificationData>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const EducationForm: React.FC<EducationFormProps> = ({ data, setData, onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="education-emirates-id">Emirates ID *</Label>
          <Input
            id="education-emirates-id"
            value={data.emirates_id}
            onChange={(e) => setData(prev => ({ ...prev, emirates_id: e.target.value }))}
            placeholder="784-XXXX-XXXXXXX-X"
            required
          />
        </div>
        <div>
          <Label htmlFor="institution-name">Institution Name *</Label>
          <Input
            id="institution-name"
            value={data.institution_name}
            onChange={(e) => setData(prev => ({ ...prev, institution_name: e.target.value }))}
            placeholder="e.g., American University of Sharjah"
            required
          />
        </div>
        <div>
          <Label htmlFor="degree-type">Degree Type *</Label>
          <Select
            value={data.degree_type}
            onValueChange={(value) => setData(prev => ({ ...prev, degree_type: value }))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select degree type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="high_school">High School Diploma</SelectItem>
              <SelectItem value="associate">Associate Degree</SelectItem>
              <SelectItem value="bachelor">Bachelor's Degree</SelectItem>
              <SelectItem value="master">Master's Degree</SelectItem>
              <SelectItem value="phd">PhD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="field-of-study">Field of Study</Label>
          <Input
            id="field-of-study"
            value={data.field_of_study}
            onChange={(e) => setData(prev => ({ ...prev, field_of_study: e.target.value }))}
            placeholder="e.g., Computer Science"
          />
        </div>
        <div>
          <Label htmlFor="graduation-year">Graduation Year</Label>
          <Input
            id="graduation-year"
            type="number"
            min="1950"
            max={new Date().getFullYear()}
            value={data.graduation_year}
            onChange={(e) => setData(prev => ({ ...prev, graduation_year: parseInt(e.target.value) }))}
          />
        </div>
        <div>
          <Label htmlFor="gpa">GPA (Optional)</Label>
          <Input
            id="gpa"
            type="number"
            min="0"
            max="4"
            step="0.01"
            value={data.gpa || ''}
            onChange={(e) => setData(prev => ({ ...prev, gpa: e.target.value ? parseFloat(e.target.value) : undefined }))}
            placeholder="e.g., 3.75"
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        Verify Education Credentials
      </Button>
    </form>
  );
};

export default EducationForm;
