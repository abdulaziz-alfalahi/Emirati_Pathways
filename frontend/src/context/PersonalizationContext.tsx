
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { usePhase } from './PhaseContext';
import { 
  aiPersonalizationEngine, 
  PersonalizationProfile, 
  PersonalizedRecommendation,
  InterfaceAdaptation 
} from '@/services/aiPersonalizationEngine';

interface PersonalizationContextType {
  profile: PersonalizationProfile | null;
  recommendations: PersonalizedRecommendation[];
  interfaceAdaptation: InterfaceAdaptation | null;
  isLoading: boolean;
  updateProfile: (updates: Partial<PersonalizationProfile['preferences']>) => Promise<void>;
  refreshRecommendations: () => Promise<void>;
  trackInteraction: (interactionData: any) => Promise<void>;
  applyInterfaceAdaptation: () => Promise<void>;
}

const PersonalizationContext = createContext<PersonalizationContextType | undefined>(undefined);

export const PersonalizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { currentPhase } = usePhase();
  const [profile, setProfile] = useState<PersonalizationProfile | null>(null);
  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>([]);
  const [interfaceAdaptation, setInterfaceAdaptation] = useState<InterfaceAdaptation | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      initializePersonalization();
    }
  }, [user]);

  useEffect(() => {
    if (user && currentPhase) {
      refreshRecommendations();
      applyInterfaceAdaptation();
    }
  }, [user, currentPhase]);

  const initializePersonalization = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const userProfile = await aiPersonalizationEngine.initializeUserProfile(user.id);
      setProfile(userProfile);
      
      // Train the personalization model
      await aiPersonalizationEngine.trainPersonalizationModel(user.id);
    } catch (error) {
      console.error('Error initializing personalization:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (updates: Partial<PersonalizationProfile['preferences']>) => {
    if (!user || !profile) return;

    try {
      const updatedProfile = {
        ...profile,
        preferences: { ...profile.preferences, ...updates },
        lastUpdated: new Date().toISOString()
      };
      
      setProfile(updatedProfile);
      await aiPersonalizationEngine.initializeUserProfile(user.id);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const refreshRecommendations = async () => {
    if (!user || !currentPhase) return;

    try {
      const newRecommendations = await aiPersonalizationEngine.generatePersonalizedRecommendations(
        user.id, 
        currentPhase
      );
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error refreshing recommendations:', error);
    }
  };

  const trackInteraction = async (interactionData: any) => {
    if (!user) return;

    try {
      await aiPersonalizationEngine.analyzeUserBehavior(user.id, {
        ...interactionData,
        phase: currentPhase,
        timestamp: new Date().toISOString()
      });
      
      // Refresh recommendations after significant interactions
      if (interactionData.significant) {
        await refreshRecommendations();
      }
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  };

  const applyInterfaceAdaptation = async () => {
    if (!user || !currentPhase) return;

    try {
      const adaptation = await aiPersonalizationEngine.adaptInterface(user.id, currentPhase);
      setInterfaceAdaptation(adaptation);
    } catch (error) {
      console.error('Error applying interface adaptation:', error);
    }
  };

  return (
    <PersonalizationContext.Provider
      value={{
        profile,
        recommendations,
        interfaceAdaptation,
        isLoading,
        updateProfile,
        refreshRecommendations,
        trackInteraction,
        applyInterfaceAdaptation
      }}
    >
      {children}
    </PersonalizationContext.Provider>
  );
};

export const usePersonalization = () => {
  const context = useContext(PersonalizationContext);
  if (context === undefined) {
    throw new Error('usePersonalization must be used within a PersonalizationProvider');
  }
  return context;
};
