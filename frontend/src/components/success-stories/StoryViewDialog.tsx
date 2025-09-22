
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MapPin, User, Star } from 'lucide-react';

interface SuccessStory {
  id: string;
  title: string;
  summary: string;
  full_story: string;
  author_name: string;
  author_title?: string;
  author_location?: string;
  category: string[];
  status: 'pending' | 'approved' | 'rejected';
  is_featured: boolean;
  submitted_at: string;
  approved_at?: string;
}

interface StoryViewDialogProps {
  story: SuccessStory;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const StoryViewDialog: React.FC<StoryViewDialogProps> = ({ story, open, onOpenChange }) => {
  const categories = [
    { value: 'entrepreneurship', label: 'Entrepreneurship' },
    { value: 'technology', label: 'Technology' },
    { value: 'engineering', label: 'Engineering' },
    { value: 'leadership', label: 'Leadership' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'arts_culture', label: 'Arts & Culture' },
    { value: 'sports', label: 'Sports' },
    { value: 'social_impact', label: 'Social Impact' },
    { value: 'women_empowerment', label: 'Women Empowerment' }
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {story.title}
            {story.is_featured && (
              <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                <Star className="h-3 w-3 mr-1" />
                Featured
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Author Information */}
          <div className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary text-primary-foreground">
                {story.author_name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">{story.author_name}</h4>
              {story.author_title && (
                <p className="text-sm text-muted-foreground">{story.author_title}</p>
              )}
              {story.author_location && (
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-3 w-3" />
                  {story.author_location}
                </div>
              )}
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-2">
                <Calendar className="h-3 w-3" />
                Published {new Date(story.submitted_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Categories */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Categories</h5>
            <div className="flex flex-wrap gap-2">
              {story.category.map((cat, index) => (
                <Badge key={index} variant="outline">
                  {categories.find(c => c.value === cat)?.label || cat}
                </Badge>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Summary</h5>
            <p className="text-muted-foreground">{story.summary}</p>
          </div>

          {/* Full Story */}
          <div className="space-y-2">
            <h5 className="font-medium text-sm">Full Story</h5>
            <div className="prose prose-sm max-w-none">
              {story.full_story.split('\n\n').map((paragraph, index) => (
                <p key={index} className="mb-4 text-gray-700 leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default StoryViewDialog;
