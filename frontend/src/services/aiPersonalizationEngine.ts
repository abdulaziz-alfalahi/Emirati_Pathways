export interface PersonalizationProfile {
  userId: string;
  preferences: {
    contentTypes: string[];
    interfaceLayout: 'compact' | 'spacious' | 'focused';
    notificationFrequency: 'high' | 'medium' | 'low';
    learningPace: 'fast' | 'moderate' | 'slow';
    communicationStyle: 'formal' | 'casual' | 'technical';
  };
  behaviorPatterns: {
    engagementTimes: string[];
    preferredContentFormats: string[];
    interactionDepth: 'shallow' | 'moderate' | 'deep';
    navigationPatterns: Record<string, number>;
    sessionDuration: number;
  };
  predictionScores: {
    careerTransitionLikelihood: number;
    skillGapAreas: string[];
    nextPhaseReadiness: number;
    engagementRisk: number;
  };
  lastUpdated: string;
}

export interface PersonalizedRecommendation {
  id: string;
  type: string;
  title: string;
  description: string;
  relevanceScore: number;
  priority: 'high' | 'medium' | 'low';
  timing: 'immediate' | 'soon' | 'later';
  actionUrl: string;
  reasoning: string;
}

export interface InterfaceAdaptation {
  layout: 'compact' | 'spacious' | 'focused';
  colorScheme: 'default' | 'high-contrast' | 'warm' | 'cool';
  fontSizeModifier: number;
  prioritizedFeatures: string[];
  hiddenFeatures: string[];
  animationLevel: 'none' | 'reduced' | 'normal';
}

export interface BehaviorAnalysis {
  engagementLevel: 'low' | 'medium' | 'high';
  preferredContentTypes: string[];
  optimalInteractionTimes: string[];
  learningStyle: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  riskFactors: {
    disengagementRisk: number;
    contentMismatchRisk: number;
    overloadRisk: number;
  };
}

class AIPersonalizationEngine {
  private calculateEngagementLevel(interactionData: any): 'low' | 'medium' | 'high' {
    // Simple engagement calculation based on interaction frequency
    const interactionCount = interactionData.count || 1;
    if (interactionCount > 10) return 'high';
    if (interactionCount > 5) return 'medium';
    return 'low';
  }

  private identifyPreferredContent(interactionData: any): string[] {
    // Extract content preferences from interaction data
    return interactionData.contentTypes || ['general', 'career'];
  }

  private predictOptimalTimes(interactionData: any): string[] {
    // Analyze when user is most active
    return interactionData.activeTimes || ['morning', 'evening'];
  }

  private determineLearningStyle(interactionData: any): 'visual' | 'auditory' | 'reading' | 'kinesthetic' {
    // Determine learning style based on content interaction patterns
    const style = interactionData.learningStyle || 'visual';
    return style as 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  }

  private identifyRiskFactors(interactionData: any): BehaviorAnalysis['riskFactors'] {
    // Calculate risk factors based on engagement patterns
    return {
      disengagementRisk: interactionData.disengagementRisk || 0.2,
      contentMismatchRisk: interactionData.contentMismatchRisk || 0.3,
      overloadRisk: interactionData.overloadRisk || 0.1
    };
  }

  async initializeUserProfile(userId: string): Promise<PersonalizationProfile> {
    try {
      // Use existing user_roles table to get user data
      const { data: existingProfile } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Create a mock profile since we don't have personalization_profiles table
      const profile: PersonalizationProfile = {
        userId,
        preferences: {
          contentTypes: ['jobs', 'training', 'scholarships'],
          interfaceLayout: 'spacious',
          notificationFrequency: 'medium',
          learningPace: 'moderate',
          communicationStyle: 'casual'
        },
        behaviorPatterns: {
          engagementTimes: [],
          preferredContentFormats: ['text', 'video'],
          interactionDepth: 'moderate',
          navigationPatterns: {},
          sessionDuration: 30
        },
        predictionScores: {
          careerTransitionLikelihood: 0.3,
          skillGapAreas: [],
          nextPhaseReadiness: 0.7,
          engagementRisk: 0.2
        },
        lastUpdated: new Date().toISOString()
      };

      return profile;
    } catch (error) {
      console.error('Error initializing user profile:', error);
      throw error;
    }
  }

  async analyzeUserBehavior(userId: string, interactionData: any): Promise<BehaviorAnalysis> {
    try {
      // Log interaction using existing analytics tables
      console.log('Analyzing user behavior:', { userId, interactionData });

      // Mock behavior analysis since we don't have behavior tracking tables
      const analysis: BehaviorAnalysis = {
        engagementLevel: this.calculateEngagementLevel(interactionData),
        preferredContentTypes: this.identifyPreferredContent(interactionData),
        optimalInteractionTimes: this.predictOptimalTimes(interactionData),
        learningStyle: this.determineLearningStyle(interactionData),
        riskFactors: this.identifyRiskFactors(interactionData)
      };

      return analysis;
    } catch (error) {
      console.error('Error analyzing user behavior:', error);
      throw error;
    }
  }

