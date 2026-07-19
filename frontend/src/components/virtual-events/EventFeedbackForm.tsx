
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Star, Send, CheckCircle } from 'lucide-react';
import { PostEventFollowUpService } from '@/services/postEventFollowUpService';
import { toast } from '@/components/ui/use-toast';

interface EventFeedbackFormProps {
  eventId: string;
  eventTitle: string;
  onSubmitted?: () => void;
}

const EventFeedbackForm: React.FC<EventFeedbackFormProps> = ({ 
  eventId, 
  eventTitle, 
  onSubmitted 
}) => {
  const [ratings, setRatings] = useState({
    overall: 0,
    content: 0,
    speakers: 0,
    networking: 0,
    platform: 0
  });
  const [recommendations, setRecommendations] = useState('');
  const [improvements, setImprovements] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState(false);
  const [futureInterests, setFutureInterests] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const interestOptions = [
    'Career Development',
    'Technology Trends',
    'Networking Events',
    'Industry Insights',
    'Skill Building',
    'Leadership Training',
    'Entrepreneurship',
    'Digital Transformation',
    'Innovation',
    'Professional Growth'
  ];

  const handleRatingChange = (category: string, rating: number) => {
    setRatings(prev => ({
      ...prev,
      [category]: rating
    }));
  };

  const handleInterestToggle = (interest: string) => {
    setFutureInterests(prev => 
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  const handleWouldRecommendChange = (checked: boolean | 'indeterminate') => {
    setWouldRecommend(checked === true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (Object.values(ratings).some(r => r === 0)) {
      toast({
        title: "Incomplete Form",
        description: "Please provide ratings for all categories",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      await PostEventFollowUpService.submitEventFeedback(eventId, {
        overall_rating: ratings.overall,
        content_rating: ratings.content,
        speakers_rating: ratings.speakers,
        networking_rating: ratings.networking,
        platform_rating: ratings.platform,
        recommendations,
        improvements,
        would_recommend: wouldRecommend,
        future_interests: futureInterests
      });

      setIsSubmitted(true);
      toast({
        title: "Thank You!",
        description: "Your feedback has been submitted successfully",
      });

      if (onSubmitted) {
        onSubmitted();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit feedback",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const RatingStars = ({ category, rating, onChange }: { 
    category: string; 
    rating: number; 
    onChange: (rating: number) => void;
  }) => (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`p-1 transition-colors ${
            star <= rating ? 'text-yellow-400' : 'text-gray-300'
          } hover:text-yellow-400`}
        >
          <Star className="h-5 w-5 fill-current" />
        </button>
      ))}
      <span className="ms-2 text-sm text-muted-foreground">
        {rating > 0 ? `${rating}/5` : 'Not rated'}
      </span>
    </div>
  );

  if (isSubmitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Thank You for Your Feedback!</h3>
          <p className="text-muted-foreground">
            Your input helps us improve future events and provides valuable insights to organizers.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Event Feedback</CardTitle>
        <CardDescription>
          Share your experience with "{eventTitle}" to help us improve future events
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Rating Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Rate Your Experience</h3>
            
            {Object.entries({
              overall: 'Overall Event Experience',
              content: 'Content Quality',
              speakers: 'Speakers & Presentations',
              networking: 'Networking Opportunities',
              platform: 'Platform & Technology'
            }).map(([key, label]) => (
              <div key={key} className="space-y-2">
                <Label>{label}</Label>
                <RatingStars
                  category={key}
                  rating={ratings[key as keyof typeof ratings]}
                  onChange={(rating) => handleRatingChange(key, rating)}
                />
              </div>
            ))}
          </div>

          {/* Recommendation Section */}
          <div className="space-y-2">
            <Label htmlFor="recommendations">What did you like most?</Label>
            <Textarea
              id="recommendations"
              placeholder="Share what you found most valuable about this event..."
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={3}
            />
          </div>

          {/* Improvements Section */}
          <div className="space-y-2">
            <Label htmlFor="improvements">How can we improve?</Label>
            <Textarea
              id="improvements"
              placeholder="Share suggestions for making future events even better..."
              value={improvements}
              onChange={(e) => setImprovements(e.target.value)}
              rows={3}
            />
          </div>

          {/* Would Recommend */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="recommend"
              checked={wouldRecommend}
              onCheckedChange={handleWouldRecommendChange}
            />
            <Label htmlFor="recommend">
              I would recommend this event to colleagues
            </Label>
          </div>

          {/* Future Interests */}
          <div className="space-y-3">
            <Label>What topics would you like to see in future events?</Label>
            <div className="flex flex-wrap gap-2">
              {interestOptions.map((interest) => (
                <Badge
                  key={interest}
                  variant={futureInterests.includes(interest) ? "default" : "outline"}
                  className="cursor-pointer"
                  onClick={() => handleInterestToggle(interest)}
                >
                  {interest}
                </Badge>
              ))}
            </div>
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="h-4 w-4 me-2" />
                Submit Feedback
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default EventFeedbackForm;
