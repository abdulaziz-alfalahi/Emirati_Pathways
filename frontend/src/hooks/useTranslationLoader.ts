
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from '@/lib/i18n';

interface TranslationCache {
  [key: string]: {
    data: any;
    timestamp: number;
    expiry: number;
  };
}

interface UseTranslationLoaderOptions {
  namespace: string;
  preloadLanguages?: string[];
  cacheExpiry?: number; // in milliseconds
}

export const useTranslationLoader = (options: UseTranslationLoaderOptions) => {
  const { namespace, preloadLanguages = ['en', 'ar'], cacheExpiry = 5 * 60 * 1000 } = options;
  const { t, i18n: i18nInstance } = useTranslation(namespace);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedLanguages, setLoadedLanguages] = useState<Set<string>>(new Set());

  // Memory cache for translations
  const cache = useMemo<TranslationCache>(() => {
    const stored = localStorage.getItem(`translation-cache-${namespace}`);
    try {
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }, [namespace]);

  // Save cache to localStorage
  const saveCache = useCallback((newCache: TranslationCache) => {
    try {
      localStorage.setItem(`translation-cache-${namespace}`, JSON.stringify(newCache));
    } catch (error) {
      console.warn('Failed to save translation cache:', error);
    }
  }, [namespace]);

  // Check if cache is valid
  const isCacheValid = useCallback((cacheKey: string): boolean => {
    const cached = cache[cacheKey];
    if (!cached) return false;
    return Date.now() < cached.timestamp + cached.expiry;
  }, [cache]);

  // Load translations for a specific language
  const loadTranslation = useCallback(async (language: string) => {
    const cacheKey = `${language}-${namespace}`;
    
    // Check cache first
    if (isCacheValid(cacheKey)) {
      console.log(`Using cached translation for ${language}:${namespace}`);
      return cache[cacheKey].data;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Force load the namespace for the specific language
      await i18nInstance.loadNamespaces(namespace);
      await i18nInstance.changeLanguage(language);
      
      // Get the loaded resource
      const resource = i18nInstance.getResourceBundle(language, namespace);
      
      if (resource) {
        // Update cache
        const newCache = {
          ...cache,
          [cacheKey]: {
            data: resource,
            timestamp: Date.now(),
            expiry: cacheExpiry
          }
        };
        saveCache(newCache);
        
        setLoadedLanguages(prev => new Set([...prev, language]));
        console.log(`Loaded and cached translation for ${language}:${namespace}`);
        return resource;
      } else {
        throw new Error(`Translation not found for ${language}:${namespace}`);
      }
    } catch (err) {
      const errorMessage = `Failed to load translation for ${language}:${namespace}`;
      console.error(errorMessage, err);
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [namespace, cache, cacheExpiry, isCacheValid, saveCache, i18nInstance]);

  // Preload critical translations
  const preloadTranslations = useCallback(async () => {
    const preloadPromises = preloadLanguages.map(lang => {
      if (!loadedLanguages.has(lang)) {
        return loadTranslation(lang);
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('Some translations failed to preload:', error);
    }
  }, [preloadLanguages, loadedLanguages, loadTranslation]);

  // Enhanced translation function that ensures string return
  const tWithFallback = useCallback((key: string, options?: any): string => {
    try {
      const translation = t(key, { ...options, fallbackLng: 'en' });
      
      // Ensure we always return a string
      if (typeof translation === 'string') {
        // If translation returns the key, it means translation is missing
        if (translation === key) {
          console.warn(`Missing translation key: ${i18nInstance.language}.${namespace}.${key}`);
          
          // Try English fallback if current language is not English
          if (i18nInstance.language !== 'en') {
            const englishResource = i18nInstance.getResourceBundle('en', namespace);
            if (englishResource) {
              const fallbackValue = key.split('.').reduce((obj, k) => obj?.[k], englishResource);
              if (fallbackValue && typeof fallbackValue === 'string') {
                return fallbackValue;
              }
            }
          }
          
          // Return formatted key as last resort
          return key.split('.').pop() || key;
        }
        
        return translation;
      }
      
      // Handle non-string returns by converting to string
      if (translation && typeof translation === 'object') {
        console.warn(`Translation returned object for key: ${key}, converting to string`);
        return JSON.stringify(translation);
      }
      
      return String(translation || key.split('.').pop() || key);
    } catch (error) {
      console.error('Translation error:', error);
      return key.split('.').pop() || key;
    }
  }, [t, namespace, i18nInstance]);

  // Initialize preloading
  useEffect(() => {
    preloadTranslations();
  }, [preloadTranslations]);

  // Handle language changes
  useEffect(() => {
    const handleLanguageChange = async (newLanguage: string) => {
      if (!loadedLanguages.has(newLanguage)) {
        await loadTranslation(newLanguage);
      }
    };

    i18nInstance.on('languageChanged', handleLanguageChange);
    return () => {
      i18nInstance.off('languageChanged', handleLanguageChange);
    };
  }, [loadedLanguages, loadTranslation, i18nInstance]);

  return {
    t: tWithFallback,
    isLoading,
    error,
    loadedLanguages: Array.from(loadedLanguages),
    loadTranslation,
    preloadTranslations,
    clearCache: useCallback(() => {
      localStorage.removeItem(`translation-cache-${namespace}`);
      setLoadedLanguages(new Set());
    }, [namespace])
  };
};
