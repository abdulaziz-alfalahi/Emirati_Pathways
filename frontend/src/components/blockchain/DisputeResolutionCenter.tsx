
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { 
  disputeResolutionService, 
  CredentialDispute, 
  DisputeRequest 
} from '@/services/blockchain/disputeResolutionService';
import { AlertTriangle, FileText, User, Calendar, CheckCircle, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DisputeResolutionCenter: React.FC = () => {
  const { user, roles } = useAuth();
  const { toast } = useToast();
  const [disputes, setDisputes] = useState<CredentialDispute[]>([]);
  const [assignedDisputes, setAssignedDisputes] = useState<CredentialDispute[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showFileDialog, setShowFileDialog] = useState(false);
  const [newDispute, setNewDispute] = useState<Partial<DisputeRequest>>({
    disputeType: 'incorrect_info'
  });

  const isAdmin = roles.includes('admin') || roles.includes('super_user');
  const canReview = isAdmin || roles.includes('training_center') || roles.includes('educational_institution');

  useEffect(() => {
    if (user) {
      loadDisputes();
      if (canReview) {
        loadAssignedDisputes();
      }
    }
  }, [user, canReview]);

  const loadDisputes = async () => {
    try {
      const data = await disputeResolutionService.getUserDisputes(user!.id);
      setDisputes(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load disputes",
        variant: "destructive"
      });
    }
  };

  const loadAssignedDisputes = async () => {
    try {
      const data = await disputeResolutionService.getAssignedDisputes(user!.id);
      setAssignedDisputes(data);
    } catch (error) {
      console.error('Failed to load assigned disputes:', error);
    }
  };

  const handleFileDispute = async () => {
    if (!newDispute.credentialId || !newDispute.disputeReason) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await disputeResolutionService.fileDispute(user!.id, newDispute as DisputeRequest);
      toast({
        title: "Success",
        description: "Dispute filed successfully"
      });
      setShowFileDialog(false);
      setNewDispute({ disputeType: 'incorrect_info' });
      loadDisputes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to file dispute",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResolveDispute = async (disputeId: string, status: 'resolved' | 'rejected', notes: string) => {
    try {
      await disputeResolutionService.resolveDispute(
        disputeId,
        { status, resolutionNotes: notes },
        user!.id
      );
      toast({
        title: "Success",
        description: `Dispute ${status} successfully`
      });
      loadAssignedDisputes();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to resolve dispute",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-600';
      case 'under_review': return 'bg-blue-600';
      case 'resolved': return 'bg-green-600';
      case 'rejected': return 'bg-red-600';
      default: return 'bg-gray-600';
    }
  };

  const getDisputeTypeIcon = (type: string) => {
    switch (type) {
      case 'incorrect_info': return <FileText className="h-4 w-4" />;
      case 'unauthorized_issuance': return <AlertTriangle className="h-4 w-4" />;
      case 'revocation_request': return <XCircle className="h-4 w-4" />;
      case 'identity_theft': return <User className="h-4 w-4" />;
      default: return <AlertTriangle className="h-4 w-4" />;
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 mb-4 opacity-50" />
          <p className="text-muted-foreground">Please log in to access dispute resolution</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <AlertTriangle className="me-2 h-5 w-5" />
                Dispute Resolution Center
              </CardTitle>
              <CardDescription>
                File and manage credential disputes
              </CardDescription>
            </div>
            <Dialog open={showFileDialog} onOpenChange={setShowFileDialog}>
              <DialogTrigger asChild>
                <Button>
                  <AlertTriangle className="me-2 h-4 w-4" />
                  File Dispute
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>File Credential Dispute</DialogTitle>
                  <DialogDescription>
                    Report an issue with a blockchain credential
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="credentialId">Credential ID</Label>
                    <Input
                      id="credentialId"
                      placeholder="Enter credential ID"
                      value={newDispute.credentialId || ''}
                      onChange={(e) => setNewDispute({...newDispute, credentialId: e.target.value})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disputeType">Dispute Type</Label>
                    <Select 
                      value={newDispute.disputeType} 
                      onValueChange={(value: any) => setNewDispute({...newDispute, disputeType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="incorrect_info">Incorrect Information</SelectItem>
                        <SelectItem value="unauthorized_issuance">Unauthorized Issuance</SelectItem>
                        <SelectItem value="revocation_request">Revocation Request</SelectItem>
                        <SelectItem value="identity_theft">Identity Theft</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="disputeReason">Dispute Reason</Label>
                    <Textarea
                      id="disputeReason"
                      placeholder="Explain the issue in detail..."
                      value={newDispute.disputeReason || ''}
                      onChange={(e) => setNewDispute({...newDispute, disputeReason: e.target.value})}
                      rows={4}
                    />
                  </div>

                  <Button 
                    onClick={handleFileDispute} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Filing...' : 'File Dispute'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="my-disputes" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-disputes">My Disputes</TabsTrigger>
          {canReview && <TabsTrigger value="assigned">Assigned to Me</TabsTrigger>}
        </TabsList>

        <TabsContent value="my-disputes">
          <Card>
            <CardHeader>
              <CardTitle>Your Filed Disputes</CardTitle>
              <CardDescription>
                Disputes you have filed regarding credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputes.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-muted-foreground">No disputes filed yet</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputes.map((dispute) => (
                    <Card key={dispute.id} className="border-s-4 border-s-red-500">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              {getDisputeTypeIcon(dispute.dispute_type)}
                              <Badge className={getStatusColor(dispute.status)}>
                                {dispute.status.replace('_', ' ').toUpperCase()}
                              </Badge>
                            </div>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <Calendar className="me-1 h-3 w-3" />
                              {new Date(dispute.created_at).toLocaleDateString()}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium">
                              {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                            </h4>
                            <p className="text-sm text-muted-foreground mt-1">
                              Credential: {dispute.credential_id}
                            </p>
                            <p className="text-sm mt-2">{dispute.dispute_reason}</p>
                          </div>

                          {dispute.resolution_notes && (
                            <div className="bg-gray-50 p-3 rounded">
                              <h5 className="font-medium text-sm">Resolution Notes:</h5>
                              <p className="text-sm mt-1">{dispute.resolution_notes}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {canReview && (
          <TabsContent value="assigned">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Disputes</CardTitle>
                <CardDescription>
                  Disputes assigned to you for review
                </CardDescription>
              </CardHeader>
              <CardContent>
                {assignedDisputes.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-muted-foreground">No assigned disputes</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedDisputes.map((dispute) => (
                      <Card key={dispute.id} className="border-s-4 border-s-blue-500">
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                {getDisputeTypeIcon(dispute.dispute_type)}
                                <Badge className={getStatusColor(dispute.status)}>
                                  {dispute.status.replace('_', ' ').toUpperCase()}
                                </Badge>
                              </div>
                              <div className="flex items-center text-sm text-muted-foreground">
                                <Calendar className="me-1 h-3 w-3" />
                                {new Date(dispute.created_at).toLocaleDateString()}
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="font-medium">
                                {dispute.dispute_type.replace('_', ' ').toUpperCase()}
                              </h4>
                              <p className="text-sm text-muted-foreground mt-1">
                                Credential: {dispute.credential_id}
                              </p>
                              <p className="text-sm mt-2">{dispute.dispute_reason}</p>
                            </div>

                            {dispute.status === 'under_review' && (
                              <div className="flex space-x-2 pt-2">
                                <Button
                                  size="sm"
                                  onClick={() => handleResolveDispute(dispute.id, 'resolved', 'Dispute resolved after review')}
                                >
                                  <CheckCircle className="me-1 h-3 w-3" />
                                  Resolve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleResolveDispute(dispute.id, 'rejected', 'Dispute rejected after review')}
                                >
                                  <XCircle className="me-1 h-3 w-3" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default DisputeResolutionCenter;
