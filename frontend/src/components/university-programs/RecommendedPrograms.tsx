
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import ProgramCard from './ProgramCard';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Brain, TrendingUp } from 'lucide-react';

interface FilterState {
  search: string;
  university: string;
  degreeLevel: string;
  fieldOfStudy: string;
  location: string;
  language: string;
}

interface RecommendedProgramsProps {
  filters: FilterState;
}

const RecommendedPrograms: React.FC<RecommendedProgramsProps> = ({ filters }) => {
  const { user } = useAuth();

  const { data: programs, isLoading, error } = useQuery({
    queryKey: ['recommended-programs', user?.id, filters],
    queryFn: async () => {
      // For now, return a subset of programs as "recommended"
      // In a real implementation, this would use ML/AI to recommend based on user profile
      let query = supabase
        .from('university_programs')
        .select('*')
        .eq('is_active', true)
        .limit(6); // Show top 6 recommendations

      // Apply basic filtering logic for recommendations
      if (filters.degreeLevel) {
        query = query.eq('degree_level', filters.degreeLevel);
      }
      
      if (filters.fieldOfStudy) {
        query = query.eq('field_of_study', filters.fieldOfStudy);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user
  });

  if (!user) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Sign in for Personalized Recommendations</h3>
            <p className="text-muted-foreground">
              Get program recommendations tailored to your interests and academic background.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        {[1, 2, 3, 4].map(i => (
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
            Failed to load recommendations. Please try again later.
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
            <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
            <p className="text-muted-foreground">
              Complete your profile to get personalized program recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Recommendation Info */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold text-blue-900">Personalized for You</h3>
              <p className="text-sm text-blue-700">
                Based on your interests and academic background
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommended Programs Grid */}
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

export default RecommendedPrograms;
