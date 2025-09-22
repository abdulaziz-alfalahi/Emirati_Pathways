
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle, Clock, FileText, Send, User } from 'lucide-react';
import { YouthProgramsList } from './YouthProgramsList';

export const ApplicationSystem: React.FC = () => {
  const [selectedProgram, setSelectedProgram] = useState('');
  const [applicationData, setApplicationData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '',
    school: '',
    grade: '',
    interests: '',
    experience: '',
    motivation: '',
    parentConsent: false
  });

  const applicationSteps = [
    { id: 1, title: 'Personal Information', status: 'completed' },
    { id: 2, title: 'Program Selection', status: 'current' },
    { id: 3, title: 'Essays & Documents', status: 'pending' },
    { id: 4, title: 'Review & Submit', status: 'pending' }
  ];

  const myApplications = [
    {
      id: '1',
      programName: 'Young Leaders Academy',
      appliedDate: '2024-11-15',
      status: 'under_review',
      nextStep: 'Interview scheduled for Dec 1st'
    },
    {
      id: '2',
      programName: 'Digital Innovators Workshop',
      appliedDate: '2024-11-10',
      status: 'accepted',
      nextStep: 'Program starts January 15th'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'current': return <Clock className="h-4 w-4 text-blue-600" />;
      default: return <div className="h-4 w-4 rounded-full bg-gray-300" />;
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="browse" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="browse">Browse Programs</TabsTrigger>
          <TabsTrigger value="apply">Apply Now</TabsTrigger>
          <TabsTrigger value="applications">My Applications</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="mt-6">
          <YouthProgramsList />
        </TabsContent>

        <TabsContent value="apply" className="mt-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Application Progress */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Application Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applicationSteps.map((step, index) => (
                    <div key={step.id} className="flex items-center gap-3">
                      {getStatusIcon(step.status)}
                      <div className="flex-1">
                        <div className="font-medium text-sm">{step.title}</div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {step.status.replace('_', ' ')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Application Form */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Youth Program Application</CardTitle>
                <CardDescription>
                  Complete the form below to apply for youth development programs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="fullName">Full Name *</Label>
                    <Input
                      id="fullName"
                      value={applicationData.fullName}
                      onChange={(e) => setApplicationData({...applicationData, fullName: e.target.value})}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age *</Label>
                    <Input
                      id="age"
                      type="number"
                      value={applicationData.age}
                      onChange={(e) => setApplicationData({...applicationData, age: e.target.value})}
                      placeholder="Your age"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={applicationData.email}
                      onChange={(e) => setApplicationData({...applicationData, email: e.target.value})}
                      placeholder="your.email@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      value={applicationData.phone}
                      onChange={(e) => setApplicationData({...applicationData, phone: e.target.value})}
                      placeholder="+971 XX XXX XXXX"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="school">School/Institution</Label>
                    <Input
                      id="school"
                      value={applicationData.school}
                      onChange={(e) => setApplicationData({...applicationData, school: e.target.value})}
                      placeholder="Your current school"
                    />
                  </div>
                  <div>
                    <Label htmlFor="grade">Grade/Year</Label>
                    <Select>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your grade" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="grade-7">Grade 7</SelectItem>
                        <SelectItem value="grade-8">Grade 8</SelectItem>
                        <SelectItem value="grade-9">Grade 9</SelectItem>
                        <SelectItem value="grade-10">Grade 10</SelectItem>
                        <SelectItem value="grade-11">Grade 11</SelectItem>
                        <SelectItem value="grade-12">Grade 12</SelectItem>
                        <SelectItem value="university">University</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="interests">Areas of Interest</Label>
                  <Textarea
                    id="interests"
                    value={applicationData.interests}
                    onChange={(e) => setApplicationData({...applicationData, interests: e.target.value})}
                    placeholder="Tell us about your interests and hobbies..."
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="motivation">Why do you want to join this program?</Label>
                  <Textarea
                    id="motivation"
                    value={applicationData.motivation}
                    onChange={(e) => setApplicationData({...applicationData, motivation: e.target.value})}
                    placeholder="Share your motivation and goals..."
                    rows={4}
                  />
                </div>

                <Button className="w-full ehrdc-button-primary">
                  <Send className="h-4 w-4 mr-2" />
                  Submit Application
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="applications" className="mt-6">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  My Applications
                </CardTitle>
                <CardDescription>
                  Track the status of your program applications
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {myApplications.map((application) => (
                    <div key={application.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{application.programName}</h3>
                        <Badge className={getStatusColor(application.status)}>
                          {application.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Applied: {new Date(application.appliedDate).toLocaleDateString()}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">{application.nextStep}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
