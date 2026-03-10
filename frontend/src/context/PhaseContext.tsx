/**
 * Phase Context Provider
 * Manages current phase state and provides phase transition utilities
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Phase definitions
export type Phase = 'education' | 'career' | 'professional' | 'lifelong';

export interface PhaseInfo {
  id: Phase;
  name: string;
  description: string;
  color: string;
  icon: string;
  minAge?: number;
  maxAge?: number;
  eligibilityChecks: string[];
  transitionRequirements: string[];
  nextPhase?: Phase;
  prevPhase?: Phase;
}

export interface PhaseProgress {
  phase: Phase;
  completionPercentage: number;
  milestonesCompleted: number;
  totalMilestones: number;
  readinessScore: number;
  eligibleForTransition: boolean;
}

export interface CrossPhaseRecommendation {
  id: string;
  title: string;
  description: string;
  targetPhase: Phase;
  relevanceScore: number;
  category: 'tool' | 'resource' | 'opportunity' | 'guidance';
  actionUrl: string;
  estimatedTime?: string;
}

interface PhaseContextType {
  currentPhase: Phase | null;
  phaseProgress: PhaseProgress[];
  recommendations: CrossPhaseRecommendation[];
  phaseInfo: Record<Phase, PhaseInfo>;

  // Navigation functions
  detectPhaseFromPath: (path: string) => Phase | null;
  updateCurrentPhase: (phase: Phase) => void;
  getPhaseProgress: (phase: Phase) => PhaseProgress | null;
  getRecommendationsForCurrentContext: () => CrossPhaseRecommendation[];

  // Transition functions
  canTransitionToPhase: (targetPhase: Phase) => boolean;
  getTransitionGuidance: (targetPhase: Phase) => string[];
  triggerPhaseTransition: (targetPhase: Phase) => void;

  // Search and discovery
  searchAcrossPhases: (query: string, filters?: { phases?: Phase[]; categories?: string[] }) => any[];
}

const PhaseContext = createContext<PhaseContextType | undefined>(undefined);

// Phase configuration
const PHASE_INFO: Record<Phase, PhaseInfo> = {
  education: {
    id: 'education',
    name: 'Education Pathway',
    description: 'Foundational learning and academic development',
    color: '#006E6D',
    icon: 'GraduationCap',
    maxAge: 25,
    eligibilityChecks: ['age', 'education_status'],
    transitionRequirements: ['completed_education', 'career_readiness'],
    nextPhase: 'career'
  },
  career: {
    id: 'career',
    name: 'Career Entry',
    description: 'Professional development and career establishment',
    color: '#0079C1',
    icon: 'Briefcase',
    minAge: 18,
    maxAge: 35,
    eligibilityChecks: ['education_completed', 'job_readiness'],
    transitionRequirements: ['stable_employment', 'professional_network'],
    prevPhase: 'education',
    nextPhase: 'professional'
  },
  professional: {
    id: 'professional',
    name: 'Professional Growth',
    description: 'Advanced career development and skill enhancement',
    color: '#7B1FA2',
    icon: 'TrendingUp',
    minAge: 25,
    eligibilityChecks: ['work_experience', 'career_goals'],
    transitionRequirements: ['leadership_experience', 'community_contribution'],
    prevPhase: 'career',
    nextPhase: 'lifelong'
  },
  lifelong: {
    id: 'lifelong',
    name: 'Lifelong Engagement',
    description: 'Community leadership and knowledge sharing',
    color: '#D32F2F',
    icon: 'Users',
    minAge: 35,
    eligibilityChecks: ['professional_experience', 'community_readiness'],
    transitionRequirements: [],
    prevPhase: 'professional'
  }
};

// Route to phase mapping
const ROUTE_PHASE_MAP: Record<string, Phase> = {
  '/knowledge-camps': 'education',
  '/school-programs': 'education',
  '/scholarships': 'education',
  '/university-programs': 'education',
  '/lms': 'education',

  '/career-planning-hub': 'career',
  '/graduate-programs': 'career',
  '/internships': 'career',
  '/job-matching': 'career',
  '/career-advisory': 'career',
  '/cv-builder': 'career',
  '/portfolio': 'career',
  '/interview-preparation': 'career',

  '/digital-skills-development': 'professional',
  '/professional-certifications': 'professional',
  '/training': 'professional',
  '/assessments': 'professional',
  '/mentorship': 'professional',
  '/communities': 'professional',

  '/national-service': 'lifelong',
  '/youth-development': 'lifelong',
  '/share-success-stories': 'lifelong',
  '/blockchain-credentials': 'lifelong',
  '/analytics': 'lifelong',
  '/financial-planning': 'lifelong',
  '/thought-leadership': 'lifelong',
  '/retiree': 'lifelong'
};

export const PhaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [currentPhase, setCurrentPhase] = useState<Phase | null>(null);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress[]>([]);
  const [recommendations, setRecommendations] = useState<CrossPhaseRecommendation[]>([]);

  // Detect phase from current path
  const detectPhaseFromPath = (path: string): Phase | null => {
    for (const [route, phase] of Object.entries(ROUTE_PHASE_MAP)) {
      if (path.startsWith(route)) {
        return phase;
      }
    }
    return null;
  };

  // Update current phase based on location
  useEffect(() => {
    const detectedPhase = detectPhaseFromPath(location.pathname);
    if (detectedPhase) {
      setCurrentPhase(detectedPhase);
    }
  }, [location.pathname]);

  // Mock phase progress data
  useEffect(() => {
    if (user) {
      // In real implementation, fetch from API/database
      setPhaseProgress([
        {
          phase: 'education',
          completionPercentage: 85,
          milestonesCompleted: 17,
          totalMilestones: 20,
          readinessScore: 78,
          eligibleForTransition: true
        },
        {
          phase: 'career',
          completionPercentage: 45,
          milestonesCompleted: 9,
          totalMilestones: 20,
          readinessScore: 65,
          eligibleForTransition: false
        },
        {
          phase: 'professional',
          completionPercentage: 12,
          milestonesCompleted: 2,
          totalMilestones: 15,
          readinessScore: 35,
          eligibleForTransition: false
        },
        {
          phase: 'lifelong',
          completionPercentage: 0,
          milestonesCompleted: 0,
          totalMilestones: 12,
          readinessScore: 0,
          eligibleForTransition: false
        }
      ]);
    }
  }, [user]);

  // Generate contextual recommendations
  useEffect(() => {
    if (currentPhase && user) {
      const contextualRecommendations = generateRecommendations(currentPhase, phaseProgress);
      setRecommendations(contextualRecommendations);
    }
  }, [currentPhase, phaseProgress, user]);

  const generateRecommendations = (phase: Phase, progress: PhaseProgress[]): CrossPhaseRecommendation[] => {
    const currentProgress = progress.find(p => p.phase === phase);
    if (!currentProgress) return [];

    const recommendations: CrossPhaseRecommendation[] = [];

    // Career phase recommendations
    if (phase === 'education' && currentProgress.readinessScore > 70) {
      recommendations.push({
        id: 'career-prep',
        title: 'Start Career Preparation',
        description: 'Explore career planning tools to prepare for your transition',
        targetPhase: 'career',
        relevanceScore: 90,
        category: 'guidance',
        actionUrl: '/career-planning-hub',
        estimatedTime: '30 minutes'
      });
    }

    // Professional development recommendations
    if (phase === 'career' && currentProgress.completionPercentage > 60) {
      recommendations.push({
        id: 'skill-development',
        title: 'Enhance Your Skills',
        description: 'Explore professional certifications to advance your career',
        targetPhase: 'professional',
        relevanceScore: 85,
        category: 'opportunity',
        actionUrl: '/professional-certifications'
      });
    }

    // Cross-phase tools
    recommendations.push({
      id: 'portfolio-tool',
      title: 'Build Your Portfolio',
      description: 'Showcase your achievements across all phases',
      targetPhase: 'career',
      relevanceScore: 75,
      category: 'tool',
      actionUrl: '/portfolio'
    });

    return recommendations.sort((a, b) => b.relevanceScore - a.relevanceScore);
  };

  const updateCurrentPhase = (phase: Phase) => {
    setCurrentPhase(phase);
  };

  const getPhaseProgress = (phase: Phase): PhaseProgress | null => {
    return phaseProgress.find(p => p.phase === phase) || null;
  };

  const getRecommendationsForCurrentContext = (): CrossPhaseRecommendation[] => {
    return recommendations.slice(0, 5); // Top 5 recommendations
  };

  const canTransitionToPhase = (targetPhase: Phase): boolean => {
    const currentProgress = currentPhase ? getPhaseProgress(currentPhase) : null;
    const targetProgress = getPhaseProgress(targetPhase);

    if (!currentProgress) return true; // Allow exploration if no current phase

    // Check if user meets minimum requirements for target phase
    const targetInfo = PHASE_INFO[targetPhase];
    const currentInfo = PHASE_INFO[currentPhase!];

    // Sequential progression check
    if (currentInfo.nextPhase === targetPhase && currentProgress.eligibleForTransition) {
      return true;
    }

    // Allow backward navigation
    if (currentInfo.prevPhase === targetPhase) {
      return true;
    }

    // Allow exploration with lower readiness score
    return currentProgress.readinessScore > 50;
  };

  const getTransitionGuidance = (targetPhase: Phase): string[] => {
    const targetInfo = PHASE_INFO[targetPhase];
    const currentProgress = currentPhase ? getPhaseProgress(currentPhase) : null;

    const guidance: string[] = [];

    if (!canTransitionToPhase(targetPhase)) {
      guidance.push('Complete more milestones in your current phase before transitioning');
    }

    guidance.push(...targetInfo.transitionRequirements.map(req =>
      `Ensure you have: ${req.replace(/_/g, ' ')}`
    ));

    return guidance;
  };

  const triggerPhaseTransition = (targetPhase: Phase) => {
    // In real implementation, this would update user profile and trigger onboarding
    console.log(`Transitioning to ${targetPhase} phase`);
    setCurrentPhase(targetPhase);
  };

  const searchAcrossPhases = (query: string, filters?: { phases?: Phase[]; categories?: string[] }) => {
    // Mock search implementation
    // In real implementation, this would query a comprehensive search index
    const allPages = [
      // Education pages
      { title: 'Knowledge Camps', phase: 'education', category: 'program', url: '/knowledge-camps' },
      { title: 'Scholarships', phase: 'education', category: 'funding', url: '/scholarships' },

      // Career pages
      { title: 'Job Matching', phase: 'career', category: 'tool', url: '/job-matching' },
      { title: 'CV Builder', phase: 'career', category: 'tool', url: '/cv-builder' },

      // Professional pages
      { title: 'Professional Certifications', phase: 'professional', category: 'certification', url: '/professional-certifications' },
      { title: 'Mentorship', phase: 'professional', category: 'networking', url: '/mentorship' },

      // Lifelong pages
      { title: 'Success Stories', phase: 'lifelong', category: 'inspiration', url: '/share-success-stories' },
      { title: 'Financial Planning', phase: 'lifelong', category: 'planning', url: '/financial-planning' }
    ];

    return allPages.filter(page => {
      const matchesQuery = page.title.toLowerCase().includes(query.toLowerCase());
      const matchesPhase = !filters?.phases || filters.phases.includes(page.phase as Phase);
      const matchesCategory = !filters?.categories || filters.categories.includes(page.category);

      return matchesQuery && matchesPhase && matchesCategory;
    });
  };

  const value: PhaseContextType = {
    currentPhase,
    phaseProgress,
    recommendations,
    phaseInfo: PHASE_INFO,

    detectPhaseFromPath,
    updateCurrentPhase,
    getPhaseProgress,
    getRecommendationsForCurrentContext,

    canTransitionToPhase,
    getTransitionGuidance,
    triggerPhaseTransition,

    searchAcrossPhases
  };

  return (
    <PhaseContext.Provider value={value}>
      {children}
    </PhaseContext.Provider>
  );
};

export const usePhase = (): PhaseContextType => {
  const context = useContext(PhaseContext);
  if (!context) {
    throw new Error('usePhase must be used within a PhaseProvider');
  }
  return context;
};
