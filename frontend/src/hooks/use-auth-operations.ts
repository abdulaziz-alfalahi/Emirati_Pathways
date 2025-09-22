
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { UserRole } from '@/types/auth';

export const useAuthOperations = (setIsLoading: (loading: boolean) => void) => {
  const { toast } = useToast();

  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      console.log('Attempting to sign in with:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        
        let errorMessage = 'Sign in failed. Please try again.';
        
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and click the confirmation link before signing in.';
        } else if (error.message.includes('Too many requests')) {
          errorMessage = 'Too many sign in attempts. Please wait a moment and try again.';
        }
        
        toast({
          title: "Sign in failed",
          description: errorMessage,
          variant: "destructive"
        });
        throw error;
      }
      
      if (data.user) {
        console.log('Sign in successful:', data.user.id);
        toast({
          title: "Welcome back!",
          description: "You've successfully signed in."
        });
      }
      
      return data;
    } catch (error) {
      console.error('Error in signIn:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName: string, roles: UserRole[]) => {
    try {
      setIsLoading(true);
      
      const redirectUrl = `${window.location.origin}/`;
      
      const { data: userData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (signUpError) {
        let errorMessage = 'Registration failed. Please try again.';
        
        if (signUpError.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please try signing in instead.';
        } else if (signUpError.message.includes('Password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        }
        
        toast({
          title: "Registration failed",
          description: errorMessage,
          variant: "destructive"
        });
        throw signUpError;
      }

      if (!userData.user) {
        throw new Error('User creation failed');
      }

      // Assign roles using the edge function
      const roleAssignmentPromises = roles.map(role => 
        supabase.functions.invoke('assign-user-role', {
          body: { 
            userId: userData.user.id,
            role: role
          }
        })
      );

      const roleResults = await Promise.allSettled(roleAssignmentPromises);
      
      const failedRoles = roleResults
        .map((result, index) => ({ result, role: roles[index] }))
        .filter(({ result }) => result.status === 'rejected')
        .map(({ role }) => role);

      if (failedRoles.length > 0) {
        console.warn('Some role assignments failed:', failedRoles);
        toast({
          title: "Partial success",
          description: `Account created but some roles couldn't be assigned: ${failedRoles.join(', ')}`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "Account created successfully!",
          description: `Registration complete with ${roles.length} role(s). Please check your email to verify your account.`
        });
      }
      
      return userData;
    } catch (error) {
      console.error('Error in signUp:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Sign out failed",
          description: error.message,
          variant: "destructive"
        });
        throw error;
      }
      
      toast({
        title: "Signed out",
        description: "You've been successfully signed out"
      });
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    signIn,
    signUp,
    signOut
  };
};
