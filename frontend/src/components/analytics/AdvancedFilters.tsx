
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Filter, X, RotateCcw } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface FilterState {
  emirate: string;
  sector: string;
  timeframe: string;
  skillCategory?: string;
  experienceLevel?: string;
  educationLevel?: string;
  emiratizationRange?: [number, number];
  dateRange?: {
    from: Date;
    to: Date;
  };
  searchTerm?: string;
}

interface AdvancedFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  availableOptions: {
    emirates: string[];
    sectors: string[];
    skillCategories: string[];
    experienceLevel: string[];
    educationLevels: string[];
  };
  onCrossFilter?: (filterType: string, value: string) => void;
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  availableOptions,
  onCrossFilter
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>(filters.dateRange);

  const updateFilter = (key: keyof FilterState, value: any) => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterState = {
      emirate: 'all',
      sector: 'all',
      timeframe: '2024'
    };
    onFiltersChange(clearedFilters);
    setDateRange(undefined);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.emirate !== 'all') count++;
    if (filters.sector !== 'all') count++;
    if (filters.skillCategory) count++;
    if (filters.experienceLevel) count++;
    if (filters.educationLevel) count++;
    if (filters.searchTerm) count++;
    if (filters.dateRange) count++;
    if (filters.emiratizationRange) count++;
    return count;
  };

  const handleDateSelect = (range: { from: Date; to: Date } | undefined) => {
    setDateRange(range);
    updateFilter('dateRange', range);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge variant="secondary">{getActiveFilterCount()} active</Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Collapse' : 'Expand'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-muted-foreground"
            >
              <RotateCcw className="h-4 w-4 me-1" />
              Clear All
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Filters - Always Visible */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Emirates</label>
            <Select value={filters.emirate} onValueChange={(value) => updateFilter('emirate', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Emirates" />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.emirates.map((emirate) => (
                  <SelectItem key={emirate} value={emirate}>
                    {emirate === 'all' ? 'All Emirates' : emirate}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sector</label>
            <Select value={filters.sector} onValueChange={(value) => updateFilter('sector', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select Sector" />
              </SelectTrigger>
              <SelectContent>
                {availableOptions.sectors.map((sector) => (
                  <SelectItem key={sector} value={sector}>
                    {sector === 'all' ? 'All Sectors' : sector}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Search</label>
            <Input
              placeholder="Search by keyword..."
              value={filters.searchTerm || ''}
              onChange={(e) => updateFilter('searchTerm', e.target.value)}
            />
          </div>
        </div>

        {/* Advanced Filters - Expandable */}
        {isExpanded && (
          <div className="space-y-4 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Skill Category</label>
                <Select 
                  value={filters.skillCategory || ''} 
                  onValueChange={(value) => updateFilter('skillCategory', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {availableOptions.skillCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Experience Level</label>
                <Select 
                  value={filters.experienceLevel || ''} 
                  onValueChange={(value) => updateFilter('experienceLevel', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    {availableOptions.experienceLevel.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Education Level</label>
                <Select 
                  value={filters.educationLevel || ''} 
                  onValueChange={(value) => updateFilter('educationLevel', value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Education" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Levels</SelectItem>
                    {availableOptions.educationLevels.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date Range</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-start font-normal">
                      <Calendar className="me-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, 'LLL dd, y')} - {format(dateRange.to, 'LLL dd, y')}
                          </>
                        ) : (
                          format(dateRange.from, 'LLL dd, y')
                        )
                      ) : (
                        'Select date range'
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Emiratization Range (%)</label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder="Min"
                    min="0"
                    max="100"
                    value={filters.emiratizationRange?.[0] || ''}
                    onChange={(e) => {
                      const min = parseInt(e.target.value) || 0;
                      const max = filters.emiratizationRange?.[1] || 100;
                      updateFilter('emiratizationRange', [min, max]);
                    }}
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="number"
                    placeholder="Max"
                    min="0"
                    max="100"
                    value={filters.emiratizationRange?.[1] || ''}
                    onChange={(e) => {
                      const max = parseInt(e.target.value) || 100;
                      const min = filters.emiratizationRange?.[0] || 0;
                      updateFilter('emiratizationRange', [min, max]);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters Display */}
        {getActiveFilterCount() > 0 && (
          <div className="flex flex-wrap gap-2 pt-4 border-t">
            <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
            {filters.emirate !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Emirates: {filters.emirate}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('emirate', 'all')}
                />
              </Badge>
            )}
            {filters.sector !== 'all' && (
              <Badge variant="secondary" className="gap-1">
                Sector: {filters.sector}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('sector', 'all')}
                />
              </Badge>
            )}
            {filters.skillCategory && (
              <Badge variant="secondary" className="gap-1">
                Skill: {filters.skillCategory}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('skillCategory', undefined)}
                />
              </Badge>
            )}
            {filters.searchTerm && (
              <Badge variant="secondary" className="gap-1">
                Search: {filters.searchTerm}
                <X 
                  className="h-3 w-3 cursor-pointer" 
                  onClick={() => updateFilter('searchTerm', undefined)}
                />
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
