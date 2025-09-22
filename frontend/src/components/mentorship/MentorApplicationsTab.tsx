
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  XCircle,
  User,
  Calendar
} from 'lucide-react';

interface MentorApplication {
  id: string;
  type: 'mentor' | 'mentee';
  applicantName: string;
  applicantTitle: string;
  applicantCompany: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedDate: string;
  expertise: string[];
  message: string;
  image?: string;
}

const mockApplications: MentorApplication[] = [
  {
    id: '1',
    type: 'mentee',
    applicantName: 'Layla Al-Rashid',
    applicantTitle: 'Junior Developer',
    applicantCompany: 'Tech Startup',
    status: 'pending',
    submittedDate: '2024-12-15',
    expertise: ['React', 'JavaScript', 'Career Development'],
    message: 'I would love to learn from your experience in software development and career growth.'
  },
  {
    id: '2',
    type: 'mentor',
    applicantName: 'Omar Al-Mansouri',
    applicantTitle: 'Senior Marketing Manager',
    applicantCompany: 'Dubai Chamber',
    status: 'approved',
    submittedDate: '2024-12-10',
    expertise: ['Digital Marketing', 'Brand Strategy', 'Leadership'],
    message: 'I am passionate about mentoring young professionals in marketing and business development.'
  }
];

export const MentorApplicationsTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pending');

  const pendingApplications = mockApplications.filter(app => app.status === 'pending');
  const reviewedApplications = mockApplications.filter(app => app.status !== 'pending');

  const handleApprove = (applicationId: string) => {
    console.log('Approving application:', applicationId);
    // TODO: Implement application approval
  };

  const handleReject = (applicationId: string) => {
    console.log('Rejecting application:', applicationId);
    // TODO: Implement application rejection
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const renderApplicationCard = (application: MentorApplication, showActions = false) => (
    <Card key={application.id} className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={application.image} alt={application.applicantName} />
              <AvatarFallback className="bg-[rgb(var(--pg-primary))/10] text-[rgb(var(--pg-primary))]">
                {application.applicantName.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg">{application.applicantName}</CardTitle>
              <CardDescription>{application.applicantTitle}</CardDescription>
              <p className="text-sm text-muted-foreground">{application.applicantCompany}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge 
              variant={application.type === 'mentor' ? 'default' : 'secondary'}
              className={application.type === 'mentor' ? 'bg-[rgb(var(--pg-primary))]' : ''}
            >
              {application.type === 'mentor' ? 'Wants to Mentor' : 'Seeking Mentor'}
            </Badge>
            <Badge variant="outline" className={getStatusColor(application.status)}>
              {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div>
          <h4 className="text-sm font-medium mb-2">Areas of Interest</h4>
          <div className="flex flex-wrap gap-1">
            {application.expertise.map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium mb-2">Message</h4>
          <p className="text-sm text-muted-foreground">{application.message}</p>
        </div>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Applied on {new Date(application.submittedDate).toLocaleDateString()}</span>
        </div>

        {showActions && application.status === 'pending' && (
          <div className="flex gap-2 pt-2">
            <Button 
              onClick={() => handleApprove(application.id)}
              className="flex-1 bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90]"
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleReject(application.id)}
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">Pending Applications</TabsTrigger>
          <TabsTrigger value="reviewed">Reviewed</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="space-y-6">
          {pendingApplications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pendingApplications.map(app => renderApplicationCard(app, true))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Pending Applications</h3>
                <p className="text-muted-foreground">
                  All mentorship applications have been reviewed.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="reviewed" className="space-y-6">
          {reviewedApplications.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {reviewedApplications.map(app => renderApplicationCard(app, false))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Reviewed Applications</h3>
                <p className="text-muted-foreground">
                  Reviewed applications will appear here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
