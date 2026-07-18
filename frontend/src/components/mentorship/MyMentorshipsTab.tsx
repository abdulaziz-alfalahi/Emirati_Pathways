
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageCircle, 
  Calendar, 
  Target, 
  Clock, 
  Star,
  Video,
  FileText,
  TrendingUp
} from 'lucide-react';

interface MentorshipRelationship {
  id: string;
  type: 'mentor' | 'mentee';
  name: string;
  title: string;
  company: string;
  startDate: string;
  status: 'active' | 'pending' | 'completed';
  nextSession?: string;
  goals: string[];
  progress: number;
  rating?: number;
  totalSessions: number;
  image?: string;
}

const mockRelationships: MentorshipRelationship[] = [
  {
    id: '1',
    type: 'mentee',
    name: 'Sarah Al-Mahmoud',
    title: 'Senior Data Scientist',
    company: 'Microsoft',
    startDate: '2024-01-15',
    status: 'active',
    nextSession: '2024-12-20T14:00:00',
    goals: ['Machine Learning', 'Career Advancement', 'Leadership Skills'],
    progress: 75,
    rating: 4.9,
    totalSessions: 8
  },
  {
    id: '2',
    type: 'mentor',
    name: 'Ali Al-Rashid',
    title: 'Junior Developer',
    company: 'Tech Startup',
    startDate: '2024-02-01',
    status: 'active',
    nextSession: '2024-12-22T16:00:00',
    goals: ['Frontend Development', 'React Skills', 'Code Reviews'],
    progress: 60,
    totalSessions: 6
  }
];

export const MyMentorshipsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('active');

  const activeMentorships = mockRelationships.filter(r => r.status === 'active');
  const completedMentorships = mockRelationships.filter(r => r.status === 'completed');

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleScheduleSession = (relationshipId: string) => {
    console.log('Scheduling session for:', relationshipId);
    // TODO: Implement session scheduling
  };

  const handleSendMessage = (relationshipId: string) => {
    console.log('Sending message to:', relationshipId);
    // TODO: Implement messaging functionality
  };

  const renderMentorshipCard = (relationship: MentorshipRelationship) => (
    <Card key={relationship.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={relationship.image} alt={relationship.name} />
              <AvatarFallback className="bg-[rgb(var(--pg-primary))/10] text-[rgb(var(--pg-primary))]">
                {relationship.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{relationship.name}</CardTitle>
              <CardDescription>{relationship.title}</CardDescription>
              <p className="text-sm text-muted-foreground">{relationship.company}</p>
            </div>
          </div>
          <Badge 
            variant={relationship.type === 'mentor' ? 'default' : 'secondary'}
            className={relationship.type === 'mentor' ? 'bg-[rgb(var(--pg-primary))]' : ''}
          >
            {relationship.type === 'mentor' ? 'Mentoring' : 'Learning from'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Goals */}
        <div>
          <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
            <Target className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
            Goals
          </h4>
          <div className="flex flex-wrap gap-1">
            {relationship.goals.map((goal, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {goal}
              </Badge>
            ))}
          </div>
        </div>

        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[rgb(var(--pg-accent))]" />
              Progress
            </h4>
            <span className="text-sm text-muted-foreground">{relationship.progress}%</span>
          </div>
          <Progress value={relationship.progress} className="h-2" />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-[rgb(var(--pg-background))] p-3 rounded-lg">
            <div className="text-lg font-semibold text-[rgb(var(--pg-primary))]">
              {relationship.totalSessions}
            </div>
            <div className="text-xs text-muted-foreground">Sessions</div>
          </div>
          <div className="bg-[rgb(var(--pg-background))] p-3 rounded-lg">
            <div className="text-lg font-semibold text-[rgb(var(--pg-secondary))]">
              {relationship.rating ? `${relationship.rating}/5` : 'N/A'}
            </div>
            <div className="text-xs text-muted-foreground">Rating</div>
          </div>
        </div>

        {/* Next Session */}
        {relationship.nextSession && (
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium text-blue-900">
              <Calendar className="h-4 w-4" />
              Next Session
            </div>
            <p className="text-sm text-blue-800 mt-1">
              {formatDate(relationship.nextSession)}
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => handleSendMessage(relationship.id)}
            className="flex-1"
          >
            <MessageCircle className="h-4 w-4 me-2" />
            Message
          </Button>
          <Button 
            size="sm" 
            onClick={() => handleScheduleSession(relationship.id)}
            className="flex-1 bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]"
          >
            <Video className="h-4 w-4 me-2" />
            Schedule
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active">Active Mentorships</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="space-y-6">
          {activeMentorships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {activeMentorships.map(renderMentorshipCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Mentorships</h3>
                <p className="text-muted-foreground mb-4">
                  Start your mentorship journey by finding a mentor or becoming one yourself.
                </p>
                <Button className="bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90]">
                  Find a Mentor
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="space-y-6">
          {completedMentorships.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {completedMentorships.map(renderMentorshipCard)}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Star className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Completed Mentorships</h3>
                <p className="text-muted-foreground">
                  Your completed mentorship relationships will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
