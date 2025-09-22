
import { AffindaAPI, AffindaCredential } from '@affinda/affinda';

/**
 * Initialize the Affinda client with proper credential handling
 */
export const createAffindaClient = (apiKey?: string) => {
  // Try to get the API key from environment variables first
  const key = apiKey || import.meta.env.VITE_AFFINDA_API_KEY;
  
  if (!key) {
    console.warn('No Affinda API key provided');
    return null;
  }
  
  const credential = new AffindaCredential(key);
  return new AffindaAPI(credential);
};
