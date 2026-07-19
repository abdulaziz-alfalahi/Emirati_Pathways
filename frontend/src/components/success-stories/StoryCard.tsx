import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Eye, Heart, Calendar, MapPin, Video, Volume2 } from 'lucide-react';
import { SuccessStory } from '@/types/successStories';
import SocialShareButtons from './SocialShareButtons';
import MediaPlayer from './MediaPlayer';

interface StoryCardProps {
  story: SuccessStory;
  onReadMore?: (story: SuccessStory) => void;
  variant?: 'default' | 'featured' | 'compact';
}

const StoryCard: React.FC<StoryCardProps> = ({ story, onReadMore, variant = 'default' }) => {
  const categoryLabels = {
    career_progression: 'Career Growth',
    entrepreneurship: 'Entrepreneurship',
    education: 'Education',
    innovation: 'Innovation',
    leadership: 'Leadership',
    skills_development: 'Skills Development'
  };

  const handleClick = () => {
    if (onReadMore) {
      onReadMore(story);
    }
  };

  const hasVideo = story.media.video_testimonial || story.media.video_url;
  const hasAudio = story.media.audio_clips && story.media.audio_clips.length > 0;

  if (variant === 'compact') {
    return (
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <Avatar className="h-12 w-12 flex-shrink-0">
              <AvatarImage src={story.author.avatar} alt={story.author.name} />
              <AvatarFallback>{story.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm line-clamp-2 mb-1">{story.title}</h3>
              <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{story.summary}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{story.author.name}</span>
                <div className="flex items-center space-x-2">
                  <span className="flex items-center space-x-1">
                    <Eye className="h-3 w-3" />
                    <span>{story.view_count}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Heart className="h-3 w-3" />
                    <span>{story.likes_count}</span>
                  </span>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SocialShareButtons story={story} variant="minimal" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'featured') {
    return (
      <Card className="cursor-pointer hover:shadow-lg transition-all duration-300 overflow-hidden" onClick={handleClick}>
        {story.media.video_testimonial ? (
          <div className="relative h-64" onClick={(e) => e.stopPropagation()}>
            <MediaPlayer
              type="video"
              src={story.media.video_testimonial.url}
              title={story.title}
              thumbnail={story.media.video_testimonial.thumbnail || story.media.featured_image}
              duration={story.media.video_testimonial.duration}
              className="h-full"
            />
            <div className="absolute top-4 start-4">
              <Badge variant="secondary" className="bg-white/90 text-gray-900">
                Featured Story
              </Badge>
            </div>
            <div className="absolute top-4 end-4" onClick={(e) => e.stopPropagation()}>
              <SocialShareButtons story={story} variant="minimal" />
            </div>
          </div>
        ) : story.media.featured_image ? (
          <div className="relative h-64 bg-cover bg-center" style={{ backgroundImage: `url(${story.media.featured_image})` }}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute top-4 start-4">
              <Badge variant="secondary" className="bg-white/90 text-gray-900">
                Featured Story
              </Badge>
            </div>
            <div className="absolute top-4 end-4" onClick={(e) => e.stopPropagation()}>
              <SocialShareButtons story={story} variant="minimal" />
            </div>
            <div className="absolute bottom-4 start-4 end-4">
              <h2 className="text-xl font-bold text-white mb-2 line-clamp-2">{story.title}</h2>
              <p className="text-white/90 text-sm line-clamp-2">{story.summary}</p>
            </div>
          </div>
        ) : null}
        
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <Badge variant="outline">{categoryLabels[story.category]}</Badge>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              {hasVideo && (
                <span className="flex items-center space-x-1">
                  <Video className="h-4 w-4" />
                  <span>Video</span>
                </span>
              )}
              {hasAudio && (
                <span className="flex items-center space-x-1">
                  <Volume2 className="h-4 w-4" />
                  <span>Audio</span>
                </span>
              )}
              <span className="flex items-center space-x-1">
                <Eye className="h-4 w-4" />
                <span>{story.view_count}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Heart className="h-4 w-4" />
                <span>{story.likes_count}</span>
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={story.author.avatar} alt={story.author.name} />
              <AvatarFallback>{story.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{story.author.name}</p>
              <p className="text-sm text-muted-foreground">{story.author.title}</p>
              {story.author.company && (
                <p className="text-xs text-muted-foreground">{story.author.company}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleClick}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between mb-2">
          <Badge variant="outline">{categoryLabels[story.category]}</Badge>
          <div className="flex items-center space-x-2">
            {story.is_featured && (
              <Badge variant="secondary">Featured</Badge>
            )}
            {hasVideo && (
              <Badge variant="outline" className="text-xs">
                <Video className="h-3 w-3 me-1" />
                Video
              </Badge>
            )}
            {hasAudio && (
              <Badge variant="outline" className="text-xs">
                <Volume2 className="h-3 w-3 me-1" />
                Audio
              </Badge>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <SocialShareButtons story={story} variant="minimal" />
            </div>
          </div>
        </div>
        <h3 className="font-semibold line-clamp-2 mb-2">{story.title}</h3>
        <p className="text-sm text-muted-foreground line-clamp-3">{story.summary}</p>
      </CardHeader>
      
      {story.media.video_testimonial ? (
        <div className="px-6" onClick={(e) => e.stopPropagation()}>
          <MediaPlayer
            type="video"
            src={story.media.video_testimonial.url}
            title="Video Testimonial"
            thumbnail={story.media.video_testimonial.thumbnail || story.media.featured_image}
            duration={story.media.video_testimonial.duration}
          />
        </div>
      ) : story.media.featured_image ? (
        <div className="px-6">
          <img 
            src={story.media.featured_image} 
            alt={story.title}
            className="w-full h-40 object-cover rounded-lg"
          />
        </div>
      ) : null}
      
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={story.author.avatar} alt={story.author.name} />
              <AvatarFallback className="text-xs">{story.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{story.author.name}</p>
              <p className="text-xs text-muted-foreground">{story.author.title}</p>
            </div>
          </div>
          <div className="flex items-center space-x-1 text-xs text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{story.author.location}</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Calendar className="h-4 w-4" />
            <span>{new Date(story.published_at || story.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex items-center space-x-4">
            <span className="flex items-center space-x-1">
              <Eye className="h-4 w-4" />
              <span>{story.view_count}</span>
            </span>
            <span className="flex items-center space-x-1">
              <Heart className="h-4 w-4" />
              <span>{story.likes_count}</span>
            </span>
          </div>
        </div>
        
        {story.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {story.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                {tag}
              </Badge>
            ))}
            {story.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs px-2 py-0.5">
                +{story.tags.length - 3} more
              </Badge>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StoryCard;
