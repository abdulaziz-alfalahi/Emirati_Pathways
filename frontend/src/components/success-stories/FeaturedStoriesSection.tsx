
import React from 'react';
import { Star } from 'lucide-react';
import { SuccessStory } from '@/types/successStories';
import StoryCard from './StoryCard';

interface FeaturedStoriesSectionProps {
  featuredStories: SuccessStory[];
  isLoading: boolean;
  onStorySelect: (story: SuccessStory) => void;
}

const FeaturedStoriesSection: React.FC<FeaturedStoriesSectionProps> = ({
  featuredStories,
  isLoading,
  onStorySelect
}) => {
  if (featuredStories.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section className="mb-12">
      <div className="flex items-center space-x-2 mb-6">
        <Star className="h-6 w-6 text-yellow-500" />
        <h2 className="text-2xl font-bold">Featured Stories</h2>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-64 bg-muted rounded-t-lg"></div>
              <div className="p-6">
                <div className="h-4 bg-muted rounded mb-2"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredStories.map((story) => (
            <StoryCard 
              key={story.id} 
              story={story} 
              variant="featured"
              onReadMore={onStorySelect}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default FeaturedStoriesSection;
