
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Video, MessageCircle, Clock } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { NetworkingRoom } from '@/types/virtualEvents';

interface NetworkingRoomsProps {
  eventId: string;
}

const NetworkingRooms: React.FC<NetworkingRoomsProps> = ({ eventId }) => {
  const [rooms, setRooms] = useState<NetworkingRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRooms();
  }, [eventId]);

  const loadRooms = async () => {
    try {
      setIsLoading(true);
      const data = await VirtualEventsService.getNetworkingRooms(eventId);
      setRooms(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load networking rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-AE', {
      hour: '2-digit',
      minute: '2-digit'
    });
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
        <h2 className="text-2xl font-bold">Networking Rooms</h2>
        <Badge variant="secondary">{rooms.length} Rooms Available</Badge>
      </div>

      {rooms.length === 0 ? (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No networking rooms available</h3>
          <p className="text-muted-foreground">
            Networking rooms will appear here when they are set up for the event.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {rooms.map((room) => (
            <Card key={room.id} className="h-full">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      {room.name}
                      {room.is_active && (
                        <Badge className="bg-green-500 text-white">
                          Active
                        </Badge>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      {room.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{room.current_participants} / {room.max_participants}</span>
                    </div>
                    <Badge variant="outline" className="capitalize">
                      {room.room_type}
                    </Badge>
                  </div>

                  {room.scheduled_start && room.scheduled_end && (
                    <div className="flex items-center space-x-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {formatTime(room.scheduled_start)} - {formatTime(room.scheduled_end)}
                      </span>
                    </div>
                  )}

                  {room.industry_focus && (
                    <div>
                      <p className="text-sm font-medium">Industry Focus:</p>
                      <Badge variant="secondary">{room.industry_focus}</Badge>
                    </div>
                  )}

                  {room.career_level && (
                    <div>
                      <p className="text-sm font-medium">Career Level:</p>
                      <Badge variant="secondary">{room.career_level}</Badge>
                    </div>
                  )}

                  {room.topics && room.topics.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-2">Topics:</p>
                      <div className="flex flex-wrap gap-1">
                        {room.topics.map((topic, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2">
                    <Button 
                      className="flex-1"
                      disabled={!room.is_active || room.current_participants >= room.max_participants}
                    >
                      <Users className="h-4 w-4 mr-2" />
                      Join Room
                    </Button>
                    
                    {room.meeting_url && (
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

export default NetworkingRooms;
