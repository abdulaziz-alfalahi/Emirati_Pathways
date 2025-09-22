
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { blockchainCredentialService } from '@/services/blockchain/blockchainCredentialService';
import { privacyControlService } from '@/services/blockchain/privacyControlService';
import { VerificationResult, BlockchainCredential } from '@/types/blockchainCredentials';
import { Shield, CheckCircle, XCircle, AlertTriangle, Calendar, Hash, ExternalLink } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

const CredentialVerification: React.FC = () => {
  const { toast } = useToast();
  const [credentialId, setCredentialId] = useState('');
  const [sharingToken, setSharingToken] = useState('');
  const [verificationResult, setVerificationResult] = useState<VerificationResult | null>(null);
  const [sharedCredential, setSharedCredential] = useState<BlockchainCredential | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'id' | 'token'>('id');

  const handleVerification = async () => {
    if (verificationMethod === 'id' && !credentialId) {
      toast({
        title: "Missing Information",
        description: "Please enter a credential ID",
        variant: "destructive"
      });
      return;
    }

    if (verificationMethod === 'token' && !sharingToken) {
      toast({
        title: "Missing Information", 
        description: "Please enter a sharing token",
        variant: "destructive"
      });
      return;
    }

    setIsVerifying(true);
    try {
      if (verificationMethod === 'id') {
        const result = await blockchainCredentialService.verifyCredential(credentialId);
        setVerificationResult(result);
        setSharedCredential(null);
      } else {
        // Verify shared credential via token
        const accessResult = await privacyControlService.validateSharingAccess(
          sharingToken, 
          ['title', 'issuer_id', 'issued_date', 'verification_status']
        );
        
        if (accessResult.hasAccess && accessResult.permission) {
          const result = await blockchainCredentialService.verifyCredential(
            accessResult.permission.credential_id
          );
          setVerificationResult(result);
          setSharedCredential(result.credential || null);
        } else {
          setVerificationResult({
            isValid: false,
            status: 'invalid',
            message: 'Invalid sharing token or access denied'
          });
          setSharedCredential(null);
        }
      }
    } catch (error) {
      setVerificationResult({
        isValid: false,
        status: 'error',
        message: 'Verification failed due to system error'
      });
      console.error('Verification error:', error);
    } finally {
      setIsVerifying(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'invalid': return <XCircle className="h-6 w-6 text-red-600" />;
      case 'not_found': return <AlertTriangle className="h-6 w-6 text-yellow-600" />;
      case 'revoked': return <XCircle className="h-6 w-6 text-red-600" />;
      case 'error': return <AlertTriangle className="h-6 w-6 text-red-600" />;
      default: return <Shield className="h-6 w-6 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'bg-green-600';
      case 'invalid': return 'bg-red-600';
      case 'not_found': return 'bg-yellow-600';
      case 'revoked': return 'bg-red-600';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const generateVerificationUrl = () => {
    if (verificationMethod === 'id' && credentialId) {
      return `${window.location.origin}/blockchain-credentials/verify?id=${credentialId}`;
    }
    if (verificationMethod === 'token' && sharingToken) {
      return `${window.location.origin}/blockchain-credentials/shared/${sharingToken}`;
    }
    return '';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Shield className="mr-2 h-5 w-5" />
            Credential Verification
          </CardTitle>
          <CardDescription>
            Verify the authenticity of blockchain credentials using credential ID or sharing token
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Verification Method Selection */}
          <div className="space-y-2">
            <Label>Verification Method</Label>
            <div className="flex space-x-4">
              <Button
                variant={verificationMethod === 'id' ? 'default' : 'outline'}
                onClick={() => setVerificationMethod('id')}
                size="sm"
              >
                Credential ID
              </Button>
              <Button
                variant={verificationMethod === 'token' ? 'default' : 'outline'}
                onClick={() => setVerificationMethod('token')}
                size="sm"
              >
                Sharing Token
              </Button>
            </div>
          </div>

          {/* Input Fields */}
          {verificationMethod === 'id' ? (
            <div className="space-y-2">
              <Label htmlFor="credentialId">Credential ID</Label>
              <Input
                id="credentialId"
                placeholder="Enter the credential ID to verify"
                value={credentialId}
                onChange={(e) => setCredentialId(e.target.value)}
              />
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="sharingToken">Sharing Token</Label>
              <Input
                id="sharingToken"
                placeholder="Enter the sharing token"
                value={sharingToken}
                onChange={(e) => setSharingToken(e.target.value)}
              />
            </div>
          )}

          <Button 
            onClick={handleVerification} 
            disabled={isVerifying}
            className="w-full"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2" />
                Verifying...
              </>
            ) : (
              <>
                <Shield className="h-4 w-4 mr-2" />
                Verify Credential
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <Card className={`border-l-4 ${
          verificationResult.isValid ? 'border-l-green-500' : 'border-l-red-500'
        }`}>
          <CardHeader>
            <CardTitle className="flex items-center">
              {getStatusIcon(verificationResult.status)}
              <span className="ml-2">Verification Result</span>
              <Badge className={`ml-auto ${getStatusColor(verificationResult.status)}`}>
                {verificationResult.status.toUpperCase()}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {verificationResult.message}
            </p>

            {verificationResult.credential && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Credential Details</h4>
                    <div className="space-y-2 text-sm">
                      <p><strong>Title:</strong> {verificationResult.credential.title}</p>
                      <p><strong>Type:</strong> {verificationResult.credential.credential_type}</p>
                      <p><strong>Issued:</strong> {new Date(verificationResult.credential.issued_date).toLocaleDateString()}</p>
                      {verificationResult.credential.skills && verificationResult.credential.skills.length > 0 && (
                        <p><strong>Skills:</strong> {verificationResult.credential.skills.join(', ')}</p>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold text-sm mb-2">Blockchain Details</h4>
                    <div className="space-y-2 text-sm">
                      <p className="flex items-center">
                        <Hash className="mr-1 h-3 w-3" />
                        <strong>Block:</strong> #{verificationResult.credential.block_number}
                      </p>
                      <p className="flex items-center">
                        <ExternalLink className="mr-1 h-3 w-3" />
                        <strong>Tx:</strong> {verificationResult.credential.transaction_hash.substring(0, 10)}...
                      </p>
                      {verificationResult.verificationDetails && (
                        <p className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          <strong>Verified:</strong> {new Date(verificationResult.verificationDetails.verifiedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* QR Code for Verification */}
                {generateVerificationUrl() && (
                  <div className="flex justify-center">
                    <div className="text-center">
                      <QRCodeSVG 
                        value={generateVerificationUrl()} 
                        size={128}
                        className="mx-auto mb-2"
                      />
                      <p className="text-xs text-muted-foreground">
                        Scan to verify this credential
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CredentialVerification;
