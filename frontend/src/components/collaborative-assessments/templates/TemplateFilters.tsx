
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Filter, X } from 'lucide-react';
import { SearchInput } from '@/components/ui/search-input';
import { useDebouncedFilters } from '@/hooks/use-debounced-search';
import { useSearchAnalytics } from '@/services/searchAnalytics';

interface TemplateFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  categories: string[];
}

export const TemplateFilters: React.FC<TemplateFiltersProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategory,
  onCategoryChange,
  categories
}) => {
  const { trackSearch, trackFilter } = useSearchAnalytics('TemplateFilters');
  
  const filters = { search: searchQuery, category: selectedCategory };
  const { debouncedFilters, isUpdating, batchUpdateFilters } = useDebouncedFilters(
    filters,
    300,
    (newFilters) => {
      if (newFilters.search !== searchQuery) {
        onSearchChange(newFilters.search || '');
        trackSearch(newFilters.search || '', 0, 0, false);
      }
      if (newFilters.category !== selectedCategory) {
        onCategoryChange(newFilters.category || '');
        trackFilter(1, 1, 300);
      }
    }
  );

  const clearFilters = () => {
    batchUpdateFilters({ search: '', category: '' });
  };

  const hasActiveFilters = searchQuery || selectedCategory;

  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
      <div className="flex-1">
        <SearchInput
          placeholder="Search templates by title, description, or tags..."
          value={searchQuery}
          onChange={(value) => batchUpdateFilters({ search: value })}
          debounceDelay={300}
        />
      </div>
      
      <div className="flex gap-2 items-center">
        <Select value={selectedCategory} onValueChange={(value) => batchUpdateFilters({ category: value })}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {hasActiveFilters && (
          <Button variant="outline" size="sm" onClick={clearFilters}>
            <X className="h-4 w-4 mr-2" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
};
