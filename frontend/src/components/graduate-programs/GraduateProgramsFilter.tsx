
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Filter } from 'lucide-react';

interface FilterState {
  search: string;
  university: string;
  degreeLevel: string;
  fieldOfStudy: string;
  programFormat: string;
  fundingType: string;
}

interface GraduateProgramsFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  universities: string[];
  degreeLevels: string[];
  fieldsOfStudy: string[];
}

const GraduateProgramsFilter: React.FC<GraduateProgramsFilterProps> = ({
  filters,
  onFilterChange,
  universities,
  degreeLevels,
  fieldsOfStudy,
}) => {
  const handleClearFilters = () => {
    onFilterChange({
      search: '',
      university: '',
      degreeLevel: '',
      fieldOfStudy: '',
      programFormat: '',
      fundingType: '',
    });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  const programFormats = ['Full-time', 'Part-time', 'Online', 'Hybrid', 'Weekend'];
  const fundingTypes = ['Scholarship Available', 'Assistantship', 'Fellowship', 'Self-funded', 'Government Sponsored'];

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Filter className="h-5 w-5 mr-2 text-blue-600" />
            Advanced Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearFilters}
              className="h-8 px-2 lg:px-3 text-red-600 hover:text-red-700"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label htmlFor="search" className="text-sm font-medium text-gray-700">
            Search Programs
          </Label>
          <Input
            id="search"
            placeholder="Search by program name, keywords..."
            value={filters.search}
            onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
            className="mt-1"
          />
        </div>

        {/* University */}
        <div>
          <Label className="text-sm font-medium text-gray-700">University</Label>
          <Select
            value={filters.university}
            onValueChange={(value) => onFilterChange({ ...filters, university: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Universities" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all">All Universities</SelectItem>
              {universities.map((university) => (
                <SelectItem key={university} value={university}>
                  {university}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Degree Level */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Degree Level</Label>
          <Select
            value={filters.degreeLevel}
            onValueChange={(value) => onFilterChange({ ...filters, degreeLevel: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Levels" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="Master's">Master's Programs</SelectItem>
              <SelectItem value="PhD">PhD Programs</SelectItem>
              <SelectItem value="Professional">Professional Certificates</SelectItem>
              <SelectItem value="Executive">Executive Education</SelectItem>
              {degreeLevels.map((level) => (
                <SelectItem key={level} value={level}>
                  {level}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Field of Study */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Field of Study</Label>
          <Select
            value={filters.fieldOfStudy}
            onValueChange={(value) => onFilterChange({ ...filters, fieldOfStudy: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Fields" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all">All Fields</SelectItem>
              {fieldsOfStudy.map((field) => (
                <SelectItem key={field} value={field}>
                  {field}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Program Format */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Program Format</Label>
          <Select
            value={filters.programFormat}
            onValueChange={(value) => onFilterChange({ ...filters, programFormat: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Formats" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all">All Formats</SelectItem>
              {programFormats.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Funding Type */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Funding & Scholarships</Label>
          <Select
            value={filters.fundingType}
            onValueChange={(value) => onFilterChange({ ...filters, fundingType: value === 'all' ? '' : value })}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Funding Types" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
              <SelectItem value="all">All Funding Types</SelectItem>
              {fundingTypes.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Research Focus Areas */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Research Focus (PhD Programs)</Label>
          <div className="mt-2 space-y-2">
            {['Artificial Intelligence', 'Sustainability', 'Healthcare Innovation', 'Energy Systems', 'Urban Planning'].map((area) => (
              <div key={area} className="flex items-center space-x-2">
                <Checkbox id={area} />
                <Label htmlFor={area} className="text-sm">{area}</Label>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Filters */}
        <div>
          <Label className="text-sm font-medium text-gray-700 mb-3 block">Quick Filters</Label>
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox id="deadline-soon" />
              <Label htmlFor="deadline-soon" className="text-sm">Application Deadline Soon</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="fully-funded" />
              <Label htmlFor="fully-funded" className="text-sm">Fully Funded Programs</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="english-taught" />
              <Label htmlFor="english-taught" className="text-sm">English Taught</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="uae-based" />
              <Label htmlFor="uae-based" className="text-sm">UAE-Based Programs</Label>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default GraduateProgramsFilter;
