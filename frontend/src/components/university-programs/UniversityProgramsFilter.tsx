
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, X } from 'lucide-react';

interface FilterState {
  search: string;
  university: string;
  degreeLevel: string;
  fieldOfStudy: string;
  location: string;
  language: string;
}

interface UniversityProgramsFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  universities: string[];
  degreeLevels: string[];
  fieldsOfStudy: string[];
}

const UniversityProgramsFilter: React.FC<UniversityProgramsFilterProps> = ({
  filters,
  onFilterChange,
  universities,
  degreeLevels,
  fieldsOfStudy
}) => {
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    // Convert "all" back to empty string for filtering logic
    const filterValue = value === 'all' ? '' : value;
    onFilterChange({
      ...filters,
      [key]: filterValue
    });
  };

  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      university: '',
      degreeLevel: '',
      fieldOfStudy: '',
      location: '',
      language: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filter Programs
          </CardTitle>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={handleClearFilters}>
              <X className="h-4 w-4 me-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Programs</Label>
          <div className="relative">
            <Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by program or university..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="ps-10"
            />
          </div>
        </div>

        {/* University */}
        <div className="space-y-2">
          <Label>University</Label>
          <Select 
            value={filters.university || 'all'} 
            onValueChange={(value) => handleFilterChange('university', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Universities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map(university => (
                <SelectItem key={university} value={university}>{university}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Degree Level */}
        <div className="space-y-2">
          <Label>Degree Level</Label>
          <Select 
            value={filters.degreeLevel || 'all'} 
            onValueChange={(value) => handleFilterChange('degreeLevel', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              {degreeLevels.map(level => (
                <SelectItem key={level} value={level}>{level}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Field of Study */}
        <div className="space-y-2">
          <Label>Field of Study</Label>
          <Select 
            value={filters.fieldOfStudy || 'all'} 
            onValueChange={(value) => handleFilterChange('fieldOfStudy', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Fields" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Fields</SelectItem>
              {fieldsOfStudy.map(field => (
                <SelectItem key={field} value={field}>{field}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label>Location</Label>
          <Select 
            value={filters.location || 'all'} 
            onValueChange={(value) => handleFilterChange('location', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Locations</SelectItem>
              <SelectItem value="uae">UAE</SelectItem>
              <SelectItem value="international">International</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Language */}
        <div className="space-y-2">
          <Label>Language of Instruction</Label>
          <Select 
            value={filters.language || 'all'} 
            onValueChange={(value) => handleFilterChange('language', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Languages" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Languages</SelectItem>
              <SelectItem value="english">English</SelectItem>
              <SelectItem value="arabic">Arabic</SelectItem>
              <SelectItem value="bilingual">Bilingual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
};

export default UniversityProgramsFilter;
