
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Filter, X, Search } from 'lucide-react';
import type { TrainingFilters as TrainingFiltersType } from '@/types/training';

interface TrainingFiltersProps {
  filters: TrainingFiltersType;
  onFiltersChange: (filters: TrainingFiltersType) => void;
  onClearFilters: () => void;
}

export const TrainingFilters: React.FC<TrainingFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters
}) => {
  const handleSearchChange = (search: string) => {
    onFiltersChange({ ...filters, search });
  };

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category: category === 'all' ? undefined : category });
  };

  const handleTrainingModeChange = (training_mode: string) => {
    onFiltersChange({ ...filters, training_mode: training_mode === 'all' ? undefined : training_mode });
  };

  const handleCertificationChange = (certification_offered: boolean) => {
    onFiltersChange({ ...filters, certification_offered });
  };

  const handleJobPlacementChange = (job_placement_assistance: boolean) => {
    onFiltersChange({ ...filters, job_placement_assistance });
  };

  const handlePriceRangeChange = (priceRange: [number, number]) => {
    onFiltersChange({ ...filters, price_range: priceRange });
  };

  const handleDurationChange = (duration: [number, number]) => {
    onFiltersChange({ ...filters, duration_weeks: duration });
  };

  const hasActiveFilters = Object.keys(filters).some(key => {
    const value = filters[key as keyof TrainingFiltersType];
    return value !== undefined && value !== '' && value !== null;
  });

  return (
    <Card className="sticky top-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5 text-[rgb(var(--pg-primary))]" />
            Filters
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-[rgb(var(--pg-secondary))] hover:text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/10]"
            >
              <X className="h-4 w-4 me-1" />
              Clear
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div className="space-y-2">
          <Label htmlFor="search">Search Programs</Label>
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Search by title or provider..."
              value={filters.search || ''}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="ps-10 focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]"
            />
          </div>
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Select value={filters.category || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="technical_skills">Technical Skills</SelectItem>
              <SelectItem value="trade_skills">Trade Skills</SelectItem>
              <SelectItem value="service_skills">Service Skills</SelectItem>
              <SelectItem value="entrepreneurship_business">Entrepreneurship & Business</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Training Mode */}
        <div className="space-y-2">
          <Label htmlFor="mode">Training Mode</Label>
          <Select value={filters.training_mode || 'all'} onValueChange={handleTrainingModeChange}>
            <SelectTrigger className="focus:border-[rgb(var(--pg-primary))] focus:ring-[rgb(var(--pg-primary))]">
              <SelectValue placeholder="All Modes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Modes</SelectItem>
              <SelectItem value="in_person">In-Person</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="hybrid">Hybrid</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Certification */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="certification"
            checked={filters.certification_offered || false}
            onCheckedChange={handleCertificationChange}
            className="data-[state=checked]:bg-[rgb(var(--pg-primary))] data-[state=checked]:border-[rgb(var(--pg-primary))]"
          />
          <Label htmlFor="certification" className="text-sm font-medium">
            Certification Offered
          </Label>
        </div>

        {/* Job Placement */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="placement"
            checked={filters.job_placement_assistance || false}
            onCheckedChange={handleJobPlacementChange}
            className="data-[state=checked]:bg-[rgb(var(--pg-primary))] data-[state=checked]:border-[rgb(var(--pg-primary))]"
          />
          <Label htmlFor="placement" className="text-sm font-medium">
            Job Placement Assistance
          </Label>
        </div>

        {/* Price Range */}
        <div className="space-y-3">
          <Label>Price Range (AED)</Label>
          <div className="px-2">
            <Slider
              defaultValue={filters.price_range || [0, 10000]}
              max={10000}
              step={500}
              onValueChange={handlePriceRangeChange}
              className="[&>.relative>.absolute]:bg-[rgb(var(--pg-primary))]"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>AED {filters.price_range?.[0] || 0}</span>
            <span>AED {filters.price_range?.[1] || 10000}+</span>
          </div>
        </div>

        {/* Duration */}
        <div className="space-y-3">
          <Label>Duration (Weeks)</Label>
          <div className="px-2">
            <Slider
              defaultValue={filters.duration_weeks || [1, 52]}
              max={52}
              step={1}
              onValueChange={handleDurationChange}
              className="[&>.relative>.absolute]:bg-[rgb(var(--pg-secondary))]"
            />
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{filters.duration_weeks?.[0] || 1} weeks</span>
            <span>{filters.duration_weeks?.[1] || 52}+ weeks</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
