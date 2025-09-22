
export interface RecommendationFeedback {
  id: string;
  userId: string;
  recommendationId: string;
  recommendationType: 'job' | 'training' | 'scholarship' | 'internship';
  feedbackType: 'helpful' | 'not_helpful' | 'applied' | 'not_interested';
  rating?: number; // 1-5 scale
  comments?: string;
  createdAt: string;
}

export interface RecommendationInteraction {
  id: string;
  userId: string;
  recommendationId: string;
  interactionType: 'viewed' | 'clicked' | 'shared' | 'bookmarked';
  timestamp: string;
  metadata?: Record<string, any>;
}

// Mock storage for feedback and interactions
let feedbackData: RecommendationFeedback[] = [];
let interactionData: RecommendationInteraction[] = [];

export const submitRecommendationFeedback = async (
  feedback: Omit<RecommendationFeedback, 'id' | 'createdAt'>
): Promise<RecommendationFeedback> => {
  const newFeedback: RecommendationFeedback = {
    ...feedback,
    id: `feedback-${Date.now()}`,
    createdAt: new Date().toISOString()
  };
  
  feedbackData.push(newFeedback);
  console.log('Feedback submitted:', newFeedback);
  return newFeedback;
};

export const trackRecommendationInteraction = async (
  interaction: Omit<RecommendationInteraction, 'id' | 'timestamp'>
): Promise<void> => {
  const newInteraction: RecommendationInteraction = {
    ...interaction,
    id: `interaction-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  
  interactionData.push(newInteraction);
  console.log('Interaction tracked:', newInteraction);
};

export const getUserFeedbackStats = async (userId: string) => {
  const userFeedback = feedbackData.filter(f => f.userId === userId);
  const userInteractions = interactionData.filter(i => i.userId === userId);
  
  return {
    totalFeedback: userFeedback.length,
    helpfulCount: userFeedback.filter(f => f.feedbackType === 'helpful').length,
    appliedCount: userFeedback.filter(f => f.feedbackType === 'applied').length,
    averageRating: userFeedback.reduce((sum, f) => sum + (f.rating || 0), 0) / userFeedback.length || 0,
    totalInteractions: userInteractions.length
  };
};

export const getRecommendationPerformance = async (recommendationId: string) => {
  const feedback = feedbackData.filter(f => f.recommendationId === recommendationId);
  const interactions = interactionData.filter(i => i.recommendationId === recommendationId);
  
  return {
    viewCount: interactions.filter(i => i.interactionType === 'viewed').length,
    clickCount: interactions.filter(i => i.interactionType === 'clicked').length,
    feedbackCount: feedback.length,
    helpfulPercentage: feedback.length > 0 ? 
      (feedback.filter(f => f.feedbackType === 'helpful').length / feedback.length) * 100 : 0
  };
};
