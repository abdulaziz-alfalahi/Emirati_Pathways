
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Users, MessageCircle, UserPlus, Star } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { VirtualEventsService } from '@/services/virtualEventsService';

interface AttendeeProfile {
  id: string;
  name: string;
  avatar?: string;
  title: string;
  company: string;
  skills: string[];
  interests: string[];
  experience_level: string;
  industry: string;
  match_score: number;
  is_connected: boolean;
}

interface AttendeeMatchingProps {
  eventId: string;
}

const AttendeeMatching: React.FC<AttendeeMatchingProps> = ({ eventId }) => {
  const [matches, setMatches] = useState<AttendeeProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAttendee, setSelectedAttendee] = useState<AttendeeProfile | null>(null);

  useEffect(() => {
    loadMatches();
  }, [eventId]);

  const loadMatches = async () => {
    try {
      setIsLoading(true);
      // In a real implementation, this would use a matching algorithm
      // based on user skills, interests, and goals
      const mockMatches: AttendeeProfile[] = [
        {
          id: '1',
          name: 'Ahmed Al-Rashid',
          title: 'Software Engineer',
          company: 'TechCorp',
          skills: ['React', 'Node.js', 'AWS'],
          interests: ['AI/ML', 'Cloud Computing', 'Startups'],
          experience_level: 'Mid-level',
          industry: 'Technology',
          match_score: 92,
          is_connected: false
        },
        {
          id: '2',
          name: 'Fatima Hassan',
          title: 'Product Manager',
          company: 'InnovateCo',
          skills: ['Product Strategy', 'Agile', 'Analytics'],
          interests: ['Product Design', 'User Research', 'Growth'],
          experience_level: 'Senior',
          industry: 'Technology',
          match_score: 87,
          is_connected: false
        },
        {
          id: '3',
          name: 'Omar Khalil',
          title: 'Data Scientist',
          company: 'DataSolutions',
          skills: ['Python', 'Machine Learning', 'SQL'],
          interests: ['Deep Learning', 'NLP', 'Big Data'],
          experience_level: 'Senior',
          industry: 'Technology',
          match_score: 84,
          is_connected: true
        }
      ];
      setMatches(mockMatches);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load attendee matches",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConnect = async (attendeeId: string) => {
    try {
      await VirtualEventsService.createNetworkingConnection(
        eventId,
        attendeeId,
        "I'd like to connect and discuss our shared interests!"
      );
      
      setMatches(prev => 
        prev.map(match => 
          match.id === attendeeId 
            ? { ...match, is_connected: true }
            : match
        )
      );

      toast({
        title: "Connection Request Sent",
        description: "Your connection request has been sent successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send connection request",
        variant: "destructive",
      });
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50';
    if (score >= 80) return 'text-blue-600 bg-blue-50';
    if (score >= 70) return 'text-amber-600 bg-amber-50';
    return 'text-gray-600 bg-gray-50';
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
        <CardTitle className="flex items-center">
          <Users className="h-5 w-5 mr-2" />
          Suggested Connections
        </CardTitle>
        <CardDescription>
          Connect with attendees who share your interests and professional background
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {matches.map((attendee) => (
            <div key={attendee.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex space-x-3">
                  <Avatar>
                    <AvatarImage src={attendee.avatar} />
                    <AvatarFallback>
                      {attendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium">{attendee.name}</h3>
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${getMatchScoreColor(attendee.match_score)}`}>
                        <Star className="h-3 w-3 inline mr-1" />
                        {attendee.match_score}% match
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {attendee.title} at {attendee.company}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {attendee.skills.slice(0, 3).map((skill) => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {attendee.skills.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{attendee.skills.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setSelectedAttendee(attendee)}
                      >
                        View Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{selectedAttendee?.name}</DialogTitle>
                      </DialogHeader>
                      {selectedAttendee && (
                        <div className="space-y-4">
                          <div className="flex items-center space-x-3">
                            <Avatar className="h-16 w-16">
                              <AvatarImage src={selectedAttendee.avatar} />
                              <AvatarFallback className="text-lg">
                                {selectedAttendee.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <h3 className="text-lg font-semibold">{selectedAttendee.name}</h3>
                              <p className="text-muted-foreground">
                                {selectedAttendee.title} at {selectedAttendee.company}
                              </p>
                              <Badge variant="outline">{selectedAttendee.experience_level}</Badge>
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium mb-2">Skills</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedAttendee.skills.map((skill) => (
                                <Badge key={skill} variant="secondary">
                                  {skill}
                                </Badge>
                              ))}
                            </div>
                          </div>

                          <div>
                            <h4 className="font-medium mb-2">Interests</h4>
                            <div className="flex flex-wrap gap-1">
                              {selectedAttendee.interests.map((interest) => (
                                <Badge key={interest} variant="outline">
                                  {interest}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  {attendee.is_connected ? (
                    <Button variant="outline" size="sm" disabled>
                      <MessageCircle className="h-4 w-4 mr-1" />
                      Connected
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      onClick={() => handleConnect(attendee.id)}
                    >
                      <UserPlus className="h-4 w-4 mr-1" />
                      Connect
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendeeMatching;
