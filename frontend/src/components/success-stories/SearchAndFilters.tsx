
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SlidersHorizontal, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedFilters } from '@/hooks/use-debounced-search';
import { useSearchAnalytics } from '@/services/searchAnalytics';
import CategoryFilter from './CategoryFilter';

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
  storyCounts?: Record<string, number>;
  popularTags?: string[];
  selectedTags?: string[];
  onTagToggle?: (tag: string) => void;
}

const SearchAndFilters: React.FC<SearchAndFiltersProps> = ({
  searchTerm,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  sortBy,
  onSortChange,
  onClearFilters,
  storyCounts = {},
  popularTags = [],
  selectedTags = [],
  onTagToggle
}) => {
  const { trackSearch, trackFilter } = useSearchAnalytics('SearchAndFilters');
  
  const filters = { search: searchTerm, category: selectedCategory, tags: selectedTags };
  const { debouncedFilters, batchUpdateFilters } = useDebouncedFilters(
    filters,
    400, // Slightly longer debounce for complex filters
    (newFilters) => {
      if (newFilters.search !== searchTerm) {
        onSearchChange(newFilters.search || '');
        trackSearch(newFilters.search || '', 0, 0, false);
      }
      if (newFilters.category !== selectedCategory) {
        onCategoryChange(newFilters.category || 'all');
        trackFilter(1, 1, 400);
      }
    }
  );

  const hasActiveFilters = searchTerm || selectedCategory !== 'all' || selectedTags.length > 0;

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div>
        <SearchInput
          placeholder="Search stories by title, summary, or tags..."
          value={searchTerm}
          onChange={(value) => batchUpdateFilters({ search: value })}
          debounceDelay={400}
        />
      </div>

      {/* Category Filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onCategoryChange={onCategoryChange}
        storyCounts={storyCounts}
      />

      {/* Popular Tags */}
      {popularTags.length > 0 && onTagToggle && (
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <h3 className="text-sm font-medium">Popular Tags</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {popularTags.map((tag) => {
              const isSelected = selectedTags.includes(tag);
              return (
                <Badge
                  key={tag}
                  variant={isSelected ? "default" : "secondary"}
                  className={`cursor-pointer transition-colors ${
                    isSelected 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10 hover:text-primary"
                  }`}
                  onClick={() => onTagToggle(tag)}
                >
                  {tag}
                  {isSelected && <X className="h-3 w-3 ml-1" />}
                </Badge>
              );
            })}
          </div>
        </div>
      )}

      {/* Sort and Clear Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="newest">Newest First</SelectItem>
            <SelectItem value="popular">Most Popular</SelectItem>
            <SelectItem value="alphabetical">Alphabetical</SelectItem>
            <SelectItem value="most_liked">Most Liked</SelectItem>
          </SelectContent>
        </Select>
        
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            onClick={onClearFilters}
            className="flex items-center space-x-2"
          >
            <X className="h-4 w-4" />
            <span>Clear Filters</span>
          </Button>
        )}
      </div>

      {/* Active Filters Summary */}
      {hasActiveFilters && (
        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <span>Active filters:</span>
          {searchTerm && (
            <Badge variant="outline" className="text-xs">
              Search: "{searchTerm}"
            </Badge>
          )}
          {selectedCategory !== 'all' && (
            <Badge variant="outline" className="text-xs">
              Category: {selectedCategory.replace('_', ' ')}
            </Badge>
          )}
          {selectedTags.map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              Tag: {tag}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
};

export default SearchAndFilters;
