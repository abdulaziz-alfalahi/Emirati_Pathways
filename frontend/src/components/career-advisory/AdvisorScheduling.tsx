
import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/context/AuthContext';
import { getAdvisors, fetchCareerAdvisors } from '@/services/careerAdvisory/advisoryService';
import { scheduleAdvisorySession } from '@/services/careerAdvisory/advisorySessionService';
import { CareerAdvisor } from '@/types/careerAdvisory';

const AdvisorScheduling: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [advisors, setAdvisors] = useState<CareerAdvisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAdvisor, setSelectedAdvisor] = useState<string>(searchParams.get('advisor') || '');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [topic, setTopic] = useState<string>('');
  const [details, setDetails] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadAdvisors = async () => {
      try {
        const data = await getAdvisors();
        setAdvisors(data);
      } catch (error) {
        console.error('Error loading advisors:', error);
        toast({
          title: 'Error',
          description: 'Failed to load career advisors',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadAdvisors();
  }, [toast]);

  const handleScheduleSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedAdvisor || !selectedDate || !selectedTime || !topic) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Combine date and time
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const scheduledDate = new Date(selectedDate);
      scheduledDate.setHours(hours, minutes);

      await scheduleAdvisorySession(
        user.id,
        selectedAdvisor,
        scheduledDate,
        topic,
        details
      );

      toast({
        title: 'Success',
        description: 'Your career advisory session has been scheduled',
      });
      
      navigate('/career-advisory');
    } catch (error) {
      console.error('Error scheduling session:', error);
      toast({
        title: 'Error',
        description: 'Failed to schedule session',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const availableTimes = [
    '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00'
  ];

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Schedule a Career Advisory Session</CardTitle>
      </CardHeader>
      <form onSubmit={handleScheduleSession}>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="advisor">Select a Career Advisor</Label>
            <Select value={selectedAdvisor} onValueChange={setSelectedAdvisor} required>
              <SelectTrigger id="advisor">
                <SelectValue placeholder="Select an advisor" />
              </SelectTrigger>
              <SelectContent>
                {advisors.map(advisor => (
                  <SelectItem key={advisor.id} value={advisor.id}>
                    {advisor.user_profiles?.full_name || 'Advisor'} - {advisor.specialization}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Select Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-start font-normal"
                  id="date"
                >
                  <CalendarIcon className="me-2 h-4 w-4" />
                  {selectedDate ? (
                    format(selectedDate, 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  initialFocus
                  disabled={(date) => {
                    // Disable dates in the past and weekends
                    const now = new Date();
                    now.setHours(0, 0, 0, 0);
                    const day = date.getDay();
                    return date < now || day === 0 || day === 6;
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="time">Select Time</Label>
            <Select value={selectedTime} onValueChange={setSelectedTime} disabled={!selectedDate} required>
              <SelectTrigger id="time">
                <SelectValue placeholder="Select a time">
                  {selectedTime ? (
                    <div className="flex items-center">
                      <Clock className="me-2 h-4 w-4" />
                      {selectedTime}
                    </div>
                  ) : (
                    "Select a time"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableTimes.map(time => (
                  <SelectItem key={time} value={time}>
                    <div className="flex items-center">
                      <Clock className="me-2 h-4 w-4" />
                      {time}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="topic">Topic</Label>
            <Input 
              id="topic" 
              value={topic} 
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. Resume Review, Career Change Advice"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">Details</Label>
            <Textarea
              id="details"
              value={details}
              onChange={e => setDetails(e.target.value)}
              placeholder="Share more details about what you'd like to discuss in this session"
              rows={4}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? 'Scheduling...' : 'Schedule Session'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default AdvisorScheduling;
