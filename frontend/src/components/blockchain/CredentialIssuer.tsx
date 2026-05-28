
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { blockchainCredentialService } from '@/services/blockchain/blockchainCredentialService';
import { CredentialIssueRequest } from '@/types/blockchainCredentials';
import { Award, Plus, X } from 'lucide-react';

interface CredentialIssuerProps {
  onCredentialIssued?: () => void;
}

const CredentialIssuer: React.FC<CredentialIssuerProps> = ({ onCredentialIssued }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isIssuing, setIsIssuing] = useState(false);
  const [recipientId, setRecipientId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [credentialType, setCredentialType] = useState<'certification' | 'degree' | 'skill_badge' | 'completion_certificate'>('certification');
  const [skills, setSkills] = useState<string[]>([]);
  const [newSkill, setNewSkill] = useState('');

  const handleAddSkill = () => {
    if (newSkill.trim() && !skills.includes(newSkill.trim())) {
      setSkills([...skills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter(skill => skill !== skillToRemove));
  };

  const handleIssueCredential = async () => {
    if (!user?.id) {
      toast({
        title: 'Authentication Required',
        description: 'You must be logged in to issue credentials',
        variant: 'destructive'
      });
      return;
    }

    if (!recipientId.trim() || !title.trim()) {
      toast({
        title: 'Missing Information',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setIsIssuing(true);
    try {
      const request: CredentialIssueRequest = {
        recipientId: recipientId.trim(),
        issuerId: user.id,
        credentialType,
        title: title.trim(),
        description: description.trim(),
        skills: skills.length > 0 ? skills : undefined,
        metadata: {
          issuer_name: user.user_metadata?.full_name || 'Unknown Issuer',
          issued_by_platform: 'Emirati Human Development Platform'
        }
      };

      await blockchainCredentialService.issueCredential(request);

      toast({
        title: 'Credential Issued Successfully',
        description: 'The digital credential has been created and secured on the blockchain'
      });

      // Reset form
      setRecipientId('');
      setTitle('');
      setDescription('');
      setCredentialType('certification');
      setSkills([]);

      onCredentialIssued?.();
    } catch (error) {
      toast({
        title: 'Issuance Failed',
        description: 'Failed to issue the digital credential. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsIssuing(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Award className="mr-2 h-5 w-5" />
          Issue Digital Credential
        </CardTitle>
        <CardDescription>
          Create a new blockchain-secured digital credential for a recipient
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="recipientId">Recipient ID *</Label>
            <Input
              id="recipientId"
              placeholder="Enter recipient's user ID"
              value={recipientId}
              onChange={(e) => setRecipientId(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="credentialType">Credential Type *</Label>
            <Select value={credentialType} onValueChange={(value: any) => setCredentialType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="certification">Certification</SelectItem>
                <SelectItem value="degree">Academic Degree</SelectItem>
                <SelectItem value="skill_badge">Skill Badge</SelectItem>
                <SelectItem value="completion_certificate">Completion Certificate</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="title">Credential Title *</Label>
          <Input
            id="title"
            placeholder="e.g., AWS Cloud Practitioner Certification"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            placeholder="Describe what this credential represents..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label>Skills Covered</Label>
          <div className="flex space-x-2">
            <Input
              placeholder="Add a skill..."
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
            />
            <Button type="button" variant="outline" onClick={handleAddSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="flex items-center gap-1">
                  {skill}
                  <X
                    className="h-3 w-3 cursor-pointer"
                    onClick={() => handleRemoveSkill(skill)}
                  />
                </Badge>
              ))}
            </div>
          )}
        </div>

        <Button
          onClick={handleIssueCredential}
          disabled={isIssuing}
          className="w-full"
        >
          {isIssuing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
              Issuing Credential...
            </>
          ) : (
            <>
              <Award className="h-4 w-4 mr-2" />
              Issue Credential
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
};

export default CredentialIssuer;
