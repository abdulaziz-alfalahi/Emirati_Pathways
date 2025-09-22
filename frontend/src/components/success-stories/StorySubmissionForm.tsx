
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Loader2, Send, User } from 'lucide-react';

interface StorySubmissionFormProps {
  onSubmissionComplete?: () => void;
}

const categories = [
  { id: 'entrepreneurship', label: 'Entrepreneurship' },
  { id: 'technology', label: 'Technology' },
  { id: 'engineering', label: 'Engineering' },
  { id: 'leadership', label: 'Leadership' },
  { id: 'education', label: 'Education' },
  { id: 'healthcare', label: 'Healthcare' },
  { id: 'arts_culture', label: 'Arts & Culture' },
  { id: 'sports', label: 'Sports' },
  { id: 'social_impact', label: 'Social Impact' },
  { id: 'women_empowerment', label: 'Women Empowerment' }
];

export const StorySubmissionForm: React.FC<StorySubmissionFormProps> = ({ onSubmissionComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    full_story: '',
    author_name: '',
    author_title: '',
    author_location: '',
    category: [] as string[]
  });

  const handleCategoryChange = (categoryId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      category: checked 
        ? [...prev.category, categoryId]
        : prev.category.filter(c => c !== categoryId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to submit your story.",
        variant: "destructive"
      });
      return;
    }

    if (formData.category.length === 0) {
      toast({
        title: "Category Required",
        description: "Please select at least one category for your story.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Use a more flexible approach for the insert operation
      const { error } = await supabase
        .from('success_stories' as any)
        .insert({
          title: formData.title,
          summary: formData.summary,
          full_story: formData.full_story,
          author_name: formData.author_name,
          author_title: formData.author_title || null,
          author_location: formData.author_location || null,
          category: formData.category,
          author_id: user.id,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Story Submitted Successfully!",
        description: "Your story has been submitted for review. We'll notify you once it's approved.",
      });

      // Reset form
      setFormData({
        title: '',
        summary: '',
        full_story: '',
        author_name: '',
        author_title: '',
        author_location: '',
        category: []
      });

      onSubmissionComplete?.();
    } catch (error) {
      console.error('Error submitting story:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your story. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sign In Required
          </CardTitle>
          <CardDescription>
            Please sign in to share your success story with the community.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => window.location.href = '/auth'}>
            Sign In to Share Your Story
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Send className="h-5 w-5" />
          Share Your Success Story
        </CardTitle>
        <CardDescription>
          Inspire others by sharing your journey, achievements, and the lessons you've learned along the way.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Story Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="e.g., From Graduate to Tech Entrepreneur"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author_name">Your Name *</Label>
              <Input
                id="author_name"
                value={formData.author_name}
                onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                placeholder="Your full name"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author_title">Your Title/Position</Label>
              <Input
                id="author_title"
                value={formData.author_title}
                onChange={(e) => setFormData(prev => ({ ...prev, author_title: e.target.value }))}
                placeholder="e.g., CEO, Engineer, Artist"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="author_location">Location</Label>
              <Input
                id="author_location"
                value={formData.author_location}
                onChange={(e) => setFormData(prev => ({ ...prev, author_location: e.target.value }))}
                placeholder="e.g., Dubai, UAE"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary">Story Summary *</Label>
            <Textarea
              id="summary"
              value={formData.summary}
              onChange={(e) => setFormData(prev => ({ ...prev, summary: e.target.value }))}
              placeholder="A brief summary of your success story (2-3 sentences)"
              rows={3}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="full_story">Full Story *</Label>
            <Textarea
              id="full_story"
              value={formData.full_story}
              onChange={(e) => setFormData(prev => ({ ...prev, full_story: e.target.value }))}
              placeholder="Tell your complete story - your journey, challenges, achievements, and the lessons you've learned..."
              rows={8}
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Categories * (Select all that apply)</Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {categories.map((category) => (
                <div key={category.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={category.id}
                    checked={formData.category.includes(category.id)}
                    onCheckedChange={(checked) => handleCategoryChange(category.id, checked as boolean)}
                  />
                  <Label htmlFor={category.id} className="text-sm font-normal">
                    {category.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Story
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default StorySubmissionForm;
