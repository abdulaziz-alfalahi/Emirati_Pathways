
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  getCareerPaths,
  getUserCareerPaths, 
  selectCareerPath,
  getCareerPathById,
  updateUserCareerStage
} from '@/services/careerPath';
import { CareerPath, CareerPathWithStages, UserCareerPath, UserCareerPathWithDetails } from '@/types/careerPath';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import CareerPathwayDetails from './CareerPathwayDetails';

const CareerPathway: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [allCareerPaths, setAllCareerPaths] = useState<CareerPath[]>([]);
  const [userCareerPaths, setUserCareerPaths] = useState<UserCareerPath[]>([]);
  const [selectedCareerPath, setSelectedCareerPath] = useState<CareerPathWithStages | null>(null);
  const [selectedUserPath, setSelectedUserPath] = useState<UserCareerPathWithDetails | null>(null);
  const [activeTab, setActiveTab] = useState<string>('explore');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const paths = await getCareerPaths();
        setAllCareerPaths(paths);
        
        const userPaths = await getUserCareerPaths(user.id);
        setUserCareerPaths(userPaths);
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching career paths:', error);
        toast({
          title: "Error",
          description: "Failed to load career paths. Please try again later.",
          variant: "destructive"
        });
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  const handleCareerPathSelect = async (pathId: string) => {
    try {
      setLoadingDetails(true);
      const pathDetails = await getCareerPathById(pathId);
      if (pathDetails) {
        setSelectedCareerPath({...pathDetails, stages: pathDetails.stages || []});
        setSelectedUserPath(null);
        setActiveTab('explore');
      }
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching career path details:', error);
      toast({
        title: "Error",
        description: "Failed to load career path details. Please try again later.",
        variant: "destructive"
      });
      setLoadingDetails(false);
    }
  };

  const handleUserPathSelect = async (userPath: UserCareerPath) => {
    try {
      setLoadingDetails(true);
      const pathDetails = await getCareerPathById(userPath.career_path_id);
      
      if (pathDetails) {
        const userPathWithDetails: UserCareerPathWithDetails = {
          ...userPath,
          career_path: userPath.career_path || {
            id: pathDetails.id,
            title: pathDetails.title,
            description: pathDetails.description,
            industry: pathDetails.industry,
            created_at: pathDetails.created_at,
            updated_at: pathDetails.updated_at
          },
          stages: pathDetails.stages,
          current_stage: userPath.current_stage || pathDetails.stages.find(stage => stage.id === userPath.current_stage_id) || null
        };
        
        setSelectedUserPath(userPathWithDetails);
        setSelectedCareerPath(null);
        setActiveTab('my-paths');
      }
      
      setLoadingDetails(false);
    } catch (error) {
      console.error('Error fetching user career path details:', error);
      toast({
        title: "Error",
        description: "Failed to load your career path details. Please try again later.",
        variant: "destructive"
      });
      setLoadingDetails(false);
    }
  };

  const handleEnrollPath = async () => {
    if (!user || !selectedCareerPath) return;
    
    try {
      await selectCareerPath(user.id, selectedCareerPath.id);
      
      toast({
        title: "Success",
        description: "You have successfully enrolled in this career path."
      });
      
      // Refresh user career paths
      const userPaths = await getUserCareerPaths(user.id);
      setUserCareerPaths(userPaths);
      
      setActiveTab('my-paths');
    } catch (error) {
      console.error('Error enrolling in career path:', error);
      toast({
        title: "Error",
        description: "Failed to enroll in this career path. Please try again later.",
        variant: "destructive"
      });
    }
  };

  const handleProgressStage = async (stageId: string) => {
    if (!selectedUserPath || !user) return;
    
    try {
      await updateUserCareerStage(user.id, selectedUserPath.id, stageId);
      
      toast({
        title: "Progress Updated",
        description: "Your career path progress has been updated."
      });
      
      // Refresh user career paths
      const userPaths = await getUserCareerPaths(user.id);
      setUserCareerPaths(userPaths);
      
      // Update the selected user path
      const updatedUserPath = userPaths.find(p => p.id === selectedUserPath.id);
      if (updatedUserPath) {
        handleUserPathSelect(updatedUserPath);
      }
    } catch (error) {
      console.error('Error updating career stage:', error);
      toast({
        title: "Error",
        description: "Failed to update your progress. Please try again later.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs 
        defaultValue="explore" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="explore">Explore Pathways</TabsTrigger>
          <TabsTrigger value="my-paths">
            My Pathways {userCareerPaths.length > 0 && `(${userCareerPaths.length})`}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="explore" className="space-y-4 pt-4">
          {selectedCareerPath ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedCareerPath(null)}
                >
                  Back to All Paths
                </Button>
                
                {userCareerPaths.some(p => p.career_path_id === selectedCareerPath.id) ? (
                  <Button variant="secondary" disabled>
                    Already Enrolled
                  </Button>
                ) : (
                  <Button onClick={handleEnrollPath}>
                    Enroll in This Path
                  </Button>
                )}
              </div>
              
              <CareerPathwayDetails careerPath={selectedCareerPath} />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {allCareerPaths.map(path => (
                <Card key={path.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <CardDescription>{path.industry}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {path.description && <p className="text-sm text-muted-foreground">{path.description}</p>}
                  </CardContent>
                  <CardFooter className="bg-muted/20 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleCareerPathSelect(path.id)}
                    >
                      View Details
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="my-paths" className="space-y-4 pt-4">
          {userCareerPaths.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>No Pathways Selected</CardTitle>
                <CardDescription>
                  You haven't enrolled in any career pathways yet.
                </CardDescription>
              </CardHeader>
              <CardFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('explore')}
                >
                  Explore Pathways
                </Button>
              </CardFooter>
            </Card>
          ) : selectedUserPath ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => setSelectedUserPath(null)}
                >
                  Back to My Paths
                </Button>
              </div>
              
              <CareerPathwayDetails 
                careerPath={{
                  ...selectedUserPath.career_path,
                  stages: selectedUserPath.stages
                }} 
                currentStageId={selectedUserPath.current_stage_id}
                onStageSelect={handleProgressStage}
              />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {userCareerPaths.map(userPath => (
                <Card key={userPath.id} className="overflow-hidden">
                  <CardHeader>
                    <CardTitle className="text-lg">
                      {userPath.career_path?.title || 'Career Path'}
                    </CardTitle>
                    <CardDescription>
                      {userPath.career_path?.industry || 'Unknown Industry'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      <p className="font-medium">Started: {new Date(userPath.started_at).toLocaleDateString()}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="bg-muted/20 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => handleUserPathSelect(userPath)}
                    >
                      View Progress
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareerPathway;
