
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, Calendar, Clock, Download, Share2, Bell, CheckCircle, AlertCircle } from 'lucide-react';

export const CertificationTracking: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const certifications = [
    {
      id: '1',
      name: 'AWS Solutions Architect - Associate',
      status: 'Active',
      issueDate: '2023-08-15',
      expiryDate: '2026-08-15',
      certificateNumber: 'AWS-SAA-C03-2023-08-001',
      provider: 'Amazon Web Services',
      digitalBadgeUrl: '#',
      verificationUrl: '#',
      creditsEarned: 35,
      renewalRequired: false,
      daysUntilExpiry: 645
    },
    {
      id: '2',
      name: 'Project Management Professional (PMP)',
      status: 'Renewal Due',
      issueDate: '2021-03-10',
      expiryDate: '2024-03-10',
      certificateNumber: 'PMP-2021-03-00123',
      provider: 'Project Management Institute',
      digitalBadgeUrl: '#',
      verificationUrl: '#',
      creditsEarned: 45,
      renewalRequired: true,
      daysUntilExpiry: 15
    },
    {
      id: '3',
      name: 'CFA Level 1',
      status: 'In Progress',
      targetDate: '2024-06-15',
      provider: 'CFA Institute',
      studyProgress: 65,
      hoursStudied: 156,
      targetHours: 300,
      nextMilestone: 'Ethics Section'
    }
  ];

  const achievements = [
    {
      id: '1',
      title: 'Cloud Expert',
      description: 'Earned 3 AWS certifications',
      badgeIcon: '☁️',
      earnedDate: '2023-12-01',
      category: 'Cloud Computing'
    },
    {
      id: '2',
      title: 'Early Adopter',
      description: 'First 100 users to join the platform',
      badgeIcon: '🚀',
      earnedDate: '2023-01-15',
      category: 'Platform'
    },
    {
      id: '3',
      title: 'Study Streak',
      description: '30 consecutive days of study',
      badgeIcon: '🔥',
      earnedDate: '2023-11-20',
      category: 'Study Habits'
    }
  ];

  const upcomingRenewals = [
    {
      certification: 'PMP',
      expiryDate: '2024-03-10',
      daysLeft: 15,
      status: 'urgent'
    },
    {
      certification: 'CISSP',
      expiryDate: '2024-08-22',
      daysLeft: 180,
      status: 'upcoming'
    }
  ];

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      'Active': 'bg-green-100 text-green-800',
      'Renewal Due': 'bg-red-100 text-red-800',
      'In Progress': 'bg-blue-100 text-blue-800',
      'Expired': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Certification Tracking</h2>
          <p className="text-muted-foreground">Manage your certifications, track progress, and stay on top of renewals</p>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          <TabsTrigger value="certifications">My Certifications</TabsTrigger>
          <TabsTrigger value="progress">Study Progress</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {/* Quick Stats */}
          <div className="grid md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">5</div>
                <div className="text-sm text-muted-foreground">Active Certifications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">2</div>
                <div className="text-sm text-muted-foreground">In Progress</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">1</div>
                <div className="text-sm text-muted-foreground">Renewal Due</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <div className="text-2xl font-bold">92%</div>
                <div className="text-sm text-muted-foreground">Success Rate</div>
              </CardContent>
            </Card>
          </div>

          {/* Upcoming Renewals */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Upcoming Renewals
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {upcomingRenewals.map((renewal, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-medium">{renewal.certification}</div>
                      <div className="text-sm text-muted-foreground">Expires: {renewal.expiryDate}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={renewal.status === 'urgent' ? 'bg-red-100 text-red-800' : 'bg-orange-100 text-orange-800'}>
                        {renewal.daysLeft} days left
                      </Badge>
                      <Button size="sm" variant="outline">Renew</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="certifications" className="space-y-4">
          {certifications.filter(cert => cert.status !== 'In Progress').map((cert) => (
            <Card key={cert.id}>
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{cert.name}</h3>
                        <p className="text-muted-foreground mb-2">{cert.provider}</p>
                        <div className="text-sm text-muted-foreground">
                          Certificate #: {cert.certificateNumber}
                        </div>
                      </div>
                      <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                    </div>

                    <div className="grid md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Issue Date:</span>
                        <div className="text-muted-foreground">{cert.issueDate}</div>
                      </div>
                      <div>
                        <span className="font-medium">Expiry Date:</span>
                        <div className="text-muted-foreground">{cert.expiryDate}</div>
                      </div>
                      <div>
                        <span className="font-medium">Credits Earned:</span>
                        <div className="text-muted-foreground">{cert.creditsEarned} PDUs</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:w-48">
                    <Button size="sm" variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Download Certificate
                    </Button>
                    <Button size="sm" variant="outline">
                      <Share2 className="h-4 w-4 mr-2" />
                      Share Badge
                    </Button>
                    <Button size="sm" variant="outline">
                      Verify Credential
                    </Button>
                    {cert.renewalRequired && (
                      <Button size="sm" className="bg-red-600 hover:bg-red-700">
                        Renew Now
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="progress" className="space-y-4">
          {certifications.filter(cert => cert.status === 'In Progress').map((cert) => (
            <Card key={cert.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg mb-1">{cert.name}</h3>
                    <p className="text-muted-foreground">{cert.provider}</p>
                  </div>
                  <Badge className={getStatusColor(cert.status)}>{cert.status}</Badge>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Study Progress</span>
                      <span>{cert.studyProgress}%</span>
                    </div>
                    <Progress value={cert.studyProgress} className="h-2" />
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Hours Studied:</span>
                      <div className="text-muted-foreground">{cert.hoursStudied} / {cert.targetHours}</div>
                    </div>
                    <div>
                      <span className="font-medium">Target Date:</span>
                      <div className="text-muted-foreground">{cert.targetDate}</div>
                    </div>
                    <div>
                      <span className="font-medium">Next Milestone:</span>
                      <div className="text-muted-foreground">{cert.nextMilestone}</div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm">Continue Studying</Button>
                    <Button size="sm" variant="outline">Update Progress</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((achievement) => (
              <Card key={achievement.id}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{achievement.badgeIcon}</div>
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{achievement.description}</p>
                  <Badge variant="outline">{achievement.category}</Badge>
                  <div className="text-xs text-muted-foreground mt-2">
                    Earned: {achievement.earnedDate}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
