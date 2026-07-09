
import { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
/**
 * Hook to fetch API keys from the server
 */
export const useApiKeys = () => {
  const [tokenRetryCount, setTokenRetryCount] = useState<number>(0);
  const tokenRetryCountRef = useRef<number>(0);

  // Fetch Mapbox API key with retry logic
  const { 
    data: apiKeys, 
    isLoading, 
    error
  } = useQuery({
    queryKey: ['mapbox-api-key', tokenRetryCount],
    queryFn: async () => {
      try {
        // TODO: Connect to Flask API - const { data, error } = await supabase.functions.invoke('get-api-keys', {
          method: 'POST'
        });
        
        if (error) {
          throw error;
        }
        
        // Check if Mapbox token exists
        if (!data || (!data.mapbox_access_token && !data.MAPBOX_ACCESS_TOKEN)) {
          // Try with GET instead
          // TODO: Connect to Flask API - const getResponse = await supabase.functions.invoke('get-api-keys', {
            method: 'GET'
          });
          
          if (getResponse.error || !getResponse.data || 
              (!getResponse.data.mapbox_access_token && !getResponse.data.MAPBOX_ACCESS_TOKEN)) {
            throw new Error("Mapbox token not found");
          }
          
          return getResponse.data;
        }
        
        return data;
      } catch (error) {
        return null;
      }
    },
    retry: 2,
    retryDelay: 1000,
  });

  // Expose a function to retry fetching API keys
  const retryFetchApiKeys = () => {
    tokenRetryCountRef.current += 1;
    setTokenRetryCount(tokenRetryCountRef.current);
  };

  return {
    apiKeys,
    isLoading,
    error,
    retryFetchApiKeys
  };
};
