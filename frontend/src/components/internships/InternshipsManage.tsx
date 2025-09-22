import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger } from '@/components/ui/dialog';
import { InternshipsCreate } from './InternshipsCreate';
import { InternshipWithApplications } from '@/types/internships';
import { getInternshipsWithApplicationCounts, updateInternshipStatus } from '@/services/internshipService';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Briefcase, Clock, PlusCircle, User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { mockInternships } from '@/services/demoData';

interface InternshipsManageProps {
  useMockData?: boolean;
}

export const InternshipsManage: React.FC<InternshipsManageProps> = ({ useMockData = true }) => {
  const [internships, setInternships] = useState<InternshipWithApplications[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchInternships = useCallback(async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      if (useMockData) {
        // Generate mock data for internships with application counts
        setTimeout(() => {
          const mockInternshipsWithApplications = mockInternships
            .filter((_, index) => index < 5) // Take first 5 for management view
            .map(internship => ({
              ...internship,
              applications: {
                pending: Math.floor(Math.random() * 10),
                approved: Math.floor(Math.random() * 5),
                rejected: Math.floor(Math.random() * 3),
                withdrawn: Math.floor(Math.random() * 2),
                get total() { 
                  return this.pending + this.approved + this.rejected + this.withdrawn;
                }
              }
            }));
          
          setInternships(mockInternshipsWithApplications);
          setIsLoading(false);
        }, 800);
      } else {
        const data = await getInternshipsWithApplicationCounts(user.id);
        setInternships(data);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error fetching internships:', error);
      toast({
        title: "Error",
        description: "Failed to load your internship listings",
        variant: "destructive"
      });
      setIsLoading(false);
    }
  }, [user, toast, useMockData]);

  useEffect(() => {
    fetchInternships();
  }, [fetchInternships]);

  const handleSuccess = () => {
    setDialogOpen(false);
    fetchInternships();
    toast({
      title: "Success",
      description: "Internship listing was created successfully"
    });
  };

  const toggleInternshipStatus = async (internship: InternshipWithApplications) => {
    try {
      if (useMockData) {
        // For demo, just update the state locally
        setInternships(prev => 
          prev.map(item => 
            item.id === internship.id 
              ? { ...item, is_active: !item.is_active } 
              : item
          )
        );

        toast({
          title: internship.is_active ? "Internship Deactivated" : "Internship Activated",
          description: `${internship.title} has been ${internship.is_active ? 'deactivated' : 'activated'}`
        });
      } else {
        await updateInternshipStatus(internship.id, !internship.is_active);
        
        // Update local state
        setInternships(prev => 
          prev.map(item => 
            item.id === internship.id 
              ? { ...item, is_active: !item.is_active } 
              : item
          )
        );
        
        toast({
          title: internship.is_active ? "Internship Deactivated" : "Internship Activated",
          description: `${internship.title} has been ${internship.is_active ? 'deactivated' : 'activated'}`
        });
      }
    } catch (error) {
      console.error("Error toggling internship status:", error);
      toast({
        title: "Error",
        description: "Failed to update internship status",
        variant: "destructive"
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Manage Internships</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Post New Internship
            </Button>
          </DialogTrigger>
          <InternshipsCreate onSuccess={handleSuccess} />
        </Dialog>
      </div>

      {internships.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
            <p className="text-center text-gray-600 mb-4">
              You haven't posted any internship listings yet
            </p>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>Post Your First Internship</Button>
              </DialogTrigger>
              <InternshipsCreate onSuccess={handleSuccess} />
            </Dialog>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="expired">Expired</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            {renderInternshipList(internships.filter(i => 
              i.is_active && new Date(i.application_deadline) > new Date()
            ))}
          </TabsContent>

          <TabsContent value="expired" className="space-y-4">
            {renderInternshipList(internships.filter(i => 
              new Date(i.application_deadline) <= new Date()
            ))}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {renderInternshipList(internships)}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );

  function renderInternshipList(filteredInternships: InternshipWithApplications[]) {
    if (filteredInternships.length === 0) {
      return (
        <Card>
          <CardContent className="py-8 text-center text-gray-600">
            No internship listings in this category
          </CardContent>
        </Card>
      );
    }

    return filteredInternships.map((internship) => (
      <Card key={internship.id} className="overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center text-lg md:text-xl">
                {internship.title}
                <div className="ml-2">
                  {new Date(internship.application_deadline) <= new Date() ? (
                    <Badge variant="outline" className="bg-gray-100">Expired</Badge>
                  ) : internship.is_active ? (
                    <Badge className="bg-green-600">Active</Badge>
                  ) : (
                    <Badge variant="outline" className="bg-gray-100">Inactive</Badge>
                  )}
                </div>
              </CardTitle>
              <p className="text-sm text-gray-600">{internship.company}</p>
            </div>
            <Switch 
              checked={internship.is_active} 
              onCheckedChange={() => toggleInternshipStatus(internship)}
              disabled={new Date(internship.application_deadline) <= new Date()}
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-sm">
                Deadline: {new Date(internship.application_deadline).toLocaleDateString()}
                {new Date(internship.application_deadline) > new Date() ? 
                  ` (${formatDistanceToNow(new Date(internship.application_deadline), { addSuffix: true })})` : 
                  ' (Expired)'
                }
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-sm">{internship.applications.total} applications</span>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm" className="text-xs">
                View Applications
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Edit
              </Button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-4 gap-2">
            <div className="col-span-1 rounded-md bg-gray-50 p-2 text-center">
              <div className="text-sm font-medium">Pending</div>
              <div className="text-lg font-bold">{internship.applications.pending}</div>
            </div>
            <div className="col-span-1 rounded-md bg-green-50 p-2 text-center">
              <div className="text-sm font-medium">Approved</div>
              <div className="text-lg font-bold">{internship.applications.approved}</div>
            </div>
            <div className="col-span-1 rounded-md bg-red-50 p-2 text-center">
              <div className="text-sm font-medium">Rejected</div>
              <div className="text-lg font-bold">{internship.applications.rejected}</div>
            </div>
            <div className="col-span-1 rounded-md bg-gray-50 p-2 text-center">
              <div className="text-sm font-medium">Withdrawn</div>
              <div className="text-lg font-bold">{internship.applications.withdrawn}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    ));
  }
};
