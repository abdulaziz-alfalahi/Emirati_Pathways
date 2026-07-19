
import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  Search, 
  Filter, 
  X, 
  ChevronDown, 
  Sparkles,
  TrendingUp,
  Users,
  Clock
} from 'lucide-react';
import { AdvancedSearchFilters, SearchSuggestion } from '@/types/communities';
import { CommunitiesService } from '@/services/communitiesService';
import { toast } from '@/components/ui/use-toast';

interface AdvancedGroupSearchProps {
  onFiltersChange: (filters: AdvancedSearchFilters) => void;
  initialFilters?: AdvancedSearchFilters;
}

const industries = [
  'Technology', 'Healthcare', 'Finance', 'Education', 'Government',
  'Energy', 'Transportation', 'Tourism', 'Real Estate', 'Manufacturing'
];

const categories = [
  'Career Development', 'Industry Networking', 'Skills Exchange',
  'Mentorship', 'Entrepreneurship', 'Leadership', 'Innovation'
];

const activityLevels = [
  { value: 'low', label: 'Low Activity' },
  { value: 'medium', label: 'Medium Activity' },
  { value: 'high', label: 'High Activity' }
];

const sortOptions = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'trending', label: 'Trending' },
  { value: 'newest', label: 'Newest' },
  { value: 'largest', label: 'Most Members' },
  { value: 'recommended', label: 'Recommended' }
];

const AdvancedGroupSearch: React.FC<AdvancedGroupSearchProps> = ({ 
  onFiltersChange, 
  initialFilters = {} 
}) => {
  const [filters, setFilters] = useState<AdvancedSearchFilters>(initialFilters);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [memberRange, setMemberRange] = useState<[number, number]>([0, 10000]);

  const debounce = (func: Function, wait: number) => {
    let timeout: NodeJS.Timeout;
    return function executedFunction(...args: any[]) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length > 1) {
        try {
          const suggestions = await CommunitiesService.getSearchSuggestions(query);
          setSearchSuggestions(suggestions);
          setShowSuggestions(true);
        } catch (error) {
          console.error('Failed to fetch search suggestions:', error);
        }
      } else {
        setShowSuggestions(false);
      }
    }, 300),
    []
  );

  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  useEffect(() => {
    if (filters.search) {
      debouncedSearch(filters.search);
    }
  }, [filters.search, debouncedSearch]);

  const updateFilter = (key: keyof AdvancedSearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({});
    setMemberRange([0, 10000]);
  };

  const applySuggestion = (suggestion: SearchSuggestion) => {
    if (suggestion.type === 'industry') {
      updateFilter('industry', suggestion.value);
    } else if (suggestion.type === 'category') {
      updateFilter('category', suggestion.value);
    } else {
      updateFilter('search', suggestion.value);
    }
    setShowSuggestions(false);
  };

  const hasActiveFilters = Object.keys(filters).some(key => 
    filters[key as keyof AdvancedSearchFilters] !== undefined && 
    filters[key as keyof AdvancedSearchFilters] !== ''
  );

  return (
    <Card className="w-full">
      <CardContent className="p-6 space-y-4">
        {/* Main Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communities by name, description, or tags..."
              value={filters.search || ''}
              onChange={(e) => updateFilter('search', e.target.value)}
              className="ps-10 pe-12"
              onFocus={() => filters.search && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
              className="absolute end-1 top-1/2 transform -translate-y-1/2"
            >
              <Filter className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Search Suggestions */}
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="absolute top-full start-0 end-0 z-50 mt-1 bg-background border rounded-md shadow-lg">
              <div className="p-2 space-y-1">
                {searchSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => applySuggestion(suggestion)}
                    className="w-full text-start px-3 py-2 hover:bg-muted rounded-sm flex items-center justify-between"
                  >
                    <span className="flex items-center space-x-2">
                      <Badge variant="secondary" className="text-xs">
                        {suggestion.type}
                      </Badge>
                      <span>{suggestion.value}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {suggestion.count} groups
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Quick Filter Tags */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.sort_by === 'recommended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort_by', 'recommended')}
            className="h-8"
          >
            <Sparkles className="h-3 w-3 me-1" />
            Recommended
          </Button>
          <Button
            variant={filters.sort_by === 'trending' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort_by', 'trending')}
            className="h-8"
          >
            <TrendingUp className="h-3 w-3 me-1" />
            Trending
          </Button>
          <Button
            variant={filters.sort_by === 'largest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort_by', 'largest')}
            className="h-8"
          >
            <Users className="h-3 w-3 me-1" />
            Most Members
          </Button>
          <Button
            variant={filters.sort_by === 'newest' ? 'default' : 'outline'}
            size="sm"
            onClick={() => updateFilter('sort_by', 'newest')}
            className="h-8"
          >
            <Clock className="h-3 w-3 me-1" />
            Newest
          </Button>
        </div>

        {/* Advanced Filters */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between p-0">
              <span>Advanced Filters</span>
              <ChevronDown className={`h-4 w-4 transition-transform ${isAdvancedOpen ? 'rotate-180' : ''}`} />
            </Button>
          </CollapsibleTrigger>
          
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Industry Filter */}
              <div>
                <Label htmlFor="industry">Industry</Label>
                <Select value={filters.industry || ''} onValueChange={(value) => updateFilter('industry', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Industries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Industries</SelectItem>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={filters.category || ''} onValueChange={(value) => updateFilter('category', value || undefined)}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Sort By */}
              <div>
                <Label htmlFor="sort">Sort By</Label>
                <Select value={filters.sort_by || 'relevance'} onValueChange={(value) => updateFilter('sort_by', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Member Count Range */}
            <div className="space-y-2">
              <Label>Member Count Range</Label>
              <div className="px-3">
                <Slider
                  value={memberRange}
                  onValueChange={(value) => {
                    setMemberRange(value as [number, number]);
                    updateFilter('min_members', value[0]);
                    updateFilter('max_members', value[1] === 10000 ? undefined : value[1]);
                  }}
                  max={10000}
                  min={0}
                  step={10}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-muted-foreground mt-1">
                  <span>{memberRange[0]} members</span>
                  <span>{memberRange[1] === 10000 ? '10,000+' : memberRange[1]} members</span>
                </div>
              </div>
            </div>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="private-groups"
                  checked={filters.is_private === false}
                  onCheckedChange={(checked) => updateFilter('is_private', checked ? false : undefined)}
                />
                <Label htmlFor="private-groups">Public groups only</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="recent-activity"
                  checked={filters.has_recent_activity || false}
                  onCheckedChange={(checked) => updateFilter('has_recent_activity', checked || undefined)}
                />
                <Label htmlFor="recent-activity">Active this week</Label>
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="flex justify-end">
                <Button variant="outline" onClick={clearFilters} size="sm">
                  <X className="h-4 w-4 me-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
};

export default AdvancedGroupSearch;
