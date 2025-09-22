
import React, { useEffect, useState } from 'react';
import { legacyProjectService } from '@/services/legacyProjectService';
import { LegacyProject } from '@/types/legacyProject';
import { ProjectCard } from './ProjectCard';
import { ProjectFilters } from './ProjectFilters';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';

export const ExploreProjectsTab: React.FC = () => {
  const [projects, setProjects] = useState<LegacyProject[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<LegacyProject[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const projectsData = await legacyProjectService.getActiveProjects();
        setProjects(projectsData);
        setFilteredProjects(projectsData);
      } catch (error) {
        console.error('Error fetching projects:', error);
        toast({
          title: "Error",
          description: "Failed to load legacy projects",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [toast]);

  const handleFilterChange = (filters: {
    focusArea: string;
    status: string;
    searchTerm: string;
  }) => {
    let filtered = projects;

    if (filters.focusArea !== 'all') {
      filtered = filtered.filter(project => project.focus_area === filters.focusArea);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(project => project.project_status === filters.status);
    }

    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(project => 
        project.title.toLowerCase().includes(searchLower) ||
        project.description?.toLowerCase().includes(searchLower) ||
        project.location?.toLowerCase().includes(searchLower)
      );
    }

    setFilteredProjects(filtered);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-ehrdc-teal" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ProjectFilters onFilterChange={handleFilterChange} />
      
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-600">No projects found matching your criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
};
