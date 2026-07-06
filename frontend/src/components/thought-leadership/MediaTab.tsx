
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, ExternalLink, Eye, Video, Mic, Star } from 'lucide-react';
import { ThoughtLeadershipContent } from './types';

interface MediaTabProps {
  searchQuery: string;
}

export const MediaTab: React.FC<MediaTabProps> = ({ searchQuery }) => {
  const [videos, setVideos] = useState<ThoughtLeadershipContent[]>([]);
  const [podcasts, setPodcasts] = useState<ThoughtLeadershipContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMedia();
  }, [searchQuery]);

  const fetchMedia = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('thought_leadership_content')
        .select('*')
        .in('content_type', ['video', 'podcast'])
        .eq('status', 'published')
        .order('published_date', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      
      const typedData = (data || []) as ThoughtLeadershipContent[];
      setVideos(typedData.filter(item => item.content_type === 'video'));
      setPodcasts(typedData.filter(item => item.content_type === 'podcast'));
    } catch (error) {
      console.error('Error fetching media:', error);
    } finally {
      setLoading(false);
    }
  };

  const MediaCard: React.FC<{ item: ThoughtLeadershipContent; type: 'video' | 'podcast' }> = ({ item, type }) => (
    <Card className={`hover:shadow-md transition-shadow ${item.is_featured ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base leading-tight flex items-center gap-2">
              {type === 'video' ? <Video className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              {item.title}
            </CardTitle>
            <CardDescription className="mt-2">
              By {item.author_name}
              {item.author_title && `, ${item.author_title}`}
            </CardDescription>
          </div>
          {item.is_featured && (
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              <Star className="h-3 w-3 mr-1" />
              Featured
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {item.thumbnail_url && (
          <div className="aspect-video bg-gray-100 rounded-md mb-4 overflow-hidden">
            <img
              src={item.thumbnail_url}
              alt={item.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.style.display = 'none';
              }}
            />
          </div>
        )}
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {item.summary}
        </p>
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
          <div className="flex items-center gap-3">
            {item.duration_minutes && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.duration_minutes}m
              </span>
            )}
            <span className="flex items-center gap-1">
              <Eye className="h-3 w-3" />
              {item.view_count}
            </span>
          </div>
          <span>{new Date(item.published_date).toLocaleDateString()}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-4">
          {item.tags?.slice(0, 2).map((tag, index) => (
            <Badge key={index} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        <Button size="sm" variant={item.is_featured ? "default" : "outline"} className="w-full" asChild>
          <a
            href={item.full_content_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2"
          >
            {type === 'video' ? 'Watch Video' : 'Listen to Podcast'}
            <ExternalLink className="h-3 w-3" />
          </a>
        </Button>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gray-200 rounded mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <Tabs defaultValue="all" className="w-full">
      <TabsList className="mb-6">
        <TabsTrigger value="all">All Media</TabsTrigger>
        <TabsTrigger value="videos" className="flex items-center gap-2">
          <Video className="h-4 w-4" />
          Videos ({videos.length})
        </TabsTrigger>
        <TabsTrigger value="podcasts" className="flex items-center gap-2">
          <Mic className="h-4 w-4" />
          Podcasts ({podcasts.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="all">
        <div className="space-y-6">
          {/* Featured Media */}
          {[...videos, ...podcasts].some(item => item.is_featured) && (
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Featured Media
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {[...videos, ...podcasts]
                  .filter(item => item.is_featured)
                  .map((item) => (
                    <MediaCard key={item.id} item={item} type={item.content_type as 'video' | 'podcast'} />
                  ))}
              </div>
            </div>
          )}

          {/* All Media */}
          <div>
            <h3 className="text-lg font-semibold mb-4">All Media Content</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...videos, ...podcasts]
                .filter(item => !item.is_featured)
                .map((item) => (
                  <MediaCard key={item.id} item={item} type={item.content_type as 'video' | 'podcast'} />
                ))}
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="videos">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {videos.map((video) => (
            <MediaCard key={video.id} item={video} type="video" />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="podcasts">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {podcasts.map((podcast) => (
            <MediaCard key={podcast.id} item={podcast} type="podcast" />
          ))}
        </div>
      </TabsContent>

      {videos.length === 0 && podcasts.length === 0 && !loading && (
        <div className="text-center py-12">
          <Video className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No media content found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms.' : 'No videos or podcasts are currently available.'}
          </p>
        </div>
      )}
    </Tabs>
  );
};
