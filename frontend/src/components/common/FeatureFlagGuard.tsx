import React, { createContext, useContext, useEffect, useState } from 'react';
import axios from 'axios';
import ComingSoon from './ComingSoon';

// Setup basic Feature Flag Context
interface FeatureFlag {
  key_name: string;
  name: string;
  description: string;
  is_enabled: boolean;
}

interface FeatureFlagsContextType {
  flags: Record<string, boolean>;
  isLoading: boolean;
  refreshFlags: () => Promise<void>;
}

const FeatureFlagsContext = createContext<FeatureFlagsContextType>({
  flags: {},
  isLoading: true,
  refreshFlags: async () => {}
});

export const FeatureFlagsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flags, setFlags] = useState<Record<string, boolean>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchFlags = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await axios.get(`/api/feature-flags?t=${timestamp}`);
      if (response.data.success) {
        const flagsMap: Record<string, boolean> = {};
        response.data.data.forEach((flag: FeatureFlag) => {
          flagsMap[flag.key_name] = flag.is_enabled;
        });
        setFlags(flagsMap);
      }
    } catch (error) {
      console.error('Failed to fetch feature flags:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  return (
    <FeatureFlagsContext.Provider value={{ flags, isLoading, refreshFlags: fetchFlags }}>
      {children}
    </FeatureFlagsContext.Provider>
  );
};

export const useFeatureFlags = () => useContext(FeatureFlagsContext);

// Guard Component
interface FeatureFlagGuardProps {
  flagKey: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  moduleName?: string;
}

const FeatureFlagGuard: React.FC<FeatureFlagGuardProps> = ({ 
  flagKey, 
  children, 
  fallback,
  moduleName = "This module"
}) => {
  const { flags, isLoading } = useFeatureFlags();

  if (isLoading) {
    // Show a gentle loading state while flags are being evaluated
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If the flag is not defined, we default to enabled for backward compatibility
  const isEnabled = flags[flagKey] ?? true;

  if (!isEnabled) {
    if (fallback) {
      return <>{fallback}</>;
    }
    return <ComingSoon title={`${moduleName} is Coming Soon`} />;
  }

  return <>{children}</>;
};

export default FeatureFlagGuard;
