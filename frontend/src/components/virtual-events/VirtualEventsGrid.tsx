
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar, Users, Video } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';
import { VirtualEvent } from '@/types/virtualEvents';
import VirtualEventCard from './VirtualEventCard';
import CreateEventDialog from './CreateEventDialog';

const eventTypes = [
  { value: 'career_fair', label: 'Career Fair' },
  { value: 'job_expo', label: 'Job Expo' },
  { value: 'networking_event', label: 'Networking Event' },
  { value: 'workshop', label: 'Workshop' },
  { value: 'webinar', label: 'Webinar' },
  { value: 'conference', label: 'Conference' }
];

const VirtualEventsGrid: React.FC = () => {
  const [events, setEvents] = useState<VirtualEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    event_type: '',
    status: '',
    upcoming: true
  });

  useEffect(() => {
    loadEvents();
  }, [filters]);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const filterParams: any = {};
      if (filters.event_type) filterParams.event_type = filters.event_type;
      if (filters.status) filterParams.status = filters.status;
      if (filters.search) filterParams.search = filters.search;
      if (filters.upcoming) filterParams.upcoming = filters.upcoming;

      const data = await VirtualEventsService.getEvents(filterParams);
      setEvents(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load virtual events",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      event_type: '',
      status: '',
      upcoming: true
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
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Video className="h-8 w-8 text-primary" />
            Virtual Career Events
          </h1>
          <p className="text-muted-foreground">
            Join virtual career fairs, networking events, and professional development sessions
          </p>
        </div>
        <CreateEventDialog onEventCreated={loadEvents} />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Events</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <Calendar className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Live Events</p>
              <p className="text-2xl font-bold">{events.filter(e => e.status === 'live').length}</p>
            </div>
            <Video className="h-8 w-8 text-green-500" />
          </div>
        </div>
        <div className="bg-card p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Upcoming</p>
              <p className="text-2xl font-bold">{events.filter(e => e.status === 'published').length}</p>
            </div>
            <Users className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card p-4 rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search events..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              className="ps-10"
            />
          </div>
          
          <Select value={filters.event_type} onValueChange={(value) => setFilters(prev => ({ ...prev, event_type: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All Event Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Event Types</SelectItem>
              {eventTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Statuses</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="live">Live</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex space-x-2">
            <Button 
              variant={filters.upcoming ? "default" : "outline"}
              onClick={() => setFilters(prev => ({ ...prev, upcoming: !prev.upcoming }))}
              className="flex-1"
            >
              Upcoming Only
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              <Filter className="h-4 w-4 me-2" />
              Clear
            </Button>
          </div>
        </div>
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <Video className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No virtual events found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your filters or create a new virtual event to get started.
          </p>
          <CreateEventDialog onEventCreated={loadEvents} />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <VirtualEventCard
              key={event.id}
              event={event}
              onRegistered={loadEvents}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VirtualEventsGrid;
