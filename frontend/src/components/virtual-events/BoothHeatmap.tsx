
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Clock, 
  Users, 
  MessageCircle, 
  Video, 
  Download,
  TrendingUp
} from 'lucide-react';
import { EngagementTrackingService } from '@/services/engagementTrackingService';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { VirtualBooth } from '@/types/virtualEvents';
import { toast } from '@/components/ui/use-toast';

interface BoothHeatmapProps {
  eventId: string;
}

interface BoothHeatmapData {
  booth: VirtualBooth;
  heatmapData: {
    total_interactions: number;
    total_duration: number;
    interaction_types: Record<string, number>;
  };
}

const BoothHeatmap: React.FC<BoothHeatmapProps> = ({ eventId }) => {
  const [booths, setBooths] = useState<VirtualBooth[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, any>>({});
  const [sortBy, setSortBy] = useState<'interactions' | 'duration' | 'engagement'>('interactions');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBoothHeatmapData();
  }, [eventId]);

  const loadBoothHeatmapData = async () => {
    try {
      setIsLoading(true);
      const [boothsData, heatmapResponse] = await Promise.all([
        VirtualEventsService.getEventBooths(eventId),
        EngagementTrackingService.getBoothInteractionHeatmap(eventId)
      ]);

      setBooths(boothsData);
      setHeatmapData(heatmapResponse);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load booth heatmap data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getBoothsWithHeatmapData = (): BoothHeatmapData[] => {
    return booths.map(booth => ({
      booth,
      heatmapData: heatmapData[booth.id] || {
        total_interactions: 0,
        total_duration: 0,
        interaction_types: {}
      }
    }));
  };

  const getSortedBooths = (): BoothHeatmapData[] => {
    const boothsWithData = getBoothsWithHeatmapData();
    
    return boothsWithData.sort((a, b) => {
      switch (sortBy) {
        case 'interactions':
          return b.heatmapData.total_interactions - a.heatmapData.total_interactions;
        case 'duration':
          return b.heatmapData.total_duration - a.heatmapData.total_duration;
        case 'engagement':
          const aEngagement = a.heatmapData.total_interactions + (a.heatmapData.total_duration / 60);
          const bEngagement = b.heatmapData.total_interactions + (b.heatmapData.total_duration / 60);
          return bEngagement - aEngagement;
        default:
          return 0;
      }
    });
  };

  const getHeatmapIntensity = (value: number, maxValue: number): string => {
    if (maxValue === 0) return 'opacity-20';
    const intensity = value / maxValue;
    if (intensity >= 0.8) return 'bg-red-500 text-white';
    if (intensity >= 0.6) return 'bg-orange-400 text-white';
    if (intensity >= 0.4) return 'bg-yellow-400 text-black';
    if (intensity >= 0.2) return 'bg-green-400 text-black';
    return 'bg-gray-200 text-gray-600';
  };

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const getInteractionIcon = (type: string) => {
    switch (type) {
      case 'chat': return <MessageCircle className="h-4 w-4" />;
      case 'video_call': return <Video className="h-4 w-4" />;
      case 'download': return <Download className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const sortedBooths = getSortedBooths();
  const maxInteractions = Math.max(...sortedBooths.map(b => b.heatmapData.total_interactions));
  const maxDuration = Math.max(...sortedBooths.map(b => b.heatmapData.total_duration));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-20 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Booth Interaction Heatmap</h2>
          <p className="text-muted-foreground">
            Visual representation of booth engagement and interaction patterns
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={sortBy === 'interactions' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('interactions')}
          >
            <Activity className="h-4 w-4 mr-1" />
            Interactions
          </Button>
          <Button
            variant={sortBy === 'duration' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('duration')}
          >
            <Clock className="h-4 w-4 mr-1" />
            Duration
          </Button>
          <Button
            variant={sortBy === 'engagement' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSortBy('engagement')}
          >
            <TrendingUp className="h-4 w-4 mr-1" />
            Engagement
          </Button>
        </div>
      </div>

      <Tabs defaultValue="grid" className="space-y-4">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {sortedBooths.map(({ booth, heatmapData }) => (
              <Card 
                key={booth.id} 
                className={`transition-all duration-200 ${
                  getHeatmapIntensity(heatmapData.total_interactions, maxInteractions)
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm truncate">{booth.title}</CardTitle>
                    {booth.is_featured && (
                      <Badge variant="secondary" className="text-xs">Featured</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-1">
                      <Activity className="h-4 w-4" />
                      <span className="text-sm font-medium">{heatmapData.total_interactions}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="h-4 w-4" />
                      <span className="text-sm">{formatDuration(heatmapData.total_duration)}</span>
                    </div>
                  </div>
                  
                  {Object.keys(heatmapData.interaction_types).length > 0 && (
                    <div className="space-y-1">
                      {Object.entries(heatmapData.interaction_types).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between text-xs">
                          <div className="flex items-center space-x-1">
                            {getInteractionIcon(type)}
                            <span className="capitalize">{type.replace('_', ' ')}</span>
                          </div>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Booth Performance Ranking</CardTitle>
              <CardDescription>
                Detailed breakdown of booth interactions and engagement
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedBooths.map(({ booth, heatmapData }, index) => (
                  <div 
                    key={booth.id} 
                    className="flex items-center justify-between p-4 rounded-lg border"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </div>
                      <div>
                        <h3 className="font-medium">{booth.title}</h3>
                        <p className="text-sm text-muted-foreground">{booth.booth_type}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-6">
                      <div className="text-center">
                        <div className="text-lg font-bold">{heatmapData.total_interactions}</div>
                        <div className="text-xs text-muted-foreground">Interactions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">{formatDuration(heatmapData.total_duration)}</div>
                        <div className="text-xs text-muted-foreground">Total Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold">
                          {Object.keys(heatmapData.interaction_types).length}
                        </div>
                        <div className="text-xs text-muted-foreground">Types</div>
                      </div>
                      <div className="flex space-x-1">
                        {Object.entries(heatmapData.interaction_types).map(([type, count]) => (
                          <Badge key={type} variant="outline" className="text-xs">
                            {getInteractionIcon(type)}
                            <span className="ml-1">{count}</span>
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Heatmap Legend */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Heatmap Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-gray-200 rounded"></div>
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-green-400 rounded"></div>
              <span className="text-xs">Moderate</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-yellow-400 rounded"></div>
              <span className="text-xs">Good</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-orange-400 rounded"></div>
              <span className="text-xs">High</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="text-xs">Very High</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BoothHeatmap;
