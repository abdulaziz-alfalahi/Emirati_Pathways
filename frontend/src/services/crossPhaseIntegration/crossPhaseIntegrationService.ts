import { supabase } from '@/integrations/supabase/client';
// Simplified service using basic types to avoid complex type conflicts
type JourneyPhase = 'education' | 'career' | 'professional' | 'lifelong';
type RecommendationType = 'skill_development' | 'career_opportunity' | 'education' | 'mentorship';

interface BasicProfile {
  id: string;
  user_id: string;
  current_phase: string;
  profile_data: any;
  skills_portfolio: any;
  achievements: any;
  interests_and_goals: any;
  progress_metrics: any;
  created_at: string;
  updated_at: string;
}

interface BasicTransition {
  id: string;
  user_id: string;
  from_phase: string;
  to_phase: string;
  transition_data: any;
  transition_date?: string;
  readiness_score?: number;
  created_at: string;
}

interface BasicRecommendation {
  id: string;
  user_id: string;
  recommendation_type: string;
  recommendation_data: any;
  priority_score: number;
  status: string;
  created_at: string;
  updated_at: string;
}

interface BasicAnalytics {
  overallProgress: Record<string, number>;
  skillsDevelopment: any;
  careerProgression: any;
  engagementMetrics: any;
  recommendations: any;
  achievements: any;
  networkGrowth: any;
  goalTracking: any;
  assessmentResults: any;
}

