
import { useState, useEffect, useCallback } from 'react';
import { useApiKeys } from './map/useApiKeys';
import { getSavedToken, saveToken, getEffectiveToken } from './map/tokenUtils';

export const useMapboxToken = () => {
  const [customMapboxToken, setCustomMapboxToken] = useState<string>('');
  const [showTokenInput, setShowTokenInput] = useState<boolean>(false);
  
  const { apiKeys, isLoading: isLoadingApiKeys, error: apiKeysError } = useApiKeys();

  // Effect to check if we need to show token input
  useEffect(() => {
    if (apiKeysError || (apiKeys && !apiKeys.mapbox_access_token && !apiKeys.MAPBOX_ACCESS_TOKEN)) {
      setShowTokenInput(true);
    } else if (apiKeys && (apiKeys.mapbox_access_token || apiKeys.MAPBOX_ACCESS_TOKEN)) {
      setShowTokenInput(false);
    }
  }, [apiKeys, apiKeysError]);

  // Effect to load a saved token from localStorage
  useEffect(() => {
    const savedToken = getSavedToken();
    
    if (savedToken) {
      setCustomMapboxToken(savedToken);
    }
  }, []);

  // Handle token submission
  const handleTokenSubmit = useCallback(() => {
    return saveToken(customMapboxToken);
  }, [customMapboxToken]);

  // Get the effective token from available sources
  const getEffectiveTokenCallback = useCallback(() => {
    return getEffectiveToken(apiKeys, customMapboxToken);
  }, [apiKeys, customMapboxToken]);

  return {
    customMapboxToken,
    setCustomMapboxToken,
    showTokenInput,
    setShowTokenInput,
    isLoadingApiKeys,
    handleTokenSubmit,
    getEffectiveToken: getEffectiveTokenCallback
  };
};