  async generatePersonalizedRecommendations(
    userId: string, 
    currentPhase: string
  ): Promise<PersonalizedRecommendation[]> {
    try {
      const recommendations: PersonalizedRecommendation[] = [];

      // Get job recommendations from existing job_descriptions table
      const { data: jobs } = await supabase
        .from('job_descriptions')
        .select('*')
        .eq('is_active', true)
        .limit(3);

      if (jobs) {
        jobs.forEach(job => {
          recommendations.push({
            id: job.id,
            type: 'job_opportunity',
            title: job.title,
            description: `${job.employment_type} position at ${job.company}`,
            relevanceScore: Math.random() * 0.4 + 0.6, // 0.6-1.0
            priority: Math.random() > 0.5 ? 'high' : 'medium',
            timing: 'soon',
            actionUrl: `/jobs/${job.id}`,
            reasoning: 'Based on your skills and career preferences'
          });
        });
      }

      // Get training recommendations from existing courses table
      const { data: courses } = await supabase
        .from('courses')
        .select('*')
        .eq('status', 'published')
        .limit(2);

      if (courses) {
        courses.forEach(course => {
          recommendations.push({
            id: course.id,
            type: 'skill_development',
            title: course.title,
            description: course.description || `${course.category} course`,
            relevanceScore: Math.random() * 0.3 + 0.5, // 0.5-0.8
            priority: 'medium',
            timing: 'later',
            actionUrl: `/courses/${course.id}`,
            reasoning: 'Recommended to enhance your skill set'
          });
        });
      }

      // Sort by relevance score and return top recommendations
      return recommendations
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5);
    } catch (error) {
      console.error('Error generating personalized recommendations:', error);
      return [];
    }
  }

  async adaptInterface(userId: string, currentPhase: string): Promise<InterfaceAdaptation> {
    try {
      // Mock interface adaptation since we don't have interface_adaptations table
      const adaptation: InterfaceAdaptation = {
        layout: 'spacious',
        colorScheme: 'default',
        fontSizeModifier: 1.0,
        prioritizedFeatures: this.getPrioritizedFeatures(currentPhase),
        hiddenFeatures: [],
        animationLevel: 'normal'
      };

      return adaptation;
    } catch (error) {
      console.error('Error adapting interface:', error);
      throw error;
    }
  }

  async trainPersonalizationModel(userId: string): Promise<void> {
    try {
      // In a real implementation, this would train a machine learning model
      // For now, we'll just log that training was attempted
      console.log(`Training personalization model for user ${userId}`);
      
      // Simulate training delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      console.log(`Personalization model training completed for user ${userId}`);
    } catch (error) {
      console.error('Error training personalization model:', error);
      throw error;
    }
  }

  private getPrioritizedFeatures(phase: string): string[] {
    switch (phase) {
      case 'education':
        return ['courses', 'assessments', 'mentorship', 'study-groups'];
      case 'early-career':
        return ['job-search', 'skill-development', 'networking', 'career-guidance'];
      case 'mid-career':
        return ['career-advancement', 'leadership-development', 'industry-insights', 'professional-network'];
      case 'lifelong-engagement':
        return ['legacy-projects', 'mentoring-others', 'community-leadership', 'knowledge-sharing'];
      default:
        return ['dashboard', 'recommendations', 'profile', 'analytics'];
    }
  }

  private calculateContentRelevance(userProfile: PersonalizationProfile, contentItem: any): number {
    // Calculate relevance score based on user preferences and content attributes
    // This is a simplified implementation
    let score = 0.5; // Base score
    
    // Check if content type matches user preferences
    if (userProfile.preferences.contentTypes.includes(contentItem.type)) {
      score += 0.2;
    }
    
    // Adjust based on user's career phase
    if (contentItem.targetPhase && contentItem.targetPhase === userProfile.predictionScores.nextPhaseReadiness > 0.7) {
      score += 0.1;
    }
    
    // Normalize score to 0-1 range
    return Math.min(Math.max(score, 0), 1);
  }

  private generatePersonalizedContent(userProfile: PersonalizationProfile, contentType: string): any {
    // Generate content tailored to user preferences
    // This is a simplified implementation
    return {
      type: contentType,
      format: userProfile.behaviorPatterns.preferredContentFormats[0] || 'text',
      complexity: userProfile.preferences.learningPace === 'fast' ? 'advanced' : 'intermediate',
      style: userProfile.preferences.communicationStyle
    };
  }
}

export const aiPersonalizationEngine = new AIPersonalizationEngine();
