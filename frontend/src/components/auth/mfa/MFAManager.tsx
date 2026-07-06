
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { MFASetupWizard } from './MFASetupWizard';
import { 
  Shield, 
  Smartphone, 
  KeyRound, 
  Plus, 
  Trash2, 
  Download, 
  AlertTriangle,
  CheckCircle 
} from 'lucide-react';
import { MFAFactor, MFASettings, MFARequirement } from '@/types/mfa';

interface MFAManagerProps {
  className?: string;
}

export const MFAManager: React.FC<MFAManagerProps> = ({ className }) => {
  const [mfaSettings, setMfaSettings] = useState<MFASettings>({
    enabled: false,
    required: false,
    factors: [],
  });
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userMfaRequirement, setUserMfaRequirement] = useState<MFARequirement>('optional');
  
  const { toast } = useToast();
  const { user, roles } = useAuth();

  useEffect(() => {
    if (user) {
      loadMFASettings();
      checkMFARequirement();
    }
  }, [user, roles]);

  const loadMFASettings = async () => {
    if (!user) return;
    
    try {
      // TODO: Connect to Flask API - const { data, error } = await supabase.auth.mfa.listFactors();
      
      if (error) throw error;

      const verifiedFactors = data.all.filter(factor => factor.status === 'verified');
      
      setMfaSettings({
        enabled: verifiedFactors.length > 0,
        required: userMfaRequirement === 'required',
        factors: verifiedFactors as MFAFactor[],
      });
    } catch (error: any) {
      console.error('Failed to load MFA settings:', error);
    }
  };

  const checkMFARequirement = () => {
    // Check if user's roles require MFA
    const adminRoles = ['admin', 'super_user', 'platform_operator'];
    const sensitiveRoles = ['training_center', 'assessment_center', 'recruiter'];
    
    if (roles.some(role => adminRoles.includes(role))) {
      setUserMfaRequirement('required');
    } else if (roles.some(role => sensitiveRoles.includes(role))) {
      setUserMfaRequirement('optional');
    } else {
      setUserMfaRequirement('none');
    }
  };

  const removeFactor = async (factorId: string) => {
    setIsLoading(true);
    try {
      // TODO: Connect to Flask API - const { error } = await supabase.auth.mfa.unenroll({ factorId });
      
      if (error) throw error;

      await loadMFASettings();
      
      toast({
        title: 'Factor Removed',
        description: 'The authentication factor has been removed from your account'
      });
    } catch (error: any) {
      toast({
        title: 'Removal Failed',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    // Generate and download backup codes
    const codes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
    
    const content = codes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mfa-backup-codes.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Backup Codes Downloaded',
      description: 'Store these codes in a secure location'
    });
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

  const getFactorTypeName = (type: string) => {
    switch (type) {
      case 'totp':
        return 'Authenticator App';
      case 'phone':
        return 'SMS';
      default:
        return type;
    }
  };

  if (showSetupWizard) {
    return (
      <MFASetupWizard
        onComplete={() => {
          setShowSetupWizard(false);
          loadMFASettings();
        }}
        onCancel={userMfaRequirement !== 'required' ? () => setShowSetupWizard(false) : undefined}
        required={userMfaRequirement === 'required'}
      />
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Multi-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {mfaSettings.enabled && (
                <Badge variant="default" className="gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Enabled
                </Badge>
              )}
              {userMfaRequirement === 'required' && (
                <Badge variant="destructive">Required</Badge>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {userMfaRequirement === 'required' && !mfaSettings.enabled && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Your account role requires multi-factor authentication. Please set it up to continue using the platform.
              </AlertDescription>
            </Alert>
          )}

          {mfaSettings.factors.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Authentication Methods</h3>
              <p className="text-muted-foreground mb-4">
                Set up multi-factor authentication to secure your account
              </p>
              <Button onClick={() => setShowSetupWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Setup MFA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Authentication Methods</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowSetupWizard(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Method
                </Button>
              </div>
              
              <div className="grid gap-3">
                {mfaSettings.factors.map((factor) => (
                  <Card key={factor.id}>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {getFactorIcon(factor.factor_type)}
                          <div>
                            <div className="font-medium">
                              {factor.friendly_name || getFactorTypeName(factor.factor_type)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Added {new Date(factor.created_at).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Verified
                          </Badge>
                          
                          {mfaSettings.factors.length > 1 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFactor(factor.id)}
                              disabled={isLoading}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Backup Codes</h4>
                    <p className="text-sm text-muted-foreground">
                      Download backup codes to access your account if you lose your device
                    </p>
                  </div>
                  <Button variant="outline" onClick={downloadBackupCodes}>
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </div>
          )}
          
          {userMfaRequirement === 'optional' && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                While not required for your role, we strongly recommend enabling MFA for enhanced security.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