class CrossPhaseIntegrationService {
  // Core Profile Management
  async getUserProfile(userId: string): Promise<BasicProfile | null> {
    try {
      const { data, error } = await supabase
        .from('citizen_journey_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  async createOrUpdateProfile(
    userId: string, 
    profileData: Partial<BasicProfile>
  ): Promise<BasicProfile | null> {
    try {
      // First, try to get existing profile
      const existingProfile = await this.getUserProfile(userId);
      
      if (existingProfile) {
        // Update existing profile
        const updatedData = {
          ...existingProfile,
          ...profileData,
          profile_data: {
            ...existingProfile.profile_data,
            ...profileData.profile_data
          },
          skills_portfolio: {
            ...existingProfile.skills_portfolio,
            ...profileData.skills_portfolio
          },
          achievements: {
            ...existingProfile.achievements,
            ...profileData.achievements
          },
          interests_and_goals: {
            ...existingProfile.interests_and_goals,
            ...profileData.interests_and_goals
          }
        };

        const { data, error } = await supabase
          .from('citizen_journey_profiles')
          .update(updatedData)
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new profile with defaults
        const newProfile = {
          user_id: userId,
          current_phase: profileData.current_phase || 'education' as JourneyPhase,
          profile_data: profileData.profile_data || {},
          skills_portfolio: this.getDefaultSkillsPortfolio(),
          achievements: profileData.achievements || {},
          interests_and_goals: this.getDefaultInterestsAndGoals(),
          progress_metrics: profileData.progress_metrics || {}
        };

        const { data, error } = await supabase
          .from('citizen_journey_profiles')
          .insert(newProfile)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('Error creating/updating profile:', error);
      return null;
    }
  }

  async updateUserPhase(userId: string, newPhase: JourneyPhase): Promise<void> {
    try {
      const { error } = await supabase
        .from('citizen_journey_profiles')
        .update({ 
          current_phase: newPhase,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating user phase:', error);
      throw error;
    }
  }

  // Phase Transition Management
  async recordPhaseTransition(
    userId: string, 
    fromPhase: JourneyPhase, 
    toPhase: JourneyPhase,
    transitionData: any = {}
  ): Promise<void> {
    try {
      const transition = {
        user_id: userId,
        from_phase: fromPhase,
        to_phase: toPhase,
        transition_data: transitionData,
        readiness_score: this.calculateTransitionReadiness(userId, toPhase)
      };

      const { error } = await supabase
        .from('phase_transitions')
        .insert(transition);

      if (error) throw error;

      // Update user's current phase
      await this.updateUserPhase(userId, toPhase);
    } catch (error) {
      console.error('Error recording phase transition:', error);
      throw error;
    }
  }

  async getUserTransitions(userId: string): Promise<BasicTransition[]> {
    try {
      const { data, error } = await supabase
        .from('phase_transitions')
        .select('*')
        .eq('user_id', userId)
        .order('transition_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user transitions:', error);
      return [];
    }
  }

  // Recommendation System
  async generateRecommendations(userId: string): Promise<BasicRecommendation[]> {
    try {
      const profile = await this.getUserProfile(userId);
      if (!profile) return [];

      const recommendations: BasicRecommendation[] = [];

      // Generate basic recommendations (simplified for now)
      const basicRec: BasicRecommendation = {
        id: 'rec_' + Date.now(),
        user_id: userId,
        recommendation_type: 'skill_development' as RecommendationType,
        recommendation_data: {
          title: 'Skill Development Opportunity',
          description: 'Continue developing your skills in your current phase',
          action_items: ['Complete assessments', 'Join communities', 'Seek mentorship']
        },
        priority_score: 75,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      recommendations.push(basicRec);
      return recommendations;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      return [];
    }
  }

  async getOpportunityRecommendations(
    userId: string, 
    phase: JourneyPhase
  ): Promise<any[]> {
    try {
      // Simplified opportunity recommendations
      return [
        {
          id: `opp_${phase}_${Date.now()}`,
          phase: phase,
          title: `${phase} opportunities`,
          description: `Explore opportunities in the ${phase} phase`,
          relevance_score: 80
        }
      ];
    } catch (error) {
      console.error('Error getting opportunity recommendations:', error);
      return [];
    }
  }

  // Analytics and Progress Tracking
  async getCrossPhaseAnalytics(userId: string): Promise<BasicAnalytics> {
    try {
      const profile = await this.getUserProfile(userId);
      const transitions = await this.getUserTransitions(userId);

      if (!profile) {
        throw new Error('User profile not found');
      }

      const analytics: BasicAnalytics = {
        overallProgress: {
          education: 75,
          career: 50,
          professional: 25,
          lifelong: 10
        },
        skillsDevelopment: {
          currentLevel: 65,
          improvementAreas: ['Technical Skills', 'Leadership'],
          strengths: ['Communication', 'Problem Solving']
        },
        careerProgression: {
          currentPhase: profile.current_phase,
          timeInCurrentPhase: this.calculateTimeInPhase(profile),
          nextMilestones: ['Complete Assessment', 'Join Program']
        },
        engagementMetrics: {
          activitiesCompleted: 15,
          certificationsEarned: 3,
          communityParticipation: 8,
          mentorshipConnections: 2
        },
        recommendations: {
          totalGenerated: 12,
          implementedCount: 7,
          pendingActions: this.getPendingRecommendations(userId)
        },
        achievements: {
          totalPoints: 850,
          badges: ['Early Adopter', 'Community Builder'],
          milestones: ['Phase Transition', 'Skill Mastery'],
          recognitions: ['Outstanding Participant']
        },
        networkGrowth: {
          connections: 45,
          mentors: 3,
          mentees: 2,
          collaborations: 8
        },
        goalTracking: {
          activeGoals: 5,
          completedGoals: 12,
          achievementRate: 78
        },
        assessmentResults: {
          latest: { score: 85, date: new Date().toISOString() },
          trend: 'improving',
          improvementAreas: ['Technical Skills']
        }
      };

      return analytics;
    } catch (error) {
      console.error('Error getting cross-phase analytics:', error);
      throw error;
    }
  }

  async getJourneyVisualization(userId: string): Promise<any> {
    try {
      const profile = await this.getUserProfile(userId);
      const transitions = await this.getUserTransitions(userId);

      if (!profile) return null;

      // Build journey visualization data
      const visualization = {
        currentPhase: profile.current_phase,
        phases: {
          education: {
            status: this.getPhaseStatus('education', transitions),
            progress: 75,
            achievements: ['Basic Certificate', 'Skills Assessment'],
            duration: 180
          },
          career: {
            status: this.getPhaseStatus('career', transitions),
            progress: 50,
            achievements: ['First Job', 'Interview Skills'],
            duration: 90
          },
          professional: {
            status: this.getPhaseStatus('professional', transitions),
            progress: 25,
            achievements: ['Professional Certification'],
            duration: 30
          },
          lifelong: {
            status: this.getPhaseStatus('lifelong', transitions),
            progress: 10,
            achievements: [],
            duration: 0
          }
        },
        transitions: transitions.map(t => ({
          from: t.from_phase,
          to: t.to_phase,
          date: t.transition_date,
          readiness: t.readiness_score
        })),
        futureOpportunities: ['Advanced Training', 'Leadership Program', 'Mentorship'],
        insights: ['Strong technical foundation', 'Ready for career transition', 'Consider leadership development']
      };

      return visualization;
    } catch (error) {
      console.error('Error getting journey visualization:', error);
      return null;
    }
  }

  // Helper Methods
  private calculateTransitionReadiness(userId: string, targetPhase: JourneyPhase): number {
    // Simplified readiness calculation
    return Math.random() * 100;
  }

  private calculateTimeInPhase(profile: BasicProfile): number {
    const now = new Date();
    const updatedAt = new Date(profile.updated_at);
    return Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
  }

  private getPhaseStatus(phase: JourneyPhase, transitions: BasicTransition[]): string {
    const phaseTransition = transitions.find(t => t.to_phase === phase);
    if (phaseTransition) return 'completed';
    return 'pending';
  }

  // Default data methods
  private getDefaultSkillsPortfolio(): any {
    return {
      technical: [],
      soft: [],
      languages: [],
      certifications: []
    };
  }

  private getDefaultInterestsAndGoals(): any {
    return {
      interests: [],
      short_term_goals: [],
      long_term_goals: [],
      career_aspirations: []
    };
  }

  private getPendingRecommendations(userId: string): any[] {
    return [
      { title: 'Complete Skills Assessment', priority: 'high' },
      { title: 'Join Professional Community', priority: 'medium' }
    ];
  }

  async getUserAchievements(userId: string): Promise<any[]> {
    return [
      { name: 'Early Adopter', category: 'engagement', date: new Date().toISOString() },
      { name: 'Skill Builder', category: 'development', date: new Date().toISOString() }
    ];
  }
}

export default new CrossPhaseIntegrationService();
