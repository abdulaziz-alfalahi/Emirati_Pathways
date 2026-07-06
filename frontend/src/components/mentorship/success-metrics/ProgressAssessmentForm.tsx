
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Star, Award, TrendingUp, MessageSquare, Target } from 'lucide-react';
import { successMetricsService } from '@/services/mentorship/successMetricsService';
import type { MentorshipProgressAssessment } from '@/types/mentorship';
import { useToast } from '@/hooks/use-toast';

interface ProgressAssessmentFormProps {
  relationshipId: string;
  isCurrentUserMentor: boolean;
  onAssessmentSubmitted: () => void;
}

export const ProgressAssessmentForm: React.FC<ProgressAssessmentFormProps> = ({
  relationshipId,
  isCurrentUserMentor,
  onAssessmentSubmitted
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [assessment, setAssessment] = useState({
    assessment_period: 'monthly' as 'monthly' | 'quarterly' | 'milestone',
    mentee_satisfaction: 3,
    mentor_satisfaction: 3,
    skill_development_rating: 3,
    communication_effectiveness: 3,
    goal_progress_rating: 3,
    areas_of_improvement: [] as string[],
    highlights: [] as string[],
    next_period_focus: [] as string[],
    assessment_notes: ''
  });
  
  const [newAreaInput, setNewAreaInput] = useState('');
  const [newHighlightInput, setNewHighlightInput] = useState('');
  const [newFocusInput, setNewFocusInput] = useState('');

  const handleSubmitAssessment = async () => {
    setLoading(true);
    try {
      // TODO: Connect to Flask API - const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('User not authenticated');

      const assessmentData: Omit<MentorshipProgressAssessment, 'id' | 'created_at'> = {
        relationship_id: relationshipId,
        assessment_period: assessment.assessment_period,
        mentee_satisfaction: assessment.mentee_satisfaction,
        mentor_satisfaction: isCurrentUserMentor ? assessment.mentor_satisfaction : undefined,
        skill_development_rating: assessment.skill_development_rating,
        communication_effectiveness: assessment.communication_effectiveness,
        goal_progress_rating: assessment.goal_progress_rating,
        areas_of_improvement: assessment.areas_of_improvement,
        highlights: assessment.highlights,
        next_period_focus: assessment.next_period_focus,
        assessment_notes: assessment.assessment_notes || undefined,
        assessed_by: user.user.id,
        assessment_date: new Date().toISOString()
      };

      await successMetricsService.createProgressAssessment(assessmentData);
      
      // Reset form
      setAssessment({
        assessment_period: 'monthly',
        mentee_satisfaction: 3,
        mentor_satisfaction: 3,
        skill_development_rating: 3,
        communication_effectiveness: 3,
        goal_progress_rating: 3,
        areas_of_improvement: [],
        highlights: [],
        next_period_focus: [],
        assessment_notes: ''
      });

      onAssessmentSubmitted();
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast({
        title: "Error",
        description: "Failed to submit assessment",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToList = (listKey: keyof typeof assessment, value: string, setter: (value: string) => void) => {
    if (value.trim()) {
      setAssessment(prev => ({
        ...prev,
        [listKey]: [...(prev[listKey] as string[]), value.trim()]
      }));
      setter('');
    }
  };

  const removeFromList = (listKey: keyof typeof assessment, index: number) => {
    setAssessment(prev => ({
      ...prev,
      [listKey]: (prev[listKey] as string[]).filter((_, i) => i !== index)
    }));
  };

  const getRatingLabel = (value: number) => {
    const labels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];
    return labels[value - 1];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Award className="h-5 w-5" />
          Progress Assessment
        </CardTitle>
        <CardDescription>
          Evaluate the progress and effectiveness of this mentorship relationship
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Assessment Period */}
        <div>
          <Label htmlFor="assessment-period">Assessment Period</Label>
          <Select 
            value={assessment.assessment_period} 
            onValueChange={(value: 'monthly' | 'quarterly' | 'milestone') => 
              setAssessment(prev => ({ ...prev, assessment_period: value }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monthly Review</SelectItem>
              <SelectItem value="quarterly">Quarterly Review</SelectItem>
              <SelectItem value="milestone">Milestone Assessment</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Rating Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Mentee Satisfaction */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {isCurrentUserMentor ? 'Mentee' : 'Your'} Satisfaction
            </Label>
            <div className="px-3">
              <Slider
                value={[assessment.mentee_satisfaction]}
                onValueChange={(value) => setAssessment(prev => ({ ...prev, mentee_satisfaction: value[0] }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium">{getRatingLabel(assessment.mentee_satisfaction)}</span>
                <span>5</span>
              </div>
            </div>
          </div>

          {/* Mentor Satisfaction (only for mentors) */}
          {isCurrentUserMentor && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Star className="h-4 w-4" />
                Your Satisfaction
              </Label>
              <div className="px-3">
                <Slider
                  value={[assessment.mentor_satisfaction]}
                  onValueChange={(value) => setAssessment(prev => ({ ...prev, mentor_satisfaction: value[0] }))}
                  max={5}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>1</span>
                  <span className="font-medium">{getRatingLabel(assessment.mentor_satisfaction)}</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          )}

          {/* Skill Development */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Skill Development
            </Label>
            <div className="px-3">
              <Slider
                value={[assessment.skill_development_rating]}
                onValueChange={(value) => setAssessment(prev => ({ ...prev, skill_development_rating: value[0] }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium">{getRatingLabel(assessment.skill_development_rating)}</span>
                <span>5</span>
              </div>
            </div>
          </div>

          {/* Communication Effectiveness */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Communication
            </Label>
            <div className="px-3">
              <Slider
                value={[assessment.communication_effectiveness]}
                onValueChange={(value) => setAssessment(prev => ({ ...prev, communication_effectiveness: value[0] }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium">{getRatingLabel(assessment.communication_effectiveness)}</span>
                <span>5</span>
              </div>
            </div>
          </div>

          {/* Goal Progress */}
          <div className="space-y-2 md:col-span-2">
            <Label className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Goal Progress
            </Label>
            <div className="px-3">
              <Slider
                value={[assessment.goal_progress_rating]}
                onValueChange={(value) => setAssessment(prev => ({ ...prev, goal_progress_rating: value[0] }))}
                max={5}
                min={1}
                step={1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>1</span>
                <span className="font-medium">{getRatingLabel(assessment.goal_progress_rating)}</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </div>

        {/* Areas of Improvement */}
        <div className="space-y-3">
          <Label>Areas for Improvement</Label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add area for improvement..."
              value={newAreaInput}
              onChange={(e) => setNewAreaInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToList('areas_of_improvement', newAreaInput, setNewAreaInput);
                }
              }}
              className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
            />
            <Button 
              type="button" 
              size="sm"
              onClick={() => addToList('areas_of_improvement', newAreaInput, setNewAreaInput)}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.areas_of_improvement.map((area, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="cursor-pointer"
                onClick={() => removeFromList('areas_of_improvement', index)}
              >
                {area} ×
              </Badge>
            ))}
          </div>
        </div>

        {/* Highlights */}
        <div className="space-y-3">
          <Label>Highlights & Achievements</Label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add highlight or achievement..."
              value={newHighlightInput}
              onChange={(e) => setNewHighlightInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToList('highlights', newHighlightInput, setNewHighlightInput);
                }
              }}
              className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
            />
            <Button 
              type="button" 
              size="sm"
              onClick={() => addToList('highlights', newHighlightInput, setNewHighlightInput)}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.highlights.map((highlight, index) => (
              <Badge 
                key={index} 
                variant="default" 
                className="cursor-pointer"
                onClick={() => removeFromList('highlights', index)}
              >
                {highlight} ×
              </Badge>
            ))}
          </div>
        </div>

        {/* Next Period Focus */}
        <div className="space-y-3">
          <Label>Next Period Focus Areas</Label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add focus area for next period..."
              value={newFocusInput}
              onChange={(e) => setNewFocusInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  addToList('next_period_focus', newFocusInput, setNewFocusInput);
                }
              }}
              className="flex-1 px-3 py-2 border border-input rounded-md text-sm"
            />
            <Button 
              type="button" 
              size="sm"
              onClick={() => addToList('next_period_focus', newFocusInput, setNewFocusInput)}
            >
              Add
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {assessment.next_period_focus.map((focus, index) => (
              <Badge 
                key={index} 
                variant="outline" 
                className="cursor-pointer"
                onClick={() => removeFromList('next_period_focus', index)}
              >
                {focus} ×
              </Badge>
            ))}
          </div>
        </div>

        {/* Assessment Notes */}
        <div>
          <Label htmlFor="assessment-notes">Additional Notes</Label>
          <Textarea
            id="assessment-notes"
            placeholder="Any additional comments or observations..."
            value={assessment.assessment_notes}
            onChange={(e) => setAssessment(prev => ({ ...prev, assessment_notes: e.target.value }))}
            rows={4}
          />
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <Button 
            onClick={handleSubmitAssessment} 
            disabled={loading}
            className="min-w-32"
          >
            {loading ? 'Submitting...' : 'Submit Assessment'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
