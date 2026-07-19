
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useToast } from '@/hooks/use-toast';
import { Shield, Smartphone, KeyRound, AlertTriangle } from 'lucide-react';
import { MFAFactor, MFAChallenge } from '@/types/mfa';

interface MFAVerificationDialogProps {
  open: boolean;
  onVerified: () => void;
  onCancel?: () => void;
  factors: MFAFactor[];
  challenge?: MFAChallenge;
  required?: boolean;
}

export const MFAVerificationDialog: React.FC<MFAVerificationDialogProps> = ({
  open,
  onVerified,
  onCancel,
  factors,
  challenge,
  required = false
}) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [selectedFactor, setSelectedFactor] = useState<MFAFactor | null>(
    factors.length > 0 ? factors[0] : null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  
  const { toast } = useToast();

  useEffect(() => {
    if (challenge?.expires_at) {
      const interval = setInterval(() => {
        const remaining = Math.max(0, challenge.expires_at - Date.now());
        setTimeRemaining(Math.floor(remaining / 1000));
        
        if (remaining <= 0) {
          clearInterval(interval);
          toast({
            title: 'Verification Expired',
            description: 'Please restart the verification process',
            variant: 'destructive'
          });
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [challenge, toast]);

  const verifyCode = async () => {
    if (!selectedFactor || !verificationCode || !challenge) return;
    
    setIsLoading(true);
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.verify({
        factorId: selectedFactor.id,
        challengeId: challenge.id,
        code: verificationCode
      });

      if (error) {
        setAttempts(prev => prev + 1);
        throw error;
      }

      toast({
        title: 'Verification Successful',
        description: 'Access granted'
      });
      
      onVerified();
    } catch (error: any) {
      const remainingAttempts = 3 - attempts - 1;
      
      if (remainingAttempts <= 0) {
        toast({
          title: 'Too Many Failed Attempts',
          description: 'Please try again later or contact support',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Verification Failed',
        description: `Invalid code. ${remainingAttempts} attempts remaining.`,
        variant: 'destructive'
      });
      
      setVerificationCode('');
    } finally {
      setIsLoading(false);
    }
  };

  const resendCode = async () => {
    if (!selectedFactor) return;
    
    setIsLoading(true);
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.challenge({
        factorId: selectedFactor.id
      });

      if (error) throw error;

      toast({
        title: 'Code Sent',
        description: 'A new verification code has been sent'
      });
    } catch (error: any) {
      toast({
        title: 'Failed to Send Code',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getFactorIcon = (type: string) => {
    switch (type) {
      case 'totp':
        return <Smartphone className="h-5 w-5" />;
      case 'phone':
        return <KeyRound className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getFactorDescription = (factor: MFAFactor) => {
    switch (factor.factor_type) {
      case 'totp':
        return 'Enter the code from your authenticator app';
      case 'phone':
        return 'Enter the code sent to your phone';
      default:
        return 'Enter your verification code';
    }
  };

  return (
    <Dialog open={open} onOpenChange={required ? undefined : onCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle>Verify Your Identity</DialogTitle>
          <DialogDescription>
            Multi-factor authentication is required to continue
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {required && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action requires additional verification for security.
              </AlertDescription>
            </Alert>
          )}

          {factors.length > 1 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Choose verification method:</label>
              <div className="grid gap-2">
                {factors.map((factor) => (
                  <button
                    key={factor.id}
                    onClick={() => setSelectedFactor(factor)}
                    className={`flex items-center space-x-3 rounded-lg border p-3 text-start transition-colors ${
                      selectedFactor?.id === factor.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:bg-accent'
                    }`}
                  >
                    {getFactorIcon(factor.factor_type)}
                    <div className="flex-1">
                      <div className="font-medium">{factor.friendly_name || factor.factor_type}</div>
                      <div className="text-sm text-muted-foreground">
                        {getFactorDescription(factor)}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {selectedFactor && (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">
                  {getFactorDescription(selectedFactor)}
                </p>
                {timeRemaining > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Code expires in {formatTime(timeRemaining)}
                  </p>
                )}
              </div>

              <div className="flex justify-center">
                <InputOTP 
                  value={verificationCode}
                  onChange={setVerificationCode}
                  maxLength={6}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <div className="flex gap-3">
                <Button 
                  onClick={verifyCode}
                  disabled={isLoading || verificationCode.length !== 6 || attempts >= 3}
                  className="flex-1"
                >
                  Verify
                </Button>
                
                {selectedFactor.factor_type === 'phone' && (
                  <Button 
                    variant="outline"
                    onClick={resendCode}
                    disabled={isLoading || timeRemaining > 240} // Allow resend after 1 minute
                  >
                    Resend
                  </Button>
                )}
              </div>

              {!required && onCancel && (
                <Button 
                  variant="ghost" 
                  onClick={onCancel}
                  className="w-full"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              )}
            </div>
          )}

          {attempts > 0 && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {attempts >= 3 
                  ? 'Too many failed attempts. Please contact support.'
                  : `${attempts} failed attempt${attempts > 1 ? 's' : ''}. ${3 - attempts} remaining.`
                }
              </AlertDescription>
            </Alert>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
