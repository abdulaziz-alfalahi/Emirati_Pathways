
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { 
  privacyControlService, 
  CredentialSharingPermission, 
  SharingRequest 
} from '@/services/blockchain/privacyControlService';
import { Share2, Copy, Trash2, Users, Shield, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface CredentialSharingManagerProps {
  credentialId: string;
  userId: string;
}

const CredentialSharingManager: React.FC<CredentialSharingManagerProps> = ({
  credentialId,
  userId
}) => {
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<CredentialSharingPermission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newPermission, setNewPermission] = useState<Partial<SharingRequest>>({
    credentialId,
    sharedWithType: 'public',
    permissionLevel: 'view',
    fieldsAccessible: ['title', 'issuer_id', 'issued_date']
  });

  const availableFields = [
    'title', 'description', 'issuer_id', 'issued_date', 
    'expiry_date', 'skills', 'metadata', 'credential_type'
  ];

  useEffect(() => {
    loadPermissions();
  }, [credentialId]);

  const loadPermissions = async () => {
    try {
      const data = await privacyControlService.getCredentialSharingPermissions(credentialId);
      setPermissions(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load sharing permissions",
        variant: "destructive"
      });
    }
  };

  const handleCreatePermission = async () => {
    if (!newPermission.sharedWithType || !newPermission.permissionLevel) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await privacyControlService.createSharingPermission(userId, newPermission as SharingRequest);
      toast({
        title: "Success",
        description: "Sharing permission created successfully"
      });
      setShowCreateDialog(false);
      setNewPermission({
        credentialId,
        sharedWithType: 'public',
        permissionLevel: 'view',
        fieldsAccessible: ['title', 'issuer_id', 'issued_date']
      });
      loadPermissions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sharing permission",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevokePermission = async (permissionId: string) => {
    try {
      await privacyControlService.revokeSharingPermission(permissionId, userId);
      toast({
        title: "Success",
        description: "Sharing permission revoked"
      });
      loadPermissions();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to revoke permission",
        variant: "destructive"
      });
    }
  };

  const copyShareLink = (token: string) => {
    const shareUrl = `${window.location.origin}/blockchain-credentials/shared/${token}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Link Copied",
      description: "Share link copied to clipboard"
    });
  };

  const getPermissionIcon = (level: string) => {
    switch (level) {
      case 'view': return <Shield className="h-4 w-4" />;
      case 'verify': return <Users className="h-4 w-4" />;
      case 'full_access': return <Share2 className="h-4 w-4" />;
      default: return <Shield className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'public': return 'bg-green-600';
      case 'specific_user': return 'bg-blue-600';
      case 'organization': return 'bg-purple-600';
      case 'verification_service': return 'bg-orange-600';
      default: return 'bg-gray-600';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <Share2 className="me-2 h-5 w-5" />
                Credential Sharing
              </CardTitle>
              <CardDescription>
                Manage who can access your credential and what they can see
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Share2 className="me-2 h-4 w-4" />
                  Create Share Link
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Sharing Permission</DialogTitle>
                  <DialogDescription>
                    Configure how others can access your credential
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shareType">Share Type</Label>
                    <Select 
                      value={newPermission.sharedWithType} 
                      onValueChange={(value: any) => setNewPermission({...newPermission, sharedWithType: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="public">Public Link</SelectItem>
                        <SelectItem value="specific_user">Specific User</SelectItem>
                        <SelectItem value="organization">Organization</SelectItem>
                        <SelectItem value="verification_service">Verification Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {newPermission.sharedWithType !== 'public' && (
                    <div className="space-y-2">
                      <Label htmlFor="sharedWith">Share With (ID)</Label>
                      <Input
                        id="sharedWith"
                        placeholder="Enter user/organization ID"
                        value={newPermission.sharedWithId || ''}
                        onChange={(e) => setNewPermission({...newPermission, sharedWithId: e.target.value})}
                      />
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="permissionLevel">Permission Level</Label>
                    <Select 
                      value={newPermission.permissionLevel} 
                      onValueChange={(value: any) => setNewPermission({...newPermission, permissionLevel: value})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="view">View Only</SelectItem>
                        <SelectItem value="verify">View & Verify</SelectItem>
                        <SelectItem value="full_access">Full Access</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Accessible Fields</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {availableFields.map((field) => (
                        <div key={field} className="flex items-center space-x-2">
                          <Checkbox
                            id={field}
                            checked={newPermission.fieldsAccessible?.includes(field)}
                            onCheckedChange={(checked) => {
                              const current = newPermission.fieldsAccessible || [];
                              if (checked) {
                                setNewPermission({
                                  ...newPermission,
                                  fieldsAccessible: [...current, field]
                                });
                              } else {
                                setNewPermission({
                                  ...newPermission,
                                  fieldsAccessible: current.filter(f => f !== field)
                                });
                              }
                            }}
                          />
                          <Label htmlFor={field} className="text-sm">{field}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="expiresAt">Expires At (Optional)</Label>
                    <Input
                      id="expiresAt"
                      type="datetime-local"
                      value={newPermission.expiresAt?.slice(0, 16) || ''}
                      onChange={(e) => setNewPermission({
                        ...newPermission, 
                        expiresAt: e.target.value ? new Date(e.target.value).toISOString() : undefined
                      })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxAccess">Max Access Count (Optional)</Label>
                    <Input
                      id="maxAccess"
                      type="number"
                      placeholder="Unlimited"
                      value={newPermission.maxAccessCount || ''}
                      onChange={(e) => setNewPermission({
                        ...newPermission, 
                        maxAccessCount: e.target.value ? parseInt(e.target.value) : undefined
                      })}
                    />
                  </div>

                  <Button 
                    onClick={handleCreatePermission} 
                    disabled={isLoading}
                    className="w-full"
                  >
                    {isLoading ? 'Creating...' : 'Create Permission'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {permissions.length === 0 ? (
            <div className="text-center py-8">
              <Share2 className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">No sharing permissions created yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {permissions.map((permission) => (
                <Card key={permission.id} className="border-s-4 border-s-blue-500">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          {getPermissionIcon(permission.permission_level)}
                          <Badge className={getTypeColor(permission.shared_with_type)}>
                            {permission.shared_with_type.replace('_', ' ').toUpperCase()}
                          </Badge>
                          <Badge variant="outline">
                            {permission.permission_level.replace('_', ' ').toUpperCase()}
                          </Badge>
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <p>Fields: {permission.fields_accessible.join(', ')}</p>
                          <p>Access Count: {permission.access_count} / {permission.max_access_count || '∞'}</p>
                          {permission.expires_at && (
                            <p className="flex items-center">
                              <Calendar className="me-1 h-3 w-3" />
                              Expires: {new Date(permission.expires_at).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        {permission.sharing_token && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyShareLink(permission.sharing_token!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevokePermission(permission.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CredentialSharingManager;
