
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Play, Heart, Share2, BookOpen, TrendingUp, Award } from 'lucide-react';

export interface SuccessStory {
  id: string;
  title: string;
  summary: string;
  category: 'career_change' | 'promotion' | 'entrepreneurship' | 'skill_development' | 'leadership';
  author: {
    name: string;
    title: string;
    company: string;
    avatar?: string;
  };
  timeline: {
    duration: string;
    keyMilestones: string[];
  };
  achievements: {
    metric: string;
    value: string;
    description: string;
  }[];
  skills: string[];
  resources: {
    title: string;
    type: 'course' | 'certification' | 'mentorship' | 'book' | 'program';
    helpful: boolean;
  }[];
  media: {
    type: 'video' | 'podcast' | 'article';
    thumbnail?: string;
    duration?: string;
    readTime?: string;
  };
  engagement: {
    likes: number;
    shares: number;
    inspirations: number;
  };
  tags: string[];
}

const categoryConfig = {
  career_change: {
    color: 'bg-blue-100 text-blue-800',
    icon: TrendingUp,
    label: 'Career Change'
  },
  promotion: {
    color: 'bg-green-100 text-green-800',
    icon: Award,
    label: 'Promotion'
  },
  entrepreneurship: {
    color: 'bg-purple-100 text-purple-800',
    icon: TrendingUp,
    label: 'Entrepreneurship'
  },
  skill_development: {
    color: 'bg-yellow-100 text-yellow-800',
    icon: BookOpen,
    label: 'Skill Development'
  },
  leadership: {
    color: 'bg-red-100 text-red-800',
    icon: Award,
    label: 'Leadership'
  }
};

export const SuccessStoryPresentation: React.FC<{ story: SuccessStory }> = ({ story }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const categoryInfo = categoryConfig[story.category];
  const CategoryIcon = categoryInfo.icon;

  return (
    <Card className="hover:shadow-lg transition-all duration-200">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <CategoryIcon className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
            <Badge className={categoryInfo.color}>
              {categoryInfo.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {story.media.type === 'video' && <Play className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />}
            <span className="text-xs text-muted-foreground">
              {story.media.duration || story.media.readTime}
            </span>
          </div>
        </div>
        
        <CardTitle className="text-lg">{story.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">
          {story.summary}
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Author */}
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={story.author.avatar} alt={story.author.name} />
            <AvatarFallback>{story.author.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{story.author.name}</p>
            <p className="text-xs text-muted-foreground">
              {story.author.title} at {story.author.company}
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Journey Duration</span>
            <span className="text-sm text-[rgb(var(--pg-secondary))] font-medium">
              {story.timeline.duration}
            </span>
          </div>
          
          {isExpanded && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Key Milestones</h4>
              <ul className="space-y-1">
                {story.timeline.keyMilestones.map((milestone, index) => (
                  <li key={index} className="text-xs text-muted-foreground flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[rgb(var(--pg-secondary))]" />
                    {milestone}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Achievements */}
        <div className="grid grid-cols-2 gap-3">
          {story.achievements.slice(0, 2).map((achievement, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
              <div className="text-lg font-bold text-[rgb(var(--pg-secondary))]">
                {achievement.value}
              </div>
              <div className="text-xs text-muted-foreground">
                {achievement.metric}
              </div>
            </div>
          ))}
        </div>

        {/* Skills Developed */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Skills Developed</span>
          <div className="flex flex-wrap gap-1">
            {story.skills.slice(0, 3).map((skill) => (
              <Badge key={skill} variant="secondary" className="text-xs">
                {skill}
              </Badge>
            ))}
            {story.skills.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{story.skills.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Resources Used (Expandable) */}
        {isExpanded && (
          <div className="space-y-2 border-t pt-4">
            <span className="text-sm font-medium">Resources That Helped</span>
            <div className="space-y-2">
              {story.resources.filter(r => r.helpful).slice(0, 3).map((resource, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{resource.title}</span>
                  <Badge variant="outline" className="text-xs">
                    {resource.type}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Engagement */}
        <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{story.engagement.likes}</span>
            </div>
            <div className="flex items-center gap-1">
              <Share2 className="h-4 w-4" />
              <span>{story.engagement.shares}</span>
            </div>
            <div className="flex items-center gap-1">
              <TrendingUp className="h-4 w-4" />
              <span>{story.engagement.inspirations}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            {story.media.type === 'video' ? 'Watch Story' : 'Read Story'}
          </Button>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
