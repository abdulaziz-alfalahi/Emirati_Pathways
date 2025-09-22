
import { toast } from 'sonner';

/**
 * Retrieves a token from localStorage if it exists
 */
export const getSavedToken = (): string | null => {
  try {
    return localStorage.getItem('mapbox_custom_token');
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

/**
 * Saves a token to localStorage
 */
export const saveToken = (token: string): boolean => {
  if (!token.trim()) {
    toast.error("Please enter a valid Mapbox token");
    return false;
  }
  
  try {
    // Save token to localStorage for persistence
    localStorage.setItem('mapbox_custom_token', token);
    toast.success("Mapbox token applied");
    return true;
  } catch (error) {
    console.error('Error saving token to localStorage:', error);
    toast.error("Failed to save token");
    return false;
  }
};

/**
 * Get an effective token from multiple possible sources
 */
export const getEffectiveToken = (
  apiKeys: Record<string, string> | null | undefined,
  customToken: string
): string | null => {
  return apiKeys?.mapbox_access_token || 
    apiKeys?.MAPBOX_ACCESS_TOKEN || 
    getSavedToken() || 
    customToken || 
    null;
};
