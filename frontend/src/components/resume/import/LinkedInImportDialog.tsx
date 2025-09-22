
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Linkedin } from 'lucide-react';
import { ResumeData } from '../types';
import { toast } from 'sonner';
import { processLinkedInProfile, mergeResumeData } from './importUtils';
import { supabase } from '@/integrations/supabase/client';

interface LinkedInImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImportComplete: (data: ResumeData) => void;
  currentData: ResumeData;
}

const LinkedInImportDialog: React.FC<LinkedInImportDialogProps> = ({ 
  open, 
  onOpenChange, 
  onImportComplete,
  currentData 
}) => {
  const [linkedInUrl, setLinkedInUrl] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);

  const handleLinkedInExtract = async () => {
    setIsExtracting(true);
    const toastId = toast.loading("Connecting to LinkedIn", {
      description: "Extracting your profile data...",
    });
    
    try {
      const { parsedData } = await processLinkedInProfile(linkedInUrl);
      console.log('LinkedIn data extracted:', parsedData);
      
      if (typeof onImportComplete === 'function') {
        const mergedData = mergeResumeData(currentData, parsedData);
        console.log('Merged LinkedIn data:', mergedData);
        onImportComplete(mergedData);
        
        toast.success("LinkedIn Import Complete", {
          id: toastId,
          description: "Your LinkedIn profile data has been imported and merged with your current resume.",
        });
      } else {
        console.error('Error: onImportComplete is not a function for LinkedIn import');
        toast.error("Application Error", {
          id: toastId,
          description: "There was a problem updating the resume data. Please refresh the page and try again.",
        });
      }
      
      onOpenChange(false);
    } catch (error) {
      toast.error("LinkedIn Import Failed", {
        id: toastId,
        description: error instanceof Error ? error.message : "Failed to extract data from LinkedIn",
      });
    } finally {
      setIsExtracting(false);
      setLinkedInUrl('');
    }
  };

  const handleLinkedInAuth = async () => {
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${window.location.origin}/resume-builder?linkedin_auth=true`,
          scopes: 'r_liteprofile r_emailaddress',
        }
      });
      
      if (error) {
        throw error;
      }
      
      console.log('LinkedIn auth initiated:', data);
    } catch (error) {
      console.error('LinkedIn auth error:', error);
      toast.error("LinkedIn Authentication Failed", {
        description: error instanceof Error ? error.message : "Failed to authenticate with LinkedIn",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Import from LinkedIn</DialogTitle>
          <DialogDescription>
            Enter your LinkedIn profile URL to import your professional information.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="linkedin-url">LinkedIn Profile URL</Label>
            <Input
              id="linkedin-url"
              type="text"
              placeholder="https://linkedin.com/in/yourprofile"
              value={linkedInUrl}
              onChange={(e) => setLinkedInUrl(e.target.value)}
              disabled={isExtracting}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Example: https://linkedin.com/in/yourprofile
            </p>
          </div>
          
          <div className="flex justify-between">
            <Button 
              variant="ghost" 
              onClick={() => onOpenChange(false)}
              disabled={isExtracting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleLinkedInExtract}
              disabled={isExtracting || !linkedInUrl.trim()}
            >
              {isExtracting ? 'Extracting...' : 'Extract Data'}
            </Button>
          </div>
          
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground mb-2">
              Alternatively, you can sign in with LinkedIn for better results:
            </p>
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={handleLinkedInAuth}
              disabled={isExtracting}
            >
              <Linkedin size={16} className="mr-2" />
              Sign in with LinkedIn
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default LinkedInImportDialog;
