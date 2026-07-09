
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Clock, ExternalLink, Users, Search } from 'lucide-react';

interface YouthProgram {
  id: string;
  program_name: string;
  organizer: string;
  focus_area: string;
  age_group: string | null;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  program_url: string | null;
  is_active: boolean;
  created_at: string;
}

export const YouthProgramsList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFocusArea, setSelectedFocusArea] = useState('all');
  const [selectedAgeGroup, setSelectedAgeGroup] = useState('all');

  const { data: programs, isLoading, error } = useQuery({
    queryKey: ['youth-development-programs', searchTerm, selectedFocusArea, selectedAgeGroup],
    queryFn: async () => {
      let query = supabase
        .from('youth_development_programs')
        .select('*')
        .eq('is_active', true)
        .order('start_date', { ascending: true });

      // Apply filters
      if (searchTerm) {
        query = query.or(`program_name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,organizer.ilike.%${searchTerm}%`);
      }
      
      if (selectedFocusArea !== 'all') {
        query = query.eq('focus_area', selectedFocusArea);
      }
      
      if (selectedAgeGroup !== 'all') {
        query = query.eq('age_group', selectedAgeGroup);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data as YouthProgram[];
    }
  });

  // Get unique focus areas and age groups for filters
  const { data: filterOptions } = useQuery({
    queryKey: ['youth-programs-filter-options'],
    queryFn: async () => {
      const { data: programs, error } = await supabase
        .from('youth_development_programs')
        .select('focus_area, age_group')
        .eq('is_active', true);
      
      if (error) throw error;

      const focusAreas = [...new Set(programs.map(p => p.focus_area))].sort();
      const ageGroups = [...new Set(programs.map(p => p.age_group).filter(Boolean))].sort();

      return { focusAreas, ageGroups };
    }
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-AE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isUpcoming = (startDate: string | null) => {
    if (!startDate) return false;
    return new Date(startDate) > new Date();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
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

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search programs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={selectedFocusArea} onValueChange={setSelectedFocusArea}>
              <SelectTrigger className="lg:w-48">
                <SelectValue placeholder="Focus Area" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Focus Areas</SelectItem>
                {filterOptions?.focusAreas.map((area) => (
                  <SelectItem key={area} value={area}>
                    {area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
              <SelectTrigger className="lg:w-48">
                <SelectValue placeholder="Age Group" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ages</SelectItem>
                {filterOptions?.ageGroups.map((group) => (
                  <SelectItem key={group} value={group}>
                    {group}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Programs Grid */}
      {!programs || programs.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Programs Found</h3>
              <p className="text-muted-foreground">
                {searchTerm || selectedFocusArea !== 'all' || selectedAgeGroup !== 'all'
                  ? "No programs match your current filters. Try adjusting your search criteria."
                  : "No youth development programs are currently available."
                }
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {programs.map((program) => (
            <Card key={program.id} className="h-full hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg line-clamp-2">{program.program_name}</CardTitle>
                    <CardDescription className="mt-1">{program.organizer}</CardDescription>
                  </div>
                  {isUpcoming(program.start_date) && (
                    <Badge variant="outline" className="ml-2 text-green-600 border-green-200">
                      Upcoming
                    </Badge>
                  )}
                </div>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant="secondary">{program.focus_area}</Badge>
                  {program.age_group && (
                    <Badge variant="outline" className="flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      Ages {program.age_group}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                {program.description && (
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {program.description}
                  </p>
                )}
                
                <div className="space-y-2 mb-4 text-sm">
                  {program.start_date && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-ehrdc-teal" />
                      <span>Starts: {formatDate(program.start_date)}</span>
                    </div>
                  )}
                  {program.end_date && (
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-ehrdc-teal" />
                      <span>Ends: {formatDate(program.end_date)}</span>
                    </div>
                  )}
                </div>
                
                {program.program_url && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <a href={program.program_url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Learn More & Apply
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
