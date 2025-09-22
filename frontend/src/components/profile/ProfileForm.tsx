import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import { UserCog } from 'lucide-react';

interface ProfileFormProps {
  onProfileUpdate?: () => void;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ onProfileUpdate }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [fullName, setFullName] = useState<string>(user?.user_metadata?.full_name as string || '');
  const [bio, setBio] = useState<string>('');
  const [contact, setContact] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  
  const handleSaveProfile = async () => {
    if (!user) return;
    
    try {
      setIsSaving(true);
      
      // Update user metadata via Supabase Auth
      const { error } = await supabase.auth.updateUser({
        data: { 
          full_name: fullName,
          bio,
          contact
        }
      });
      
      if (error) {
        toast({
          title: "Profile update failed",
          description: error.message,
          variant: "destructive"
        });
        return;
      }
      
      toast({
        title: "Profile updated",
        description: "Your profile information has been saved"
      });
      
      if (onProfileUpdate) {
        onProfileUpdate();
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Profile update failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <UserCog className="h-5 w-5 text-emirati-teal" />
          <CardTitle>Edit Profile</CardTitle>
        </div>
        <CardDescription>
          Update your personal information
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full Name</Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Enter your full name"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself"
            className="min-h-[100px]"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contact">Contact Information</Label>
          <Input
            id="contact"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
            placeholder="Phone number or additional contact details"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            value={user?.email || ''}
            disabled
            className="bg-muted cursor-not-allowed"
          />
          <p className="text-xs text-muted-foreground">
            Email address cannot be changed.
          </p>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleSaveProfile} 
          disabled={isSaving || !fullName}
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProfileForm;
