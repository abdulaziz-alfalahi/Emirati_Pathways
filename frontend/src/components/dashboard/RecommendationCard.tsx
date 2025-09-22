
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Briefcase, 
  GraduationCap, 
  Award, 
  Users, 
  TrendingUp, 
  ThumbsUp, 
  ThumbsDown,
  ExternalLink 
} from 'lucide-react';
import { recommendationEngine } from '@/services/recommendationEngine';

interface Recommendation {
  id: string;
  title: string;
  type: 'job' | 'course' | 'scholarship';
  provider?: string;
  score: number;
  description?: string;
  url?: string;
  location?: string;
  deadline?: string;
}

interface RecommendationCardProps {
  recommendation: Recommendation;
  userId: string;
  onFeedbackSubmitted: () => void;
}

const RecommendationCard: React.FC<RecommendationCardProps> = ({
  recommendation,
  userId,
  onFeedbackSubmitted
}) => {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'job': return <Briefcase className="h-4 w-4" />;
      case 'course': return <GraduationCap className="h-4 w-4" />;
      case 'scholarship': return <Award className="h-4 w-4" />;
      default: return <Briefcase className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'job': return 'bg-blue-100 text-blue-800';
      case 'course': return 'bg-green-100 text-green-800';
      case 'scholarship': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleFeedback = async (isPositive: boolean) => {
    try {
      await recommendationEngine.trackRecommendationInteraction(
        recommendation.id,
        isPositive ? 'positive_feedback' : 'negative_feedback'
      );
      setFeedbackGiven(true);
      onFeedbackSubmitted();
    } catch (error) {
      console.error('Error submitting feedback:', error);
    }
  };

  const handleView = async () => {
    try {
      await recommendationEngine.trackRecommendationInteraction(
        recommendation.id,
        'view'
      );
      // Open URL if available
      if (recommendation.url) {
        window.open(recommendation.url, '_blank');
      }
    } catch (error) {
      console.error('Error tracking view:', error);
    }
  };

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getTypeIcon(recommendation.type)}
            <Badge className={getTypeColor(recommendation.type)} variant="secondary">
              {recommendation.type}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-3 w-3 text-muted-foreground" />
            <span className="text-sm font-medium">{recommendation.score}%</span>
          </div>
        </div>
        <CardTitle className="text-lg line-clamp-2">{recommendation.title}</CardTitle>
        {recommendation.provider && (
          <CardDescription>{recommendation.provider}</CardDescription>
        )}
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1">
          {recommendation.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-3">
              {recommendation.description}
            </p>
          )}
          
          <div className="space-y-1">
            {recommendation.location && (
              <p className="text-xs text-muted-foreground">📍 {recommendation.location}</p>
            )}
            {recommendation.deadline && (
              <p className="text-xs text-muted-foreground">⏰ Deadline: {recommendation.deadline}</p>
            )}
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Button 
            onClick={handleView} 
            className="w-full"
            size="sm"
          >
            View Details
            <ExternalLink className="h-3 w-3 ml-1" />
          </Button>
          
          {!feedbackGiven && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(true)}
                className="flex-1"
              >
                <ThumbsUp className="h-3 w-3 mr-1" />
                Helpful
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleFeedback(false)}
                className="flex-1"
              >
                <ThumbsDown className="h-3 w-3 mr-1" />
                Not Relevant
              </Button>
            </div>
          )}
          
          {feedbackGiven && (
            <p className="text-xs text-center text-muted-foreground">
              Thank you for your feedback!
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecommendationCard;
