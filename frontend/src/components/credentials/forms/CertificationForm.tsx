
import React from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { CertificationVerificationData } from '@/types/credentialVerification';

interface CertificationFormProps {
  data: CertificationVerificationData;
  setData: React.Dispatch<React.SetStateAction<CertificationVerificationData>>;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
}

const CertificationForm: React.FC<CertificationFormProps> = ({ data, setData, onSubmit, isLoading }) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="certification-emirates-id">Emirates ID *</Label>
          <Input
            id="certification-emirates-id"
            value={data.emirates_id}
            onChange={(e) => setData(prev => ({ ...prev, emirates_id: e.target.value }))}
            placeholder="784-XXXX-XXXXXXX-X"
            required
          />
        </div>
        <div>
          <Label htmlFor="certification-name">Certification Name *</Label>
          <Input
            id="certification-name"
            value={data.certification_name}
            onChange={(e) => setData(prev => ({ ...prev, certification_name: e.target.value }))}
            placeholder="e.g., AWS Certified Solutions Architect"
            required
          />
        </div>
        <div>
          <Label htmlFor="issuing-organization">Issuing Organization *</Label>
          <Input
            id="issuing-organization"
            value={data.issuing_organization}
            onChange={(e) => setData(prev => ({ ...prev, issuing_organization: e.target.value }))}
            placeholder="e.g., Amazon Web Services"
            required
          />
        </div>
        <div>
          <Label htmlFor="certification-number">Certification Number *</Label>
          <Input
            id="certification-number"
            value={data.certification_number}
            onChange={(e) => setData(prev => ({ ...prev, certification_number: e.target.value }))}
            placeholder="e.g., AWS-ASA-12345"
            required
          />
        </div>
        <div>
          <Label htmlFor="issue-date">Issue Date *</Label>
          <Input
            id="issue-date"
            type="date"
            value={data.issue_date}
            onChange={(e) => setData(prev => ({ ...prev, issue_date: e.target.value }))}
            required
          />
        </div>
        <div>
          <Label htmlFor="expiry-date">Expiry Date (Optional)</Label>
          <Input
            id="expiry-date"
            type="date"
            value={data.expiry_date}
            onChange={(e) => setData(prev => ({ ...prev, expiry_date: e.target.value }))}
          />
        </div>
      </div>
      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Verify Certification
      </Button>
    </form>
  );
};

export default CertificationForm;
