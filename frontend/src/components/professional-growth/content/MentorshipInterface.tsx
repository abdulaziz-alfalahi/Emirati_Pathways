
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Users, Star, MessageCircle, Video, Calendar, Award } from 'lucide-react';

export interface MentorProfile {
  id: string;
  name: string;
  title: string;
  company: string;
  expertise: string[];
  rating: number;
  totalMentees: number;
  yearsExperience: number;
  avatar?: string;
  bio: string;
  availability: 'available' | 'limited' | 'unavailable';
}

export interface MatchingCriteria {
  skillAreas: string[];
  careerLevel: string;
  industries: string[];
  goals: string[];
  matchScore?: number;
}

export interface ConnectionStatus {
  status: 'pending' | 'connected' | 'completed' | 'not_connected';
  startDate?: string;
  endDate?: string;
  sessionsCompleted: number;
  totalSessions: number;
}

export interface CommunicationTool {
  type: 'chat' | 'video' | 'email';
  label: string;
  icon: React.ComponentType<any>;
  available: boolean;
}

export interface MentorshipProgress {
  goalsSet: number;
  goalsAchieved: number;
  skillsImproved: string[];
  feedback: {
    rating: number;
    comments: string;
  }[];
}

export interface FeedbackInterface {
  rating: number;
  comment: string;
  date: string;
}

export interface MentorshipInterface {
  mentorProfiles: MentorProfile[];
  matchingCriteria: MatchingCriteria;
  connectionStatus?: ConnectionStatus;
  communicationTools: CommunicationTool[];
  progressTracking?: MentorshipProgress;
  feedbackSystem?: FeedbackInterface[];
}

const availabilityColors = {
  available: 'bg-green-100 text-green-800',
  limited: 'bg-yellow-100 text-yellow-800',
  unavailable: 'bg-red-100 text-red-800'
};

export const MentorshipInterface: React.FC<MentorshipInterface> = ({
  mentorProfiles,
  matchingCriteria,
  connectionStatus,
  communicationTools,
  progressTracking,
  feedbackSystem
}) => {
  const [selectedMentor, setSelectedMentor] = useState<MentorProfile | null>(null);
  const [activeView, setActiveView] = useState<'discover' | 'connected' | 'progress'>('discover');

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex space-x-1 bg-muted p-1 rounded-lg">
        <button
          onClick={() => setActiveView('discover')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeView === 'discover' 
              ? 'bg-white shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Discover Mentors
        </button>
        <button
          onClick={() => setActiveView('connected')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeView === 'connected' 
              ? 'bg-white shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Mentors
        </button>
        <button
          onClick={() => setActiveView('progress')}
          className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
            activeView === 'progress' 
              ? 'bg-white shadow-sm text-foreground' 
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Progress
        </button>
      </div>

      {/* Discover Mentors View */}
      {activeView === 'discover' && (
        <div className="space-y-6">
          {/* Matching Criteria */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Your Matching Criteria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Skill Areas</h4>
                  <div className="flex flex-wrap gap-1">
                    {matchingCriteria.skillAreas.map((skill) => (
                      <Badge key={skill} variant="secondary">{skill}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Industries</h4>
                  <div className="flex flex-wrap gap-1">
                    {matchingCriteria.industries.map((industry) => (
                      <Badge key={industry} variant="outline">{industry}</Badge>
                    ))}
                  </div>
                </div>
              </div>
              {matchingCriteria.matchScore && (
                <div className="mt-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>Match Score</span>
                    <span>{matchingCriteria.matchScore}%</span>
                  </div>
                  <Progress value={matchingCriteria.matchScore} />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mentor Profiles */}
          <div className="grid gap-4">
            {mentorProfiles.map((mentor) => (
              <Card key={mentor.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-16 w-16">
                      <AvatarImage src={mentor.avatar} alt={mentor.name} />
                      <AvatarFallback>{mentor.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-lg">{mentor.name}</h3>
                          <p className="text-muted-foreground">{mentor.title} at {mentor.company}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <div className="flex">{renderStars(mentor.rating)}</div>
                            <span className="text-sm text-muted-foreground">
                              ({mentor.totalMentees} mentees)
                            </span>
                          </div>
                        </div>
                        <Badge className={availabilityColors[mentor.availability]}>
                          {mentor.availability}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                        {mentor.bio}
                      </p>
                      
                      <div className="flex flex-wrap gap-1 mt-3">
                        {mentor.expertise.slice(0, 3).map((skill) => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {mentor.expertise.length > 3 && (
                          <Badge variant="secondary" className="text-xs">
                            +{mentor.expertise.length - 3} more
                          </Badge>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-4">
                        <span className="text-sm text-muted-foreground">
                          {mentor.yearsExperience} years experience
                        </span>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">
                            View Profile
                          </Button>
                          <Button size="sm" disabled={mentor.availability === 'unavailable'}>
                            Connect
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Connected Mentors View */}
      {activeView === 'connected' && connectionStatus && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active Mentorship</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Sessions Completed</span>
                  <span className="font-medium">
                    {connectionStatus.sessionsCompleted}/{connectionStatus.totalSessions}
                  </span>
                </div>
                <Progress 
                  value={(connectionStatus.sessionsCompleted / connectionStatus.totalSessions) * 100} 
                />
                
                <div className="flex flex-wrap gap-2 mt-4">
                  {communicationTools.map((tool) => {
                    const IconComponent = tool.icon;
                    return (
                      <Button
                        key={tool.type}
                        variant="outline"
                        size="sm"
                        disabled={!tool.available}
                        className="flex items-center gap-2"
                      >
                        <IconComponent className="h-4 w-4" />
                        {tool.label}
                      </Button>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Progress View */}
      {activeView === 'progress' && progressTracking && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Mentorship Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Goals Achievement</h4>
                  <div className="text-2xl font-bold text-[rgb(var(--pg-secondary))]">
                    {progressTracking.goalsAchieved}/{progressTracking.goalsSet}
                  </div>
                  <Progress 
                    value={(progressTracking.goalsAchieved / progressTracking.goalsSet) * 100} 
                    className="mt-2"
                  />
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Skills Improved</h4>
                  <div className="flex flex-wrap gap-1">
                    {progressTracking.skillsImproved.map((skill) => (
                      <Badge key={skill} className="bg-green-100 text-green-800">
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
