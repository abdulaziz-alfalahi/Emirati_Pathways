import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Star, Search, Calendar, MapPin, User, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import StoryViewDialog from './StoryViewDialog';

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

interface SuccessStoriesShowcaseProps {
  showOnlyUserStories?: boolean;
}

const SuccessStoriesShowcase: React.FC<SuccessStoriesShowcaseProps> = ({ showOnlyUserStories = false }) => {
  const { user } = useAuth();
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStory, setSelectedStory] = useState<SuccessStory | null>(null);

  const categories = [
    { value: 'all', label: 'All Categories' },
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

  useEffect(() => {
    fetchStories();
  }, [showOnlyUserStories, user]);

  const fetchStories = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('success_stories' as any)
        .select('*')
        .order('submitted_at', { ascending: false });

      if (showOnlyUserStories && user) {
        // Show all user's stories regardless of status
        query = query.eq('author_id', user.id);
      } else {
        // Show only approved stories for public viewing
        query = query.eq('status', 'approved');
      }

      const { data, error } = await query;

      if (error) throw error;
      
      // Use double casting to handle TypeScript type mismatch
      const typedData = (data || []) as unknown as SuccessStory[];
      setStories(typedData);
    } catch (error) {
      console.error('Error fetching stories:', error);
      setStories([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStories = stories.filter(story => {
    const matchesSearch = story.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         story.author_name.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || story.category.includes(selectedCategory);
    
    return matchesSearch && matchesCategory;
  });

  const featuredStories = filteredStories.filter(story => story.is_featured);
  const regularStories = filteredStories.filter(story => !story.is_featured);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'success';
      case 'pending': return 'secondary';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const StoryCard: React.FC<{ story: SuccessStory }> = ({ story }) => (
    <Card className={`hover:shadow-md transition-shadow cursor-pointer ${story.is_featured ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight flex items-center gap-2">
              {story.title}
              {story.is_featured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  Featured
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              <div className="flex items-center gap-1 text-sm">
                <User className="h-3 w-3" />
                {story.author_name}
                {story.author_title && ` • ${story.author_title}`}
              </div>
              {story.author_location && (
                <div className="flex items-center gap-1 text-sm mt-1">
                  <MapPin className="h-3 w-3" />
                  {story.author_location}
                </div>
              )}
            </CardDescription>
          </div>
          {showOnlyUserStories && (
            <Badge variant={getStatusColor(story.status) as any}>
              {story.status}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {story.summary}
        </p>
        
        <div className="flex flex-wrap gap-1 mb-4">
          {story.category.slice(0, 3).map((cat, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {categories.find(c => c.value === cat)?.label || cat}
            </Badge>
          ))}
          {story.category.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{story.category.length - 3} more
            </Badge>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {new Date(story.submitted_at).toLocaleDateString()}
          </div>
          <Button 
            size="sm" 
            variant="outline"
            onClick={() => setSelectedStory(story)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Read Story
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading stories...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stories by title, summary, or author..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.value} value={category.value}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Featured Stories */}
      {featuredStories.length > 0 && !showOnlyUserStories && (
        <div>
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Stories
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {featuredStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        </div>
      )}

      {/* Regular Stories */}
      <div>
        <h3 className="text-xl font-semibold mb-4">
          {showOnlyUserStories ? 'Your Stories' : 'All Stories'}
        </h3>
        {regularStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularStories.map((story) => (
              <StoryCard key={story.id} story={story} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {showOnlyUserStories ? 'No stories submitted yet' : 'No stories found'}
            </h3>
            <p className="text-muted-foreground">
              {showOnlyUserStories 
                ? 'Start sharing your success story to inspire others!' 
                : 'Try adjusting your search terms or filters.'}
            </p>
          </div>
        )}
      </div>

      {/* Story View Dialog */}
      {selectedStory && (
        <StoryViewDialog
          story={selectedStory}
          open={!!selectedStory}
          onOpenChange={() => setSelectedStory(null)}
        />
      )}
    </div>
  );
};

export default SuccessStoriesShowcase;
