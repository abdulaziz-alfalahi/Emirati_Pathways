
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { TrainingProgramCard } from './TrainingProgramCard';
import { trainingService } from '@/services/trainingService';
import type { TrainingProgram, TrainingFilters } from '@/types/training';

interface TrainingProgramsListProps {
  filters: TrainingFilters;
  onApply: (programId: string) => void;
  onViewDetails: (programId: string) => void;
}

export const TrainingProgramsList: React.FC<TrainingProgramsListProps> = ({
  filters,
  onApply,
  onViewDetails
}) => {
  const { toast } = useToast();
  const [programs, setPrograms] = useState<TrainingProgram[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPrograms();
  }, [filters]);

  const loadPrograms = async () => {
    try {
      setLoading(true);
      const data = await trainingService.getTrainingPrograms(filters);
      setPrograms(data);
    } catch (error) {
      console.error('Error loading training programs:', error);
      toast({
        title: "Error",
        description: "Failed to load training programs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Card key={i} className="h-96">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-32 bg-gray-200 rounded"></div>
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

  if (programs.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg text-muted-foreground">No training programs found</p>
          <p className="text-sm text-muted-foreground mt-2">
            Try adjusting your filters or search terms
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {programs.map(program => (
        <TrainingProgramCard
          key={program.id}
          program={program}
          onApply={onApply}
          onViewDetails={onViewDetails}
        />
      ))}
    </div>
  );
};
