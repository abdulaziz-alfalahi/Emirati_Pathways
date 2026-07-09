
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface AdvisoryPosition {
  id: string;
  title: string;
  organization: string;
  description: string;
  requirements: string;
}

interface ApplyDialogProps {
  position: AdvisoryPosition;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplicationSubmitted: () => void;
}

export const ApplyDialog: React.FC<ApplyDialogProps> = ({
  position,
  open,
  onOpenChange,
  onApplicationSubmitted
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    coverLetter: '',
    resumeUrl: '',
    additionalDocuments: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);

    try {
      // Check if user already applied
      const { data: existingApplication } = await supabase
        .from('advisory_applications')
        .select('id')
        .eq('position_id', position.id)
        .eq('user_id', user.id)
        .single();

      if (existingApplication) {
        toast({
          title: "Already Applied",
          description: "You have already submitted an application for this position.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from('advisory_applications')
        .insert({
          position_id: position.id,
          user_id: user.id,
          cover_letter: formData.coverLetter,
          resume_url: formData.resumeUrl,
          additional_documents: formData.additionalDocuments ? [formData.additionalDocuments] : [],
          status: 'pending'
        });

      if (error) {
        console.error('Error submitting application:', error);
        toast({
          title: "Error",
          description: "Failed to submit application. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully. You'll hear back from the organization soon.",
      });

      onOpenChange(false);
      onApplicationSubmitted();
      setFormData({ coverLetter: '', resumeUrl: '', additionalDocuments: '' });
    } catch (error) {
      console.error('Error submitting application:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Apply for {position.title}</DialogTitle>
          <p className="text-gray-600">{position.organization}</p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">Position Requirements:</h4>
            <p className="text-sm text-gray-600">{position.requirements}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="coverLetter">Cover Letter *</Label>
            <Textarea
              id="coverLetter"
              placeholder="Explain why you're interested in this advisory position and how your experience aligns with the requirements..."
              value={formData.coverLetter}
              onChange={(e) => setFormData(prev => ({ ...prev, coverLetter: e.target.value }))}
              rows={6}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resumeUrl">Resume/CV URL</Label>
            <Input
              id="resumeUrl"
              type="url"
              placeholder="https://..."
              value={formData.resumeUrl}
              onChange={(e) => setFormData(prev => ({ ...prev, resumeUrl: e.target.value }))}
            />
            <p className="text-xs text-gray-500">
              Provide a link to your resume or CV (Google Drive, Dropbox, etc.)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="additionalDocuments">Additional Documents URL</Label>
            <Input
              id="additionalDocuments"
              type="url"
              placeholder="https://..."
              value={formData.additionalDocuments}
              onChange={(e) => setFormData(prev => ({ ...prev, additionalDocuments: e.target.value }))}
            />
            <p className="text-xs text-gray-500">
              Optional: Portfolio, certifications, or other relevant documents
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Submitting...' : 'Submit Application'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
