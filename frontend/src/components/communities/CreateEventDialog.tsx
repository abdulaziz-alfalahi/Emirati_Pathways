
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, MapPin, Video } from 'lucide-react';
import { CommunitiesService } from '@/services/communitiesService';
import { toast } from '@/components/ui/use-toast';

interface CreateEventDialogProps {
  groupId: string;
  onEventCreated?: () => void;
}

const EVENT_TYPES = [
  'Meetup',
  'Workshop',
  'Webinar',
  'Networking',
  'Conference',
  'Training',
  'Social',
  'Other'
];

const CreateEventDialog: React.FC<CreateEventDialogProps> = ({ groupId, onEventCreated }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [eventType, setEventType] = useState('');
  const [isVirtual, setIsVirtual] = useState(false);
  const [location, setLocation] = useState('');
  const [virtualUrl, setVirtualUrl] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxAttendees, setMaxAttendees] = useState('');
  const [tags, setTags] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Please enter an event title",
        variant: "destructive"
      });
      return;
    }

    if (!eventType) {
      toast({
        title: "Error",
        description: "Please select an event type",
        variant: "destructive"
      });
      return;
    }

    if (!startDate || !endDate) {
      toast({
        title: "Error",
        description: "Please set start and end dates",
        variant: "destructive"
      });
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      toast({
        title: "Error",
        description: "End date must be after start date",
        variant: "destructive"
      });
      return;
    }

    if (!isVirtual && !location.trim()) {
      toast({
        title: "Error",
        description: "Please provide a location for in-person events",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      await CommunitiesService.createGroupEvent(groupId, {
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        is_virtual: isVirtual,
        location: isVirtual ? undefined : location.trim(),
        virtual_meeting_url: isVirtual ? virtualUrl.trim() || undefined : undefined,
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        max_attendees: maxAttendees ? parseInt(maxAttendees) : undefined,
        tags: tags.trim() ? tags.split(',').map(tag => tag.trim()).filter(Boolean) : []
      });

      toast({
        title: "Success",
        description: "Event created successfully!"
      });

      // Reset form
      setTitle('');
      setDescription('');
      setEventType('');
      setIsVirtual(false);
      setLocation('');
      setVirtualUrl('');
      setStartDate('');
      setEndDate('');
      setMaxAttendees('');
      setTags('');
      setIsOpen(false);
      onEventCreated?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create event",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Calendar className="h-4 w-4 me-2" />
          Create Event
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create an Event</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Event Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the name of your event?"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell people what your event is about..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="event-type">Event Type *</Label>
            <Select value={eventType} onValueChange={setEventType}>
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                {EVENT_TYPES.map((type) => (
                  <SelectItem key={type} value={type.toLowerCase()}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Switch
                id="is-virtual"
                checked={isVirtual}
                onCheckedChange={setIsVirtual}
              />
              <Label htmlFor="is-virtual" className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Virtual Event</span>
              </Label>
            </div>

            {isVirtual ? (
              <div>
                <Label htmlFor="virtual-url">Meeting URL (optional)</Label>
                <Input
                  id="virtual-url"
                  value={virtualUrl}
                  onChange={(e) => setVirtualUrl(e.target.value)}
                  placeholder="https://zoom.us/j/123456789"
                  type="url"
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="location">Location *</Label>
                <div className="relative">
                  <MapPin className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Where will this event take place?"
                    className="ps-10"
                    required={!isVirtual}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="start-date">Start Date & Time *</Label>
              <Input
                id="start-date"
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="end-date">End Date & Time *</Label>
              <Input
                id="end-date"
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                min={startDate || new Date().toISOString().slice(0, 16)}
                required
              />
            </div>
          </div>

          <div>
            <Label htmlFor="max-attendees">Max Attendees (optional)</Label>
            <Input
              id="max-attendees"
              type="number"
              value={maxAttendees}
              onChange={(e) => setMaxAttendees(e.target.value)}
              placeholder="Leave empty for unlimited"
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="tags">Tags (optional)</Label>
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="networking, professional-development, skills (comma-separated)"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creating...' : 'Create Event'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventDialog;
