
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, Video, MessageCircle, Clock, Plus } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface BreakoutRoom {
  id: string;
  name: string;
  topic: string;
  host_id: string;
  host_name: string;
  current_participants: number;
  max_participants: number;
  is_active: boolean;
  created_at: string;
  participants: Participant[];
}

interface Participant {
  id: string;
  name: string;
  avatar?: string;
  is_host: boolean;
}

interface BreakoutRoomsProps {
  sessionId: string;
  eventId: string;
}

const BreakoutRooms: React.FC<BreakoutRoomsProps> = ({ sessionId, eventId }) => {
  const [rooms, setRooms] = useState<BreakoutRoom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState<BreakoutRoom | null>(null);
  const [showCreateRoom, setShowCreateRoom] = useState(false);

  useEffect(() => {
    loadBreakoutRooms();
  }, [sessionId]);

  const loadBreakoutRooms = async () => {
    try {
      setIsLoading(true);
      // Mock data for breakout rooms
      const mockRooms: BreakoutRoom[] = [
        {
          id: '1',
          name: 'Career Transition Discussion',
          topic: 'Switching from traditional roles to tech',
          host_id: 'host1',
          host_name: 'Ahmad Khalil',
          current_participants: 5,
          max_participants: 8,
          is_active: true,
          created_at: new Date().toISOString(),
          participants: [
            { id: '1', name: 'Ahmad Khalil', is_host: true },
            { id: '2', name: 'Sara Ahmed', is_host: false },
            { id: '3', name: 'Omar Hassan', is_host: false },
          ]
        },
        {
          id: '2',
          name: 'Startup Founders Circle',
          topic: 'Building startups in the UAE',
          host_id: 'host2',
          host_name: 'Layla Al-Rashid',
          current_participants: 3,
          max_participants: 6,
          is_active: true,
          created_at: new Date().toISOString(),
          participants: [
            { id: '4', name: 'Layla Al-Rashid', is_host: true },
            { id: '5', name: 'Mohammed Ali', is_host: false },
            { id: '6', name: 'Fatima Noor', is_host: false },
          ]
        }
      ];
      setRooms(mockRooms);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load breakout rooms",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = async (roomId: string) => {
    try {
      const room = rooms.find(r => r.id === roomId);
      if (!room) return;

      if (room.current_participants >= room.max_participants) {
        toast({
          title: "Room Full",
          description: "This breakout room is currently full",
          variant: "destructive",
        });
        return;
      }

      // In a real implementation, this would join the actual room
      setRooms(prev => 
        prev.map(r => 
          r.id === roomId 
            ? { ...r, current_participants: r.current_participants + 1 }
            : r
        )
      );

      toast({
        title: "Joined Room",
        description: `You've joined the "${room.name}" breakout room`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to join breakout room",
        variant: "destructive",
      });
    }
  };

  const createRoom = async (name: string, topic: string, maxParticipants: number) => {
    try {
      const newRoom: BreakoutRoom = {
        id: Date.now().toString(),
        name,
        topic,
        host_id: 'current-user',
        host_name: 'Current User',
        current_participants: 1,
        max_participants: maxParticipants,
        is_active: true,
        created_at: new Date().toISOString(),
        participants: [
          { id: 'current-user', name: 'Current User', is_host: true }
        ]
      };

      setRooms(prev => [...prev, newRoom]);
      setShowCreateRoom(false);

      toast({
        title: "Room Created",
        description: `Breakout room "${name}" has been created`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create breakout room",
        variant: "destructive",
      });
    }
  };

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Users className="h-5 w-5 me-2" />
              Breakout Rooms
            </CardTitle>
            <CardDescription>
              Join smaller group discussions on specific topics
            </CardDescription>
          </div>
          <Dialog open={showCreateRoom} onOpenChange={setShowCreateRoom}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 me-1" />
                Create Room
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Breakout Room</DialogTitle>
              </DialogHeader>
              <CreateRoomForm onSubmit={createRoom} />
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-medium">{room.name}</h3>
                    {room.is_active && (
                      <Badge className="bg-green-500 text-white">Active</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{room.topic}</p>
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                    <span>Host: {room.host_name}</span>
                    <div className="flex items-center">
                      <Users className="h-3 w-3 me-1" />
                      {room.current_participants}/{room.max_participants}
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 me-1" />
                      {new Date(room.created_at).toLocaleTimeString('en-AE', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {room.participants.slice(0, 4).map((participant, index) => (
                    <Avatar key={participant.id} className="h-6 w-6 border-2 border-white">
                      <AvatarImage src={participant.avatar} />
                      <AvatarFallback className="text-xs">
                        {participant.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  ))}
                  {room.participants.length > 4 && (
                    <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center">
                      <span className="text-xs text-gray-600">
                        +{room.participants.length - 4}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedRoom(room)}
                      >
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedRoom?.name}</DialogTitle>
                      </DialogHeader>
                      {selectedRoom && (
                        <div className="space-y-4">
                          <p className="text-muted-foreground">{selectedRoom.topic}</p>
                          <div>
                            <h4 className="font-medium mb-2">Participants</h4>
                            <div className="space-y-2">
                              {selectedRoom.participants.map((participant) => (
                                <div key={participant.id} className="flex items-center space-x-2">
                                  <Avatar className="h-6 w-6">
                                    <AvatarImage src={participant.avatar} />
                                    <AvatarFallback className="text-xs">
                                      {participant.name.charAt(0).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <span className="text-sm">{participant.name}</span>
                                  {participant.is_host && (
                                    <Badge variant="outline" className="text-xs">Host</Badge>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Button 
                    size="sm" 
                    onClick={() => joinRoom(room.id)}
                    disabled={room.current_participants >= room.max_participants}
                  >
                    <Video className="h-4 w-4 me-1" />
                    Join Room
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Simple create room form component
const CreateRoomForm: React.FC<{ onSubmit: (name: string, topic: string, maxParticipants: number) => void }> = ({ onSubmit }) => {
  const [name, setName] = useState('');
  const [topic, setTopic] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(6);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && topic) {
      onSubmit(name, topic, maxParticipants);
      setName('');
      setTopic('');
      setMaxParticipants(6);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Room Name</label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter room name"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Topic</label>
        <Input
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="What will you discuss?"
          required
        />
      </div>
      <div>
        <label className="text-sm font-medium">Max Participants</label>
        <Input
          type="number"
          value={maxParticipants}
          onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
          min={2}
          max={12}
        />
      </div>
      <Button type="submit" className="w-full">
        Create Room
      </Button>
    </form>
  );
};

export default BreakoutRooms;
