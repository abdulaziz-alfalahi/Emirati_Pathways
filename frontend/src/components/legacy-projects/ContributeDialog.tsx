
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LegacyProject } from '@/types/legacyProject';
import { legacyProjectService } from '@/services/legacyProjectService';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

interface ContributeDialogProps {
  project: LegacyProject;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ContributeDialog: React.FC<ContributeDialogProps> = ({
  project,
  open,
  onOpenChange
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    contribution_type: '',
    amount: '',
    hours_contributed: '',
    skills_provided: '',
    description: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to contribute to projects",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    
    try {
      const contributionData = {
        project_id: project.id,
        user_id: user.id,
        contribution_type: formData.contribution_type as 'financial' | 'time' | 'skills' | 'resources',
        currency: project.funding_currency,
        status: 'active' as const,
        ...(formData.amount && { amount: parseFloat(formData.amount) }),
        ...(formData.hours_contributed && { hours_contributed: parseInt(formData.hours_contributed) }),
        ...(formData.skills_provided && { skills_provided: formData.skills_provided.split(',').map(s => s.trim()) }),
        ...(formData.description && { description: formData.description })
      };

      await legacyProjectService.submitContribution(contributionData);
      
      toast({
        title: "Contribution Submitted",
        description: "Thank you for your contribution to this project!",
      });
      
      onOpenChange(false);
      setFormData({
        contribution_type: '',
        amount: '',
        hours_contributed: '',
        skills_provided: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting contribution:', error);
      toast({
        title: "Error",
        description: "Failed to submit contribution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
          </DialogHeader>
          <div className="text-center py-6">
            <p className="mb-4">Please sign in to contribute to this project.</p>
            <Button onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Contribute to {project.title}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="contribution_type">Contribution Type</Label>
            <Select
              value={formData.contribution_type}
              onValueChange={(value) => setFormData({ ...formData, contribution_type: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Select contribution type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="financial">Financial</SelectItem>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="skills">Skills</SelectItem>
                <SelectItem value="resources">Resources</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.contribution_type === 'financial' && (
            <div>
              <Label htmlFor="amount">Amount ({project.funding_currency})</Label>
              <Input
                id="amount"
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="Enter amount"
                min="1"
                required
              />
            </div>
          )}

          {formData.contribution_type === 'time' && (
            <div>
              <Label htmlFor="hours">Hours per Week</Label>
              <Input
                id="hours"
                type="number"
                value={formData.hours_contributed}
                onChange={(e) => setFormData({ ...formData, hours_contributed: e.target.value })}
                placeholder="Enter hours"
                min="1"
                required
              />
            </div>
          )}

          {formData.contribution_type === 'skills' && (
            <div>
              <Label htmlFor="skills">Skills (comma-separated)</Label>
              <Input
                id="skills"
                value={formData.skills_provided}
                onChange={(e) => setFormData({ ...formData, skills_provided: e.target.value })}
                placeholder="e.g., web development, project management"
                required
              />
            </div>
          )}

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe your contribution..."
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 me-2 animate-spin" />}
              Submit Contribution
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
