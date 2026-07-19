
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, Video, MapPin, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { VirtualEvent, EventRegistration } from '@/types/virtualEvents';
import EventOverview from '@/components/virtual-events/EventOverview';
import VirtualBooths from '@/components/virtual-events/VirtualBooths';
import EventSessions from '@/components/virtual-events/EventSessions';
import NetworkingRooms from '@/components/virtual-events/NetworkingRooms';
import EventAnalytics from '@/components/virtual-events/EventAnalytics';

const VirtualEventDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<VirtualEvent | null>(null);
  const [registration, setRegistration] = useState<EventRegistration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventDetails();
    }
  }, [id]);

  const loadEventDetails = async () => {
    if (!id) return;
    
    try {
      setIsLoading(true);
      const [eventData, registrationData] = await Promise.all([
        VirtualEventsService.getEventById(id),
        VirtualEventsService.getUserRegistration(id)
      ]);
      
      setEvent(eventData);
      setRegistration(registrationData);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!id) return;
    
    try {
      setIsRegistering(true);
      const newRegistration = await VirtualEventsService.registerForEvent(id);
      setRegistration(newRegistration);
      toast({
        title: "Success",
        description: "You've successfully registered for the event!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to register for event",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCheckIn = async () => {
    if (!id) return;
    
    try {
      await VirtualEventsService.checkInToEvent(id);
      await loadEventDetails();
      toast({
        title: "Success",
        description: "You've successfully checked in to the event!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to check in",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </Layout>
    );
  }

  if (!event) {
    return (
      <Layout>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold mb-4">Event Not Found</h2>
          <p className="text-muted-foreground">The requested event could not be found.</p>
        </div>
      </Layout>
    );
  }

  const isUpcoming = new Date(event.start_date) > new Date();
  const isLive = event.status === 'live';
  const isRegistered = !!registration;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Event Header */}
        <div className="mb-8">
          {event.banner_image_url && (
            <div className="relative h-64 mb-6 rounded-lg overflow-hidden">
              <img 
                src={event.banner_image_url} 
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                <div className="p-6 text-white">
                  <h1 className="text-4xl font-bold mb-2">{event.title}</h1>
                  <p className="text-lg opacity-90">{event.description}</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="space-y-4">
              {!event.banner_image_url && (
                <h1 className="text-4xl font-bold">{event.title}</h1>
              )}
              
              <div className="flex flex-wrap gap-2">
                <Badge className="capitalize">
                  {event.event_type.replace('_', ' ')}
                </Badge>
                <Badge variant={event.status === 'live' ? 'destructive' : 'secondary'}>
                  {event.status}
                </Badge>
                {isLive && (
                  <Badge className="bg-red-500 text-white animate-pulse">
                    <Video className="h-3 w-3 me-1" />
                    LIVE
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{new Date(event.start_date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {new Date(event.start_date).toLocaleTimeString()} - 
                    {new Date(event.end_date).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>{event.timezone}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {!isRegistered && isUpcoming && (
                <Button 
                  onClick={handleRegister}
                  disabled={isRegistering}
                  size="lg"
                >
                  {isRegistering ? 'Registering...' : 'Register for Event'}
                </Button>
              )}
              
              {isRegistered && isUpcoming && (
                <div className="space-y-2">
                  <Badge className="w-full justify-center bg-green-100 text-green-800">
                    ✓ Registered
                  </Badge>
                  <Button onClick={handleCheckIn} size="lg" variant="outline">
                    Check In Early
                  </Button>
                </div>
              )}

              {isRegistered && isLive && (
                <Button onClick={handleCheckIn} size="lg" className="bg-red-500 hover:bg-red-600">
                  <Video className="h-4 w-4 me-2" />
                  Join Live Event
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Event Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="booths" disabled={!isRegistered}>
              Virtual Booths
            </TabsTrigger>
            <TabsTrigger value="sessions" disabled={!isRegistered}>
              Sessions
            </TabsTrigger>
            <TabsTrigger value="networking" disabled={!isRegistered}>
              Networking
            </TabsTrigger>
            <TabsTrigger value="analytics" disabled={!isRegistered}>
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <EventOverview event={event} registration={registration} />
          </TabsContent>

          <TabsContent value="booths">
            <VirtualBooths eventId={event.id} />
          </TabsContent>

          <TabsContent value="sessions">
            <EventSessions eventId={event.id} />
          </TabsContent>

          <TabsContent value="networking">
            <NetworkingRooms eventId={event.id} />
          </TabsContent>

          <TabsContent value="analytics">
            <EventAnalytics eventId={event.id} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default VirtualEventDetailPage;
