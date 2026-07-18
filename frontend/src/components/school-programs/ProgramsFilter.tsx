
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';
import { ProgramFilters } from '@/types/schoolPrograms';

interface ProgramsFilterProps {
  onFilterChange: (filters: ProgramFilters) => void;
  onSearchChange: (query: string) => void;
  selectedFilters: ProgramFilters;
  searchQuery: string;
}

const ProgramsFilter: React.FC<ProgramsFilterProps> = ({
  onFilterChange,
  onSearchChange,
  selectedFilters,
  searchQuery
}) => {
  const gradeLevels = ['Elementary', 'Middle School', 'High School'];
  const subjectAreas = ['STEM', 'Languages', 'Arts', 'Business', 'Sports', 'Life Skills'];
  const programTypes = ['After School', 'Weekend', 'Summer', 'Holiday', 'Intensive'];

  const handleGradeLevelChange = (level: string, checked: boolean) => {
    const current = selectedFilters.gradeLevel || [];
    const updated = checked 
      ? [...current, level]
      : current.filter(l => l !== level);
    
    onFilterChange({
      ...selectedFilters,
      gradeLevel: updated
    });
  };

  const handleSubjectAreaChange = (area: string, checked: boolean) => {
    const current = selectedFilters.subjectArea || [];
    const updated = checked 
      ? [...current, area]
      : current.filter(a => a !== area);
    
    onFilterChange({
      ...selectedFilters,
      subjectArea: updated
    });
  };

  const handleProgramTypeChange = (type: string, checked: boolean) => {
    const current = selectedFilters.programType || [];
    const updated = checked 
      ? [...current, type]
      : current.filter(t => t !== type);
    
    onFilterChange({
      ...selectedFilters,
      programType: updated
    });
  };

  const clearAllFilters = () => {
    onFilterChange({});
    onSearchChange('');
  };

  const hasActiveFilters = 
    (selectedFilters.gradeLevel?.length || 0) > 0 ||
    (selectedFilters.subjectArea?.length || 0) > 0 ||
    (selectedFilters.programType?.length || 0) > 0 ||
    searchQuery.length > 0;

  return (
    <Card className="h-fit sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-ehrdc-teal" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-ehrdc-teal hover:text-ehrdc-dark-teal"
            >
              <X className="h-4 w-4 me-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium">Search Programs</Label>
          <div className="relative mt-2">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              id="search"
              placeholder="Search by title, institution..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="ps-10"
            />
          </div>
        </div>

        {/* Grade Level */}
        <div>
          <Label className="text-sm font-medium">Grade Level</Label>
          <div className="space-y-2 mt-2">
            {gradeLevels.map((level) => (
              <div key={level} className="flex items-center space-x-2">
                <Checkbox
                  id={`grade-${level}`}
                  checked={selectedFilters.gradeLevel?.includes(level) || false}
                  onCheckedChange={(checked) => 
                    handleGradeLevelChange(level, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`grade-${level}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {level}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Subject Area */}
        <div>
          <Label className="text-sm font-medium">Subject Area</Label>
          <div className="space-y-2 mt-2">
            {subjectAreas.map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox
                  id={`subject-${area}`}
                  checked={selectedFilters.subjectArea?.includes(area) || false}
                  onCheckedChange={(checked) => 
                    handleSubjectAreaChange(area, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`subject-${area}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {area}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Program Type */}
        <div>
          <Label className="text-sm font-medium">Program Type</Label>
          <div className="space-y-2 mt-2">
            {programTypes.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`type-${type}`}
                  checked={selectedFilters.programType?.includes(type) || false}
                  onCheckedChange={(checked) => 
                    handleProgramTypeChange(type, checked as boolean)
                  }
                />
                <Label
                  htmlFor={`type-${type}`}
                  className="text-sm font-normal cursor-pointer"
                >
                  {type}
                </Label>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProgramsFilter;
