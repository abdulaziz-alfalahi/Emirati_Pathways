
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Share2, Calendar, ExternalLink } from 'lucide-react';

export const CertificatesTab: React.FC = () => {
  const certificates = [
    {
      id: '1',
      title: 'Advanced Excel for Business',
      issuer: 'Business Skills Academy',
      issuedDate: '2024-05-20',
      certificateNumber: 'BSA-2024-0542',
      status: 'Active',
      expiryDate: null,
      credentialId: 'cred_123456789',
      verificationUrl: '#'
    },
    {
      id: '2',
      title: 'Customer Service Excellence',
      issuer: 'Service Quality Institute',
      issuedDate: '2024-04-25',
      certificateNumber: 'SQI-2024-0321',
      status: 'Active',
      expiryDate: '2027-04-25',
      credentialId: 'cred_987654321',
      verificationUrl: '#'
    },
    {
      id: '3',
      title: 'Digital Marketing Fundamentals',
      issuer: 'UAE Digital Academy',
      issuedDate: '2024-02-15',
      certificateNumber: 'UDA-2024-0789',
      status: 'Expired',
      expiryDate: '2024-02-15',
      credentialId: 'cred_456789123',
      verificationUrl: '#'
    }
  ];

  const getStatusBadge = (status: string, expiryDate: string | null) => {
    if (status === 'Expired') {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (expiryDate) {
      const isExpiringSoon = new Date(expiryDate) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      if (isExpiringSoon) {
        return <Badge className="bg-yellow-500 text-white">Expiring Soon</Badge>;
      }
    }
    return <Badge className="bg-[rgb(var(--pg-accent))] text-white">Active</Badge>;
  };

  if (certificates.length === 0) {
    return (
      <div className="text-center py-12">
        <Award className="h-16 w-16 text-[rgb(var(--pg-primary))] mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">No Certificates Yet</h3>
        <p className="text-muted-foreground mb-6">
          Complete training programs to earn certificates and credentials
        </p>
        <Button className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90] text-white">
          Browse Training Programs
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {certificates.map((certificate) => (
          <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between mb-2">
                <CardTitle className="text-lg leading-tight">{certificate.title}</CardTitle>
                <Award className="h-5 w-5 text-[rgb(var(--pg-primary))] flex-shrink-0 mt-1" />
              </div>
              <p className="text-sm text-muted-foreground">{certificate.issuer}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>Issued {new Date(certificate.issuedDate).toLocaleDateString()}</span>
                </div>
                {getStatusBadge(certificate.status, certificate.expiryDate)}
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Certificate No:</span>
                  <span className="ms-2 font-mono">{certificate.certificateNumber}</span>
                </div>
                {certificate.expiryDate && (
                  <div>
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="ms-2">{new Date(certificate.expiryDate).toLocaleDateString()}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Credential ID:</span>
                  <span className="ms-2 font-mono text-xs">{certificate.credentialId}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button 
                  size="sm"
                  className="flex-1 bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90] text-white"
                  disabled={certificate.status === 'Expired'}
                >
                  <Download className="h-4 w-4 me-2" />
                  Download
                </Button>
                <Button size="sm" variant="outline" className="flex-1">
                  <Share2 className="h-4 w-4 me-2" />
                  Share
                </Button>
              </div>
              
              <Button 
                size="sm" 
                variant="ghost" 
                className="w-full text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/10]"
              >
                <ExternalLink className="h-4 w-4 me-2" />
                Verify Certificate
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
