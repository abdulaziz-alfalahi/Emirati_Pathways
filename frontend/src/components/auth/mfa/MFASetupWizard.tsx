
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { QRCodeSVG } from 'qrcode.react';
import { useToast } from '@/hooks/use-toast';
import { 
  Shield, 
  Smartphone, 
  MessageSquare, 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { MFASetupStep } from '@/types/mfa';

interface MFASetupWizardProps {
  onComplete: () => void;
  onCancel?: () => void;
  required?: boolean;
}

export const MFASetupWizard: React.FC<MFASetupWizardProps> = ({
  onComplete,
  onCancel,
  required = false
}) => {
  const [currentStep, setCurrentStep] = useState<MFASetupStep>('select_method');
  const [selectedMethod, setSelectedMethod] = useState<'totp' | 'phone' | null>(null);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [factorId, setFactorId] = useState('');
  
  const { toast } = useToast();

  const setupTOTP = async () => {
    setIsLoading(true);
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App'
      });

      if (error) throw error;

      setQrCode(data.totp.qr_code);
      setSecret(data.totp.secret);
      setFactorId(data.id);
      setCurrentStep('configure_totp');
    } catch (error: any) {
      toast({
        title: 'Setup Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verifyFactor = async () => {
    if (!verificationCode || !factorId) return;

    setIsLoading(true);
    try {
      // TODO: Connect to Flask API - const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId
      });

      if (challengeError) throw challengeError;

      // TODO: Connect to Flask API - const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verificationCode
      });

      if (verifyError) throw verifyError;

      setCurrentStep('backup_codes');
    } catch (error: any) {
      toast({
        title: 'Verification Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select_method':
        return (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <Shield className="h-16 w-16 mx-auto text-primary mb-4" />
              <h2 className="text-2xl font-bold mb-2">Set Up Multi-Factor Authentication</h2>
              <p className="text-muted-foreground">
                Choose your preferred authentication method to secure your account
              </p>
            </div>

            <div className="grid gap-4">
              <button
                onClick={() => {
                  setSelectedMethod('totp');
                  setupTOTP();
                }}
                className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors text-left"
                disabled={isLoading}
              >
                <Smartphone className="h-8 w-8 mr-4 text-primary" />
                <div className="flex-1">
                  <h3 className="font-semibold">Authenticator App</h3>
                  <p className="text-sm text-muted-foreground">
                    Use apps like Google Authenticator, Authy, or 1Password
                  </p>
                </div>
                <Badge variant="secondary">Recommended</Badge>
              </button>

              <button
                onClick={() => setSelectedMethod('phone')}
                className="flex items-center p-4 border rounded-lg hover:bg-accent transition-colors text-left opacity-50 cursor-not-allowed"
                disabled
              >
                <MessageSquare className="h-8 w-8 mr-4 text-muted-foreground" />
                <div className="flex-1">
                  <h3 className="font-semibold text-muted-foreground">SMS Verification</h3>
                  <p className="text-sm text-muted-foreground">
                    Receive codes via text message (Coming Soon)
                  </p>
                </div>
              </button>
            </div>
          </div>
        );

      case 'configure_totp':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-xl font-bold mb-2">Scan QR Code</h2>
              <p className="text-muted-foreground mb-4">
                Scan this QR code with your authenticator app
              </p>
            </div>

            <div className="flex justify-center">
              <div className="p-4 bg-white rounded-lg">
                {qrCode && <QRCodeSVG value={qrCode} size={200} />}
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Manual Entry Key:</p>
              <code className="block p-2 bg-muted rounded text-sm break-all">
                {secret}
              </code>
            </div>

            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                After scanning, enter the 6-digit code from your authenticator app below.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Enter 6-digit code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full p-3 border rounded-lg text-center text-lg font-mono"
                maxLength={6}
              />
              
              <Button 
                onClick={verifyFactor}
                disabled={verificationCode.length !== 6 || isLoading}
                className="w-full"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </Button>
            </div>
          </div>
        );

      case 'backup_codes':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
              <h2 className="text-xl font-bold mb-2">MFA Setup Complete!</h2>
              <p className="text-muted-foreground">
                Your account is now protected with multi-factor authentication
              </p>
            </div>

            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Save backup codes in a secure location. You can use them to access your account if you lose your device.
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              <Button onClick={onComplete} className="w-full">
                Complete Setup
              </Button>
              
              <Button variant="outline" onClick={onComplete} className="w-full">
                Download Backup Codes Later
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            {currentStep !== 'select_method' && onCancel && !required && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (currentStep === 'configure_totp') {
                    setCurrentStep('select_method');
                  } else {
                    onCancel();
                  }
                }}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            )}
            
            {required && (
              <Badge variant="destructive">Required</Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          {renderStepContent()}
        </CardContent>
      </Card>
    </div>
  );
};
