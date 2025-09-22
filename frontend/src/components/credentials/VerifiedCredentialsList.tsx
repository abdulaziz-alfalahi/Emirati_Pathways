
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  GraduationCap, 
  Briefcase, 
  Award, 
  Shield, 
  Calendar,
  Building2,
  CheckCircle,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { credentialVerificationService } from '@/services/credentialVerification/credentialVerificationService';
import { VerifiedCredential, CredentialVerificationRequest } from '@/types/credentialVerification';

interface VerifiedCredentialsListProps {
  userId: string;
  refreshTrigger?: number;
}

const VerifiedCredentialsList: React.FC<VerifiedCredentialsListProps> = ({ 
  userId, 
  refreshTrigger 
}) => {
  const { toast } = useToast();
  const [credentials, setCredentials] = useState<VerifiedCredential[]>([]);
  const [verificationRequests, setVerificationRequests] = useState<CredentialVerificationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [userId, refreshTrigger]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [credentialsData, requestsData] = await Promise.all([
        credentialVerificationService.getUserVerifiedCredentials(userId),
        credentialVerificationService.getUserVerificationRequests(userId)
      ]);
      
      setCredentials(credentialsData);
      setVerificationRequests(requestsData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load credential data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getCredentialIcon = (type: string) => {
    switch (type) {
      case 'education':
        return <GraduationCap className="h-5 w-5" />;
      case 'employment':
        return <Briefcase className="h-5 w-5" />;
      case 'certification':
        return <Award className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'expired':
      case 'revoked':
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
      case 'active':
        return 'bg-green-500';
      case 'pending':
        return 'bg-yellow-500';
      case 'failed':
        return 'bg-red-500';
      case 'expired':
      case 'revoked':
        return 'bg-gray-500';
      default:
        return 'bg-gray-500';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Verified Credentials */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Shield className="mr-2 h-5 w-5" />
                Verified Credentials
              </CardTitle>
              <CardDescription>
                Your verified education, employment, and certification records
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {credentials.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Shield className="mx-auto h-12 w-12 mb-4 opacity-50" />
              <p>No verified credentials yet.</p>
              <p className="text-sm">Start by verifying your first credential above.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {credentials.map((credential) => (
                <div key={credential.id} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-primary/10 rounded-full text-primary">
                        {getCredentialIcon(credential.credential_type)}
                      </div>
                      <div>
                        <h3 className="font-semibold">{credential.credential_title}</h3>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Building2 className="h-3 w-3 mr-1" />
                          {credential.institution_name}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusIcon(credential.verification_status)}
                      <Badge variant="outline" className={`text-white ${getStatusColor(credential.verification_status)}`}>
                        {credential.verification_status}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {credential.issue_date && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Issue Date: {formatDate(credential.issue_date)}
                      </div>
                    )}
                    {credential.expiry_date && (
                      <div className="flex items-center text-muted-foreground">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expires: {formatDate(credential.expiry_date)}
                      </div>
                    )}
                    <div className="flex items-center text-muted-foreground">
                      <Shield className="h-3 w-3 mr-1" />
                      Verified by: {credential.verification_source.replace('_', ' ').toUpperCase()}
                    </div>
                  </div>
                  
                  {credential.credential_number && (
                    <div className="mt-2 text-sm text-muted-foreground">
                      ID: {credential.credential_number}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Requests */}
      {verificationRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Verification History
            </CardTitle>
            <CardDescription>
              Track the status of your credential verification requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {verificationRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-muted rounded-full">
                      {getCredentialIcon(request.verification_type)}
                    </div>
                    <div>
                      <p className="font-medium capitalize">{request.verification_type} Verification</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(request.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(request.status)}
                    <Badge variant="outline" className={`text-white ${getStatusColor(request.status)}`}>
                      {request.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VerifiedCredentialsList;
