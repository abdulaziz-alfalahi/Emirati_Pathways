import { useState, useEffect, useRef } from 'react';

/**
 * Enhanced debounced search hook with loading states and caching
 * @param searchTerm - The search term to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param onSearch - Callback function to execute when search term changes
 * @returns Object with debouncedTerm, isSearching, and clearCache function
 */
export const useDebouncedSearch = <T = any>(
  searchTerm: string,
  delay: number = 300,
  onSearch?: (term: string) => Promise<T> | void
) => {
  const [debouncedTerm, setDebouncedTerm] = useState(searchTerm);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Cache for search results
  const cacheRef = useRef<Map<string, { results: T; timestamp: number }>>(new Map());
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchTerm !== debouncedTerm) {
        setDebouncedTerm(searchTerm);
        
        if (onSearch && searchTerm.trim()) {
          // Check cache first
          const cached = cacheRef.current.get(searchTerm);
          const now = Date.now();
          
          if (cached && (now - cached.timestamp) < CACHE_DURATION) {
            setSearchResults(cached.results);
            return;
          }
          
          setIsSearching(true);
          setError(null);
          
          try {
            const results = await onSearch(searchTerm);
            if (results) {
              setSearchResults(results);
              // Cache the results
              cacheRef.current.set(searchTerm, { results, timestamp: now });
              
              // Clean up old cache entries
              if (cacheRef.current.size > 50) {
                const oldestEntry = Array.from(cacheRef.current.entries())
                  .sort(([,a], [,b]) => a.timestamp - b.timestamp)[0];
                cacheRef.current.delete(oldestEntry[0]);
              }
            }
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Search failed');
          } finally {
            setIsSearching(false);
          }
        } else if (!searchTerm.trim()) {
          setSearchResults(null);
        }
      }
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay, onSearch, debouncedTerm]);

  const clearCache = () => {
    cacheRef.current.clear();
  };

  return {
    debouncedTerm,
    isSearching,
    searchResults,
    error,
    clearCache
  };
};

/**
 * Simple debounced value hook
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @returns The debounced value
 */
export function useDebounceValue<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Debounced filters hook for handling multiple filter changes
 * @param filters - Filter object to debounce
 * @param delay - Delay in milliseconds (default: 300ms)
 * @param onFiltersChange - Callback when filters change
 * @returns Object with debouncedFilters and batch update function
 */
export const useDebouncedFilters = <T extends Record<string, any>>(
  filters: T,
  delay: number = 300,
  onFiltersChange?: (filters: T) => void
) => {
  const [debouncedFilters, setDebouncedFilters] = useState<T>(filters);
  const [pendingUpdates, setPendingUpdates] = useState<Partial<T>>({});
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Track when filters are actively being changed
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }

    updateTimeoutRef.current = setTimeout(() => {
      const newFilters = { ...filters, ...pendingUpdates };
      setDebouncedFilters(newFilters);
      
      if (onFiltersChange && Object.keys(pendingUpdates).length > 0) {
        onFiltersChange(newFilters);
      }
      
      setPendingUpdates({});
      setIsUpdating(false);
    }, delay);

    setIsUpdating(true);

    return () => {
      if (updateTimeoutRef.current) {
        clearTimeout(updateTimeoutRef.current);
      }
    };
  }, [filters, pendingUpdates, delay, onFiltersChange]);

  const batchUpdateFilters = (updates: Partial<T>) => {
    setPendingUpdates(prev => ({ ...prev, ...updates }));
  };

  return {
    debouncedFilters,
    isUpdating,
    batchUpdateFilters
  };
};
