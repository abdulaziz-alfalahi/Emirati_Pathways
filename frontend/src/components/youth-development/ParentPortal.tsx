
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, FileText, MessageCircle, Shield, Trophy, TrendingUp, Users, Bell } from 'lucide-react';

export const ParentPortal: React.FC = () => {
  const childProgress = {
    name: 'Ahmed',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
    currentPrograms: [
      { name: 'Young Entrepreneurs Program', progress: 75, nextSession: '2024-12-15' },
      { name: 'Digital Arts Workshop', progress: 40, nextSession: '2024-12-12' }
    ],
    achievements: [
      { title: 'Leadership Pioneer', earned: true, date: '2024-11-20' },
      { title: 'Innovation Star', earned: true, date: '2024-11-15' },
      { title: 'Community Hero', earned: false, progress: 70 }
    ],
    upcomingEvents: [
      { name: 'Parent-Child Innovation Workshop', date: '2024-12-20', type: 'workshop' },
      { name: 'Program Graduation Ceremony', date: '2024-12-30', type: 'ceremony' }
    ]
  };

  const safetyGuidelines = [
    'All programs are supervised by certified youth coordinators',
    'Background checks completed for all staff and volunteers',
    'Emergency contact protocols in place for all activities',
    'Safe transportation arrangements for off-site programs',
    'Regular health and safety assessments conducted'
  ];

  const communicationLogs = [
    { date: '2024-11-28', type: 'update', message: 'Ahmed showed excellent leadership in today\'s group project' },
    { date: '2024-11-25', type: 'reminder', message: 'Parent-teacher conference scheduled for December 5th' },
    { date: '2024-11-20', type: 'achievement', message: 'Congratulations! Ahmed earned the Leadership Pioneer badge' }
  ];

  return (
    <div className="space-y-6">
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="safety">Safety & Guidelines</TabsTrigger>
          <TabsTrigger value="communication">Communication</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Child Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Avatar className="h-12 w-12">
                  <AvatarImage src={childProgress.avatar} />
                  <AvatarFallback>AH</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl">{childProgress.name}'s Dashboard</div>
                  <CardDescription>Track your child's development journey</CardDescription>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center">
                  <Trophy className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
                  <div className="text-2xl font-bold text-ehrdc-teal">
                    {childProgress.achievements.filter(a => a.earned).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Achievements Earned</div>
                </div>
                <div className="text-center">
                  <Users className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
                  <div className="text-2xl font-bold text-ehrdc-teal">{childProgress.currentPrograms.length}</div>
                  <div className="text-sm text-muted-foreground">Active Programs</div>
                </div>
                <div className="text-center">
                  <Calendar className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
                  <div className="text-2xl font-bold text-ehrdc-teal">{childProgress.upcomingEvents.length}</div>
                  <div className="text-sm text-muted-foreground">Upcoming Events</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Overview Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
                  Current Programs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {childProgress.currentPrograms.map((program, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{program.name}</span>
                      <span className="text-muted-foreground">{program.progress}%</span>
                    </div>
                    <Progress value={program.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground">
                      Next session: {new Date(program.nextSession).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-ehrdc-teal" />
                  Upcoming Events
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {childProgress.upcomingEvents.map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium text-sm">{event.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(event.date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge variant="outline">{event.type}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Achievement Progress</CardTitle>
              <CardDescription>Track your child's accomplishments and skill development</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {childProgress.achievements.map((achievement, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Trophy className={`h-6 w-6 ${achievement.earned ? 'text-yellow-500' : 'text-gray-400'}`} />
                    <div>
                      <div className="font-medium">{achievement.title}</div>
                      {achievement.earned ? (
                        <div className="text-sm text-muted-foreground">
                          Earned on {new Date(achievement.date).toLocaleDateString()}
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground">
                          {achievement.progress}% complete
                        </div>
                      )}
                    </div>
                  </div>
                  {achievement.earned ? (
                    <Badge className="bg-green-100 text-green-800">Earned</Badge>
                  ) : (
                    <div className="w-24">
                      <Progress value={achievement.progress} className="h-2" />
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="safety" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-ehrdc-teal" />
                Safety & Security Measures
              </CardTitle>
              <CardDescription>Our commitment to your child's safety and well-being</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {safetyGuidelines.map((guideline, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-ehrdc-teal rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-sm">{guideline}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Emergency Contacts & Procedures</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-medium text-sm mb-1">Program Coordinator</div>
                  <div className="text-sm text-muted-foreground">Sarah Al-Mansouri</div>
                  <div className="text-sm text-muted-foreground">+971 XX XXX XXXX</div>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-medium text-sm mb-1">Emergency Hotline</div>
                  <div className="text-sm text-muted-foreground">Available 24/7</div>
                  <div className="text-sm text-muted-foreground">+971 XX XXX XXXX</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-ehrdc-teal" />
                Communication Log
              </CardTitle>
              <CardDescription>Recent updates and messages about your child's progress</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {communicationLogs.map((log, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                    <div className="flex-shrink-0">
                      {log.type === 'achievement' && <Trophy className="h-5 w-5 text-yellow-500" />}
                      {log.type === 'update' && <FileText className="h-5 w-5 text-blue-500" />}
                      {log.type === 'reminder' && <Bell className="h-5 w-5 text-orange-500" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <Badge variant="outline" className="capitalize">{log.type}</Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Send Message</CardTitle>
              <CardDescription>Contact the program coordinators</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full ehrdc-button-primary">
                <MessageCircle className="h-4 w-4 mr-2" />
                Start Conversation
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
