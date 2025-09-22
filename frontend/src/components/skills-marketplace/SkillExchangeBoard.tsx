
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowRightLeft, Plus, Clock, User, Calendar } from 'lucide-react';
import { skillsMarketplaceService } from '@/services/skillsMarketplaceService';
import { useToast } from '@/hooks/use-toast';
import type { SkillExchangeRequest, Skill, UserSkill } from '@/types/skillsMarketplace';

export const SkillExchangeBoard: React.FC = () => {
  const { toast } = useToast();
  const [exchangeRequests, setExchangeRequests] = useState<SkillExchangeRequest[]>([]);
  const [myRequests, setMyRequests] = useState<SkillExchangeRequest[]>([]);
  const [userSkills, setUserSkills] = useState<UserSkill[]>([]);
  const [allSkills, setAllSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    offered_skill_id: '',
    requested_skill_id: '',
    duration_hours: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [requests, myReqs, skills, allSkillsData] = await Promise.all([
        skillsMarketplaceService.getExchangeRequests(),
        skillsMarketplaceService.getUserExchangeRequests(),
        skillsMarketplaceService.getUserSkills(),
        skillsMarketplaceService.getAllSkills()
      ]);
      
      setExchangeRequests(requests);
      setMyRequests(myReqs);
      setUserSkills(skills);
      setAllSkills(allSkillsData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load exchange requests",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await skillsMarketplaceService.createExchangeRequest({
        title: formData.title,
        description: formData.description,
        offered_skill_id: formData.offered_skill_id,
        requested_skill_id: formData.requested_skill_id,
        duration_hours: formData.duration_hours ? parseInt(formData.duration_hours) : undefined
      });

      toast({
        title: "Success",
        description: "Exchange request created successfully!"
      });

      setShowCreateDialog(false);
      setFormData({
        title: '',
        description: '',
        offered_skill_id: '',
        requested_skill_id: '',
        duration_hours: ''
      });
      loadData();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create exchange request",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-32 bg-gray-200 rounded-lg"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Skill Exchange</h2>
          <p className="text-muted-foreground">Exchange skills with other professionals</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Exchange Request
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Skill Exchange Request</DialogTitle>
              <DialogDescription>
                Offer one of your skills in exchange for learning another
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateRequest} className="space-y-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g., React Developer seeking UX Design mentorship"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you're offering and what you're looking for..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="offered_skill">Skill You're Offering</Label>
                <Select
                  value={formData.offered_skill_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, offered_skill_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill to offer" />
                  </SelectTrigger>
                  <SelectContent>
                    {userSkills.map(userSkill => (
                      <SelectItem key={userSkill.skill_id} value={userSkill.skill_id}>
                        {userSkill.skill?.name} ({userSkill.skill_level})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="requested_skill">Skill You Want to Learn</Label>
                <Select
                  value={formData.requested_skill_id}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, requested_skill_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select skill to learn" />
                  </SelectTrigger>
                  <SelectContent>
                    {allSkills.map(skill => (
                      <SelectItem key={skill.id} value={skill.id}>
                        {skill.name} ({skill.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Input
                  id="duration"
                  type="number"
                  placeholder="e.g., 10"
                  value={formData.duration_hours}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration_hours: e.target.value }))}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">
                  Create Request
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="browse" className="space-y-4">
        <TabsList>
          <TabsTrigger value="browse">Browse Exchanges</TabsTrigger>
          <TabsTrigger value="my-requests">My Requests</TabsTrigger>
        </TabsList>

        <TabsContent value="browse">
          <div className="space-y-4">
            {exchangeRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <ArrowRightLeft className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No exchange requests available</h3>
                  <p className="text-muted-foreground text-center">
                    Be the first to create a skill exchange request
                  </p>
                </CardContent>
              </Card>
            ) : (
              exchangeRequests.map(request => (
                <Card key={request.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{request.title}</h3>
                        {request.description && (
                          <p className="text-muted-foreground mb-3 line-clamp-2">
                            {request.description}
                          </p>
                        )}
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center my-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-1">
                            Offering
                          </Badge>
                          <p className="font-medium">{request.offered_skill?.name}</p>
                          <p className="text-sm text-muted-foreground">{request.offered_skill?.category}</p>
                        </div>
                        <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-1">
                            Seeking
                          </Badge>
                          <p className="font-medium">{request.requested_skill?.name}</p>
                          <p className="text-sm text-muted-foreground">{request.requested_skill?.category}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          {request.requester?.full_name}
                        </div>
                        {request.duration_hours && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {request.duration_hours} hours
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(request.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    {request.status === 'pending' && (
                      <div className="mt-4 pt-4 border-t">
                        <Button className="w-full">
                          Contact Requester
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="my-requests">
          <div className="space-y-4">
            {myRequests.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Plus className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No exchange requests yet</h3>
                  <p className="text-muted-foreground text-center">
                    Create your first skill exchange request to get started
                  </p>
                </CardContent>
              </Card>
            ) : (
              myRequests.map(request => (
                <Card key={request.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">{request.title}</h3>
                        {request.description && (
                          <p className="text-muted-foreground mb-3">{request.description}</p>
                        )}
                      </div>
                      <Badge className={getStatusColor(request.status)}>
                        {request.status}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-center my-4">
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-1">
                            Your Offering
                          </Badge>
                          <p className="font-medium">{request.offered_skill?.name}</p>
                        </div>
                        <ArrowRightLeft className="h-6 w-6 text-muted-foreground" />
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-1">
                            You're Seeking
                          </Badge>
                          <p className="font-medium">{request.requested_skill?.name}</p>
                        </div>
                      </div>
                    </div>

                    {request.matched_with && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm font-medium text-green-800 mb-1">
                          Matched with {request.matched_user?.full_name}
                        </p>
                        <p className="text-sm text-green-600">
                          You can now start your skill exchange session
                        </p>
                      </div>
                    )}

                    <div className="flex items-center justify-between mt-4 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Created {new Date(request.created_at).toLocaleDateString()}
                      </div>
                      {request.duration_hours && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {request.duration_hours} hours
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
