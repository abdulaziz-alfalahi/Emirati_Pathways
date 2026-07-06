import { ApiKeyResponse } from './types';

/**
 * Fetch Affinda API key from Supabase
 * @returns Promise resolving to the API key
 */
export const getAffindaApiKey = async (): Promise<string | null> => {
  try {
    // First try to get from environment variable
    const envApiKey = import.meta.env.VITE_AFFINDA_API_KEY;
    if (envApiKey) {
      console.log('Using Affinda API key from environment variables');
      return envApiKey;
    }
    
    // Then try to query for the affinda_api_key field
    const { data, error } = await supabase
      .from('api_keys')
      .select('affinda_api_key')
      .maybeSingle();
    
    if (error) {
      console.error('Error fetching Affinda API key:', error);
      return null;
    }
    
    // Handle the case where data might be null
    const apiKeyResponse = data as ApiKeyResponse | null;
    
    if (!apiKeyResponse?.affinda_api_key) {
      console.warn('No Affinda API key found in database');
      // Return a fallback demo key for development purposes
      return import.meta.env.VITE_FALLBACK_AFFINDA_API_KEY || null;
    }
    
    // Return the API key if found
    return apiKeyResponse.affinda_api_key;
  } catch (error) {
    console.error('Exception fetching Affinda API key:', error);
    return null;
  }
};
