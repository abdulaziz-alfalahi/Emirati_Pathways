
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building, Users, Video, MessageCircle, ExternalLink } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { VirtualBooth } from '@/types/virtualEvents';

interface VirtualBoothsProps {
  eventId: string;
}

const VirtualBooths: React.FC<VirtualBoothsProps> = ({ eventId }) => {
  const [booths, setBooths] = useState<VirtualBooth[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadBooths();
  }, [eventId]);

  const loadBooths = async () => {
    try {
      setIsLoading(true);
      const data = await VirtualEventsService.getEventBooths(eventId);
      setBooths(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load virtual booths",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisitBooth = async (boothId: string) => {
    try {
      await VirtualEventsService.visitBooth(boothId);
      toast({
        title: "Success",
        description: "Booth visit recorded!",
      });
      loadBooths(); // Refresh to update visitor count
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to visit booth",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Virtual Booths</h2>
        <Badge variant="secondary">{booths.length} Exhibitors</Badge>
      </div>

      {booths.length === 0 ? (
        <div className="text-center py-12">
          <Building className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No booths available</h3>
          <p className="text-muted-foreground">
            Virtual booths will appear here when exhibitors join the event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {booths.map((booth) => (
            <Card key={booth.id} className="h-full hover:shadow-lg transition-shadow">
              {booth.banner_url && (
                <div className="relative h-32 overflow-hidden rounded-t-lg">
                  <img 
                    src={booth.banner_url} 
                    alt={booth.title}
                    className="w-full h-full object-cover"
                  />
                  {booth.is_featured && (
                    <Badge className="absolute top-2 right-2 bg-yellow-500">
                      Featured
                    </Badge>
                  )}
                </div>
              )}

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{booth.title}</CardTitle>
                    <CardDescription className="line-clamp-2 mt-2">
                      {booth.description}
                    </CardDescription>
                  </div>
                  {booth.logo_url && (
                    <img 
                      src={booth.logo_url} 
                      alt={`${booth.title} logo`}
                      className="w-12 h-12 object-contain ml-2"
                    />
                  )}
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booth.visitor_count} visitors</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {booth.booth_type.replace('_', ' ')}
                    </Badge>
                  </div>

                  <div className="flex space-x-2">
                    <Button 
                      onClick={() => handleVisitBooth(booth.id)}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Visit Booth
                    </Button>
                    
                    {booth.chat_enabled && (
                      <Button variant="outline" size="icon">
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {booth.video_enabled && booth.meeting_room_url && (
                      <Button variant="outline" size="icon">
                        <Video className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualBooths;
