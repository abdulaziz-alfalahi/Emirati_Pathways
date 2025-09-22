
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { getUserCareerPaths, getUserCareerPathDetails, deleteUserCareerPath } from '@/services/careerPathService';
import { UserCareerPath, UserCareerPathWithDetails } from '@/types/careerPath';

export const useCareerPaths = (limit?: number) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [userPaths, setUserPaths] = useState<UserCareerPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<UserCareerPathWithDetails | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserPaths = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        const paths = await getUserCareerPaths(user.id);
        setUserPaths(limit ? paths.slice(0, limit) : paths);
      } catch (error) {
        console.error('Error fetching user career paths:', error);
        toast({
          title: "Error",
          description: "Failed to load your career paths",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserPaths();
  }, [user, toast, limit]);

  const handleViewDetails = async (userPath: UserCareerPath) => {
    if (!user) return;
    
    try {
      const pathDetails = await getUserCareerPathDetails(user.id, userPath.career_path_id);
      if (pathDetails) {
        setSelectedPath(pathDetails);
      }
    } catch (error) {
      console.error('Error fetching career path details:', error);
      toast({
        title: "Error",
        description: "Failed to load career path details",
        variant: "destructive"
      });
    }
  };

  const handleDeletePath = async (pathId: string) => {
    if (!user) return;
    
    setDeleting(pathId);
    try {
      const success = await deleteUserCareerPath(user.id, pathId);
      if (success) {
        setUserPaths(userPaths.filter(p => p.id !== pathId));
        toast({
          title: "Success",
          description: "Career path has been removed from your list",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to remove career path",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error removing career path:', error);
      toast({
        title: "Error",
        description: "Failed to remove career path",
        variant: "destructive"
      });
    } finally {
      setDeleting(null);
    }
  };

  return {
    loading,
    userPaths,
    selectedPath,
    deleting,
    handleViewDetails,
    handleDeletePath,
    setSelectedPath
  };
};
