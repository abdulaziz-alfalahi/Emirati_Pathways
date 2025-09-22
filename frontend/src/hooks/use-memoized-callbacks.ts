
import { useCallback, useMemo } from 'react';

/**
 * Custom hook for creating stable callback references
 * Useful for preventing unnecessary re-renders in child components
 */
export const useMemoizedCallbacks = <T extends Record<string, (...args: any[]) => any>>(
  callbacks: T,
  dependencies: any[]
): T => {
  return useMemo(() => {
    const memoizedCallbacks = {} as T;
    
    Object.keys(callbacks).forEach((key) => {
      memoizedCallbacks[key as keyof T] = useCallback(
        callbacks[key as keyof T],
        dependencies
      ) as T[keyof T];
    });
    
    return memoizedCallbacks;
  }, dependencies);
};

/**
 * Custom hook for memoizing expensive computations
 */
export const useMemoizedComputation = <T>(
  computation: () => T,
  dependencies: any[]
): T => {
  return useMemo(computation, dependencies);
};

/**
 * Custom hook for creating stable object references
 */
export const useMemoizedObject = <T extends Record<string, any>>(
  obj: T,
  dependencies: any[]
): T => {
  return useMemo(() => obj, dependencies);
};
