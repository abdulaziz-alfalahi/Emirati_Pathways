
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { EmploymentVerificationData } from '@/types/credentialVerification';

interface EmploymentFormProps {
  data: EmploymentVerificationData;
  setData: React.Dispatch<React.SetStateAction<EmploymentVerificationData>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const EmploymentForm: React.FC<EmploymentFormProps> = ({ data, setData, onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="employment-emirates-id">Emirates ID *</Label>
          <Input
            id="employment-emirates-id"
            value={data.emirates_id}
            onChange={(e) => setData(prev => ({ ...prev, emirates_id: e.target.value }))}
            placeholder="784-XXXX-XXXXXXX-X"
            required
          />
        </div>
        <div>
          <Label htmlFor="employer-name">Employer Name *</Label>
          <Input
            id="employer-name"
            value={data.employer_name}
            onChange={(e) => setData(prev => ({ ...prev, employer_name: e.target.value }))}
            placeholder="e.g., Emirates Group"
            required
          />
        </div>
        <div>
          <Label htmlFor="job-title">Job Title *</Label>
          <Input
            id="job-title"
            value={data.job_title}
            onChange={(e) => setData(prev => ({ ...prev, job_title: e.target.value }))}
            placeholder="e.g., Software Developer"
            required
          />
        </div>
        <div>
          <Label htmlFor="employment-type">Employment Type</Label>
          <Select
            value={data.employment_type}
            onValueChange={(value: any) => setData(prev => ({ ...prev, employment_type: value }))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_time">Full Time</SelectItem>
              <SelectItem value="part_time">Part Time</SelectItem>
              <SelectItem value="contract">Contract</SelectItem>
              <SelectItem value="internship">Internship</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="start-date">Start Date *</Label>
          <Input
            id="start-date"
            type="date"
            value={data.start_date}
            onChange={(e) => setData(prev => ({ ...prev, start_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="end-date">End Date (Optional)</Label>
          <Input
            id="end-date"
            type="date"
            value={data.end_date}
            onChange={(e) => setData(prev => ({ ...prev, end_date: e.target.value }))}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="me-2 h-4 w-4 animate-spin" />}
        Verify Employment Credentials
      </Button>
    </form>
  );
};

export default EmploymentForm;
