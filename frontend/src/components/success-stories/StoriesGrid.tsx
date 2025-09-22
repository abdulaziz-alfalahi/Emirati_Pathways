
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { SuccessStory } from '@/types/successStories';
import StoryCard from './StoryCard';

interface StoriesGridProps {
  filteredStories: SuccessStory[];
  totalStories: number;
  isLoading: boolean;
  onStorySelect: (story: SuccessStory) => void;
}

const StoriesGrid: React.FC<StoriesGridProps> = ({
  filteredStories,
  totalStories,
  isLoading,
  onStorySelect
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <div className="p-6">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </div>
            <div className="px-6">
              <div className="h-40 bg-muted rounded"></div>
            </div>
            <CardContent className="pt-4">
              <div className="h-4 bg-muted rounded mb-2"></div>
              <div className="h-4 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredStories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No stories found</h3>
          <p className="text-muted-foreground text-center mb-4">
            Try adjusting your search terms or filters to find more stories.
          </p>
          <Badge variant="outline" className="text-sm">
            {totalStories} total stories available
          </Badge>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredStories.length} of {totalStories} stories
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStories.map((story) => (
          <StoryCard 
            key={story.id} 
            story={story} 
            onReadMore={onStorySelect}
          />
        ))}
      </div>
    </>
  );
};

export default StoriesGrid;
