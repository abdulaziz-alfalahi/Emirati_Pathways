
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Users, 
  Star, 
  Download, 
  Mail, 
  Award,
  TrendingUp,
  MessageCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PostEventFollowUpService } from '@/services/postEventFollowUpService';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { toast } from '@/components/ui/use-toast';

interface PostEventDashboardProps {
  eventId: string;
}

const PostEventDashboard: React.FC<PostEventDashboardProps> = ({ eventId }) => {
  const [feedbackSummary, setFeedbackSummary] = useState<any>(null);
  const [certificates, setCertificates] = useState<any[]>([]);
  const [followUpEmails, setFollowUpEmails] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    loadPostEventData();
  }, [eventId]);

  const loadPostEventData = async () => {
    try {
      setIsLoading(true);
      const [summary, certs, emails] = await Promise.all([
        PostEventFollowUpService.getFeedbackSummary(eventId),
        PostEventFollowUpService.getCertificatesByEvent(eventId),
        // We'll load follow-up emails from database when we create the table
        Promise.resolve([])
      ]);

      setFeedbackSummary(summary);
      setCertificates(certs);
      setFollowUpEmails(emails);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load post-event data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunFollowUpSequence = async () => {
    try {
      setActionLoading('sequence');
      await PostEventFollowUpService.runPostEventSequence(eventId);
      await loadPostEventData();
      toast({
        title: "Success",
        description: "Post-event follow-up sequence initiated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to run follow-up sequence",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSendFeedbackRequest = async () => {
    try {
      setActionLoading('feedback');
      await PostEventFollowUpService.sendFeedbackRequest(eventId);
      await loadPostEventData();
      toast({
        title: "Success",
        description: "Feedback requests sent to attendees",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send feedback requests",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleExportNetworking = async () => {
    try {
      setActionLoading('networking');
      const connections = await PostEventFollowUpService.exportNetworkingConnections(eventId);
      
      // Create CSV download
      const csvContent = createCSVContent(connections);
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `networking-connections-${eventId}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast({
        title: "Success",
        description: "Networking connections exported successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to export networking data",
        variant: "destructive",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const createCSVContent = (data: any[]): string => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
      Object.values(row).map(value => 
        typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value
      ).join(',')
    );
    
    return [headers, ...rows].join('\n');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Post-Event Follow-up</h2>
          <p className="text-muted-foreground">
            Manage feedback collection, certificates, and follow-up communications
          </p>
        </div>
        <Button 
          onClick={handleRunFollowUpSequence}
          disabled={actionLoading === 'sequence'}
          className="bg-primary"
        >
          {actionLoading === 'sequence' ? (
            <>
              <Clock className="h-4 w-4 me-2 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 me-2" />
              Run Full Sequence
            </>
          )}
        </Button>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Feedback Collection</p>
                <p className="text-xs text-muted-foreground">Send surveys to attendees</p>
              </div>
              <Button 
                size="sm" 
                onClick={handleSendFeedbackRequest}
                disabled={actionLoading === 'feedback'}
              >
                <MessageCircle className="h-4 w-4 me-1" />
                Send
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Certificates</p>
                <p className="text-xs text-muted-foreground">{certificates.length} issued</p>
              </div>
              <Badge variant="secondary">
                <Award className="h-3 w-3 me-1" />
                Auto-generated
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Networking Export</p>
                <p className="text-xs text-muted-foreground">Download connections</p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={handleExportNetworking}
                disabled={actionLoading === 'networking'}
              >
                <Download className="h-4 w-4 me-1" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="feedback" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="certificates">Certificates</TabsTrigger>
          <TabsTrigger value="networking">Networking</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="feedback">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5" />
                  Feedback Summary
                </CardTitle>
                <CardDescription>Average ratings from attendees</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackSummary && feedbackSummary.totalResponses > 0 ? (
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {feedbackSummary.totalResponses}
                      </div>
                      <p className="text-sm text-muted-foreground">Total Responses</p>
                    </div>
                    
                    <div className="space-y-3">
                      {Object.entries(feedbackSummary.averageRatings || {}).map(([key, value]) => (
                        <div key={key} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="capitalize">{key}</span>
                            <span>{(value as number).toFixed(1)}/5</span>
                          </div>
                          <Progress value={(value as number) * 20} className="h-2" />
                        </div>
                      ))}
                    </div>

                    <div className="pt-4 border-t">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {feedbackSummary.recommendationRate?.toFixed(1) || '0'}%
                        </div>
                        <p className="text-sm text-muted-foreground">Would Recommend</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="mx-auto h-8 w-8 mb-2" />
                    <p>No feedback received yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Suggestions</CardTitle>
                <CardDescription>Common themes from feedback</CardDescription>
              </CardHeader>
              <CardContent>
                {feedbackSummary?.commonImprovements?.length > 0 ? (
                  <div className="space-y-2">
                    {feedbackSummary.commonImprovements.map((theme: string, index: number) => (
                      <Badge key={index} variant="outline" className="me-2">
                        {theme}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No improvement suggestions yet</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="certificates">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Attendance Certificates
              </CardTitle>
              <CardDescription>
                Certificates issued to attendees who met minimum requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {certificates.length > 0 ? (
                <div className="space-y-4">
                  {certificates.map((cert) => (
                    <div key={cert.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{cert.profiles?.full_name || 'Unknown'}</p>
                        <p className="text-sm text-muted-foreground">
                          Certificate #{cert.certificate_number}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Completion: {cert.completion_percentage}%
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={cert.is_valid ? 'default' : 'destructive'}>
                          {cert.is_valid ? 'Valid' : 'Invalid'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Download className="h-4 w-4 me-1" />
                          Download
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Award className="mx-auto h-8 w-8 mb-2" />
                  <p>No certificates issued yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="networking">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Networking Connections
              </CardTitle>
              <CardDescription>
                Export attendee connections made during the event
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Button onClick={handleExportNetworking} disabled={actionLoading === 'networking'}>
                  <Download className="h-4 w-4 me-2" />
                  Export All Connections
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Download a CSV file with all networking connections made during the event
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Follow-up Analytics
              </CardTitle>
              <CardDescription>
                Track the effectiveness of your post-event communications
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{followUpEmails.filter(e => e.email_type === 'feedback').length}</div>
                  <p className="text-sm text-muted-foreground">Feedback Emails Sent</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{followUpEmails.filter(e => e.email_type === 'certificate').length}</div>
                  <p className="text-sm text-muted-foreground">Certificate Notifications</p>
                </div>
                <div className="text-center p-4 border rounded">
                  <div className="text-2xl font-bold">{followUpEmails.filter(e => e.email_type === 'networking').length}</div>
                  <p className="text-sm text-muted-foreground">Networking Exports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostEventDashboard;
