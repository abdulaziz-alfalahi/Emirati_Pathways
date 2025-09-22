
import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Award, BookOpen, Briefcase, ArrowUp } from 'lucide-react';
import CareerPathSelector from './CareerPathSelector';
import UserCareerPaths from './UserCareerPaths';
import { useAuth } from '@/context/AuthContext';
import { getUserCareerPaths } from '@/services/careerPathService';

const CareerPathDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-paths');
  const { user } = useAuth();
  const [pathsCount, setPathsCount] = useState(0);
  const [currentStageType, setCurrentStageType] = useState<Record<string, number>>({
    education: 0,
    career: 0
  });
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchUserPathsStats = async () => {
      if (!user) return;
      
      try {
        const paths = await getUserCareerPaths(user.id);
        setPathsCount(paths.length);
        
        // Count the types of current stages
        const stageTypes: Record<string, number> = { education: 0, career: 0 };
        paths.forEach(path => {
          if (path.current_stage?.stage_type) {
            stageTypes[path.current_stage.stage_type]++;
          }
        });
        
        setCurrentStageType(stageTypes);
      } catch (error) {
        console.error('Error fetching user career paths stats:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserPathsStats();
  }, [user]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Career Pathways</h2>
        <p className="text-muted-foreground">
          Explore career paths or track your progress on your chosen career journey.
        </p>
      </div>
      
      {/* Dashboard stats */}
      {!loading && activeTab === 'my-paths' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Career Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{pathsCount}</div>
                <div className="bg-primary/20 p-2 rounded-full">
                  <Award className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Education Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{currentStageType.education}</div>
                <div className="bg-blue-100 p-2 rounded-full">
                  <BookOpen className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Career Stages</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold">{currentStageType.career}</div>
                <div className="bg-green-100 p-2 rounded-full">
                  <Briefcase className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      
      <Tabs defaultValue={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="my-paths" className="flex items-center justify-center">
            <Briefcase className="h-4 w-4 mr-2" />
            My Career Paths
          </TabsTrigger>
          <TabsTrigger value="explore" className="flex items-center justify-center">
            <ArrowUp className="h-4 w-4 mr-2" />
            Explore Career Paths
          </TabsTrigger>
        </TabsList>
        <TabsContent value="my-paths" className="pt-4 animate-fade-in">
          <UserCareerPaths />
        </TabsContent>
        <TabsContent value="explore" className="pt-4 animate-fade-in">
          <CareerPathSelector />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CareerPathDashboard;
