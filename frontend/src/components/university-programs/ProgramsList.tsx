
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import ProgramCard from './ProgramCard';
import { Card, CardContent } from '@/components/ui/card';
import { GraduationCap } from 'lucide-react';

interface FilterState {
  search: string;
  university: string;
  degreeLevel: string;
  fieldOfStudy: string;
  location: string;
  language: string;
}

interface ProgramsListProps {
  filters: FilterState;
}

const ProgramsList: React.FC<ProgramsListProps> = ({ filters }) => {
  const { data: programs, isLoading, error } = useQuery({
    queryKey: ['university-programs', filters],
    queryFn: async () => {
      let query = supabase
        .from('university_programs')
        .select('*')
        .eq('is_active', true);

      // Apply filters
      if (filters.search) {
        query = query.or(`program_name.ilike.%${filters.search}%,university_name.ilike.%${filters.search}%`);
      }
      
      if (filters.university) {
        query = query.eq('university_name', filters.university);
      }
      
      if (filters.degreeLevel) {
        query = query.eq('degree_level', filters.degreeLevel);
      }
      
      if (filters.fieldOfStudy) {
        query = query.eq('field_of_study', filters.fieldOfStudy);
      }

      const { data, error } = await query.order('created_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    }
  });

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="h-80">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Failed to load programs. Please try again later.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!programs || programs.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <GraduationCap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Programs Found</h3>
            <p className="text-muted-foreground">
              Try adjusting your filters to see more programs.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">
          {programs.length} program{programs.length !== 1 ? 's' : ''} found
        </h3>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {programs.map((program) => (
          <ProgramCard 
            key={program.id} 
            program={program}
            onApply={(id) => console.log('Apply to program:', id)}
            onSave={(id) => console.log('Save program:', id)}
          />
        ))}
      </div>
    </div>
  );
};

export default ProgramsList;
