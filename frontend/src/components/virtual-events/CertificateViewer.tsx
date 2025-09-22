
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Download, Share2, Calendar, User, CheckCircle } from 'lucide-react';
import { PostEventFollowUpService, AttendanceCertificate } from '@/services/postEventFollowUpService';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { toast } from '@/components/ui/use-toast';

interface CertificateViewerProps {
  eventId: string;
  userId?: string;
}

const CertificateViewer: React.FC<CertificateViewerProps> = ({ eventId, userId }) => {
  const [certificate, setCertificate] = useState<AttendanceCertificate | null>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadCertificateData();
  }, [eventId, userId]);

  const loadCertificateData = async () => {
    try {
      setIsLoading(true);
      
      const [eventInfo, certificates] = await Promise.all([
        VirtualEventsService.getEventById(eventId),
        PostEventFollowUpService.getCertificatesByEvent(eventId)
      ]);

      setEventData(eventInfo);

      if (userId) {
        const userCertificate = certificates.find(cert => cert.user_id === userId);
        setCertificate(userCertificate || null);
      } else {
        // If no specific user, show the first certificate (for demo)
        setCertificate(certificates[0] || null);
      }

    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load certificate data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadCertificate = () => {
    if (!certificate) return;
    
    // In a real implementation, this would download the actual PDF
    toast({
      title: "Download Started",
      description: "Your certificate is being downloaded",
    });
  };

  const handleShareCertificate = () => {
    if (!certificate) return;

    const shareUrl = `${window.location.origin}/certificates/${certificate.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: `${eventData?.title} - Attendance Certificate`,
        text: `I completed ${eventData?.title} and earned this certificate!`,
        url: shareUrl
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link Copied",
        description: "Certificate link copied to clipboard",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!certificate) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Award className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Certificate Available</h3>
          <p className="text-muted-foreground">
            You haven't met the minimum requirements for this event's certificate, 
            or the certificate hasn't been generated yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Certificate Actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Attendance Certificate</h2>
          <p className="text-muted-foreground">
            Congratulations on completing the event requirements!
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleShareCertificate}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button onClick={handleDownloadCertificate}>
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </div>

      {/* Certificate Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card className="border-2 border-primary/20">
            <CardContent className="p-8">
              {/* Certificate Header */}
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <h1 className="text-3xl font-bold text-primary mb-2">
                  Certificate of Attendance
                </h1>
                <p className="text-muted-foreground">
                  This certifies that
                </p>
              </div>

              {/* Recipient Name */}
              <div className="text-center mb-8">
                <div className="text-4xl font-bold mb-2">
                  {certificate.profiles?.full_name || 'Certificate Holder'}
                </div>
                <p className="text-lg text-muted-foreground">
                  has successfully attended and participated in
                </p>
              </div>

              {/* Event Details */}
              <div className="text-center mb-8">
                <h2 className="text-2xl font-semibold mb-4">
                  {eventData?.title}
                </h2>
                <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    {new Date(certificate.issued_date).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4" />
                    {certificate.completion_percentage}% Completion
                  </div>
                </div>
              </div>

              {/* Certificate Number */}
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Certificate Number
                </p>
                <p className="font-mono text-lg font-semibold">
                  {certificate.certificate_number}
                </p>
              </div>

              {/* Validation */}
              <div className="flex justify-center mt-8">
                <Badge 
                  variant={certificate.is_valid ? "default" : "destructive"}
                  className="px-4 py-2"
                >
                  {certificate.is_valid ? "Valid Certificate" : "Invalid Certificate"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Certificate Information */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Certificate Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Issued Date</p>
                <p className="text-sm text-muted-foreground">
                  {new Date(certificate.issued_date).toLocaleDateString()}
                </p>
              </div>
              
              <div>
                <p className="text-sm font-medium">Completion Rate</p>
                <p className="text-sm text-muted-foreground">
                  {certificate.completion_percentage}%
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Event Type</p>
                <p className="text-sm text-muted-foreground capitalize">
                  {eventData?.event_type?.replace('_', ' ')}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium">Status</p>
                <Badge variant={certificate.is_valid ? "default" : "destructive"}>
                  {certificate.is_valid ? "Valid" : "Invalid"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Verification</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-3">
                This certificate can be verified using the certificate number above.
              </p>
              <div className="p-3 bg-muted rounded text-center">
                <p className="text-xs font-mono">
                  {certificate.certificate_number}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CertificateViewer;
