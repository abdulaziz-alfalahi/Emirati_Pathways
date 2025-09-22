import { useState, useEffect } from 'react';

/**
 * Hook for persisting filter state across page navigation
 * @param storageKey - Unique key for localStorage
 * @param defaultFilters - Default filter values
 * @returns Object with filters, setFilters, and clearPersistedFilters
 */
export const useFilterPersistence = <T extends Record<string, any>>(
  storageKey: string,
  defaultFilters: T
) => {
  const [filters, setFilters] = useState<T>(() => {
    // Try to load from localStorage on initial mount
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored);
          return { ...defaultFilters, ...parsed };
        }
      } catch (error) {
        console.warn('Failed to parse stored filters:', error);
      }
    }
    return defaultFilters;
  });

  // Save to localStorage whenever filters change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        // Only store non-default values to keep localStorage clean
        const nonDefaultFilters = Object.keys(filters).reduce((acc, key) => {
          const value = filters[key as keyof T];
          const defaultValue = defaultFilters[key as keyof T];
          
          // Only store if value is different from default and not empty
          if (value !== defaultValue && value !== '' && value !== null && value !== undefined) {
            (acc as any)[key] = value;
          }
          
          return acc;
        }, {} as Partial<T>);

        if (Object.keys(nonDefaultFilters).length > 0) {
          localStorage.setItem(storageKey, JSON.stringify(nonDefaultFilters));
        } else {
          localStorage.removeItem(storageKey);
        }
      } catch (error) {
        console.warn('Failed to save filters to localStorage:', error);
      }
    }
  }, [filters, defaultFilters, storageKey]);

  const clearPersistedFilters = () => {
    setFilters(defaultFilters);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  };

  const updateFilters = (newFilters: Partial<T>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  return {
    filters,
    setFilters,
    updateFilters,
    clearPersistedFilters
  };
};

/**
 * Hook for batch filter updates with persistence
 * @param storageKey - Unique key for localStorage  
 * @param defaultFilters - Default filter values
 * @param debounceDelay - Delay before persisting changes
 * @returns Object with filters, batchUpdateFilters, and other utilities
 */
export const usePersistentDebouncedFilters = <T extends Record<string, any>>(
  storageKey: string,
  defaultFilters: T,
  debounceDelay: number = 300
) => {
  const { filters, updateFilters, clearPersistedFilters } = useFilterPersistence(
    storageKey,
    defaultFilters
  );

  const [pendingUpdates, setPendingUpdates] = useState<Partial<T>>({});
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (Object.keys(pendingUpdates).length === 0) return;

    setIsUpdating(true);
    const timer = setTimeout(() => {
      updateFilters(pendingUpdates);
      setPendingUpdates({});
      setIsUpdating(false);
    }, debounceDelay);

    return () => clearTimeout(timer);
  }, [pendingUpdates, debounceDelay, updateFilters]);

  const batchUpdateFilters = (updates: Partial<T>) => {
    setPendingUpdates(prev => ({ ...prev, ...updates }));
  };

  const clearAllFilters = () => {
    setPendingUpdates({});
    clearPersistedFilters();
    setIsUpdating(false);
  };

  return {
    filters: { ...filters, ...pendingUpdates },
    batchUpdateFilters,
    clearAllFilters,
    isUpdating,
    hasPersistedState: typeof window !== 'undefined' && localStorage.getItem(storageKey) !== null
  };
};
