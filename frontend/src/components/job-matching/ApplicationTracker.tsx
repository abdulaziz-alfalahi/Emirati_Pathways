
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Briefcase, 
  Calendar, 
  MapPin, 
  Building, 
  ExternalLink, 
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  MessageSquare,
  Phone,
  Video,
  Mail,
  Star,
  TrendingUp,
  AlertCircle
} from 'lucide-react';

interface Application {
  id: number;
  title: string;
  company: string;
  location: string;
  appliedDate: string;
  status: 'submitted' | 'reviewed' | 'interview' | 'offer' | 'rejected';
  progress: number;
  nextStep: string;
  salary?: string;
  interviewDate?: string;
  interviewType?: 'phone' | 'video' | 'in-person';
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
  notes?: string;
  matchScore?: number;
}

export const ApplicationTracker: React.FC = () => {
  const [activeTab, setActiveTab] = useState('all');

  const applications: Application[] = [
    {
      id: 1,
      title: 'Senior Software Engineer',
      company: 'Emirates NBD',
      location: 'Dubai',
      appliedDate: '2024-09-10',
      status: 'interview',
      progress: 75,
      nextStep: 'Technical Interview - September 16',
      salary: 'AED 15,000 - 20,000',
      interviewDate: '2024-09-16',
      interviewType: 'video',
      contactPerson: {
        name: 'Sarah Al-Mansouri',
        email: 'sarah.almansouri@emiratesnbd.ae',
        phone: '+971 4 123 4567'
      },
      notes: 'Technical interview with the development team. Focus on React and Node.js experience.',
      matchScore: 92
    },
    {
      id: 2,
      title: 'Digital Marketing Manager',
      company: 'Dubai Tourism',
      location: 'Dubai',
      appliedDate: '2024-09-12',
      status: 'reviewed',
      progress: 50,
      nextStep: 'Awaiting HR Response',
      salary: 'AED 12,000 - 16,000',
      contactPerson: {
        name: 'Ahmed Al-Rashid',
        email: 'ahmed.alrashid@dubaitourism.ae'
      },
      notes: 'Application under review by marketing department.',
      matchScore: 88
    },
    {
      id: 3,
      title: 'Data Scientist',
      company: 'ADNOC',
      location: 'Abu Dhabi',
      appliedDate: '2024-09-08',
      status: 'offer',
      progress: 100,
      nextStep: 'Offer Negotiation',
      salary: 'AED 18,000 - 25,000',
      contactPerson: {
        name: 'Fatima Al-Zahra',
        email: 'fatima.alzahra@adnoc.ae',
        phone: '+971 2 987 6543'
      },
      notes: 'Congratulations! Job offer received. Please respond by September 20th.',
      matchScore: 95
    },
    {
      id: 4,
      title: 'UX Designer',
      company: 'Careem',
      location: 'Dubai',
      appliedDate: '2024-09-05',
      status: 'rejected',
      progress: 100,
      nextStep: 'Application Closed',
      salary: 'AED 10,000 - 14,000',
      notes: 'Thank you for your interest. We have decided to move forward with another candidate.',
      matchScore: 78
    },
    {
      id: 5,
      title: 'Project Manager',
      company: 'DP World',
      location: 'Dubai',
      appliedDate: '2024-09-14',
      status: 'submitted',
      progress: 25,
      nextStep: 'Initial Screening',
      salary: 'AED 16,000 - 22,000',
      notes: 'Application submitted successfully. Initial screening in progress.',
      matchScore: 85
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'interview': return 'bg-blue-100 text-blue-800';
      case 'reviewed': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-gray-100 text-gray-800';
      case 'offer': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'interview': return <Calendar className="h-4 w-4" />;
      case 'reviewed': return <Eye className="h-4 w-4" />;
      case 'submitted': return <Clock className="h-4 w-4" />;
      case 'offer': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getInterviewTypeIcon = (type?: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'in-person': return <Building className="h-4 w-4" />;
      default: return <Calendar className="h-4 w-4" />;
    }
  };

  const filterApplications = (status: string) => {
    if (status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  const getTabCount = (status: string) => {
    return filterApplications(status).length;
  };

  const getOverallStats = () => {
    const total = applications.length;
    const active = applications.filter(app => !['rejected', 'offer'].includes(app.status)).length;
    const interviews = applications.filter(app => app.status === 'interview').length;
    const offers = applications.filter(app => app.status === 'offer').length;
    const avgMatchScore = Math.round(applications.reduce((sum, app) => sum + (app.matchScore || 0), 0) / total);

    return { total, active, interviews, offers, avgMatchScore };
  };

  const stats = getOverallStats();

  const renderApplicationCard = (app: Application) => (
    <Card key={app.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{app.title}</h3>
              {app.matchScore && (
                <Badge variant="outline" className="text-blue-600 border-blue-200">
                  <Star className="h-3 w-3 mr-1" />
                  {app.matchScore}% match
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
              <div className="flex items-center gap-2">
                <Building className="h-4 w-4" />
                {app.company}
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                {app.location}
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Applied {new Date(app.appliedDate).toLocaleDateString()}
              </div>
            </div>
            {app.salary && (
              <div className="text-sm text-green-600 font-medium mb-2">
                💰 {app.salary}
              </div>
            )}
          </div>
          <Badge className={getStatusColor(app.status)}>
            <div className="flex items-center gap-1">
              {getStatusIcon(app.status)}
              <span className="capitalize">{app.status}</span>
            </div>
          </Badge>
        </div>

        {/* Interview Information */}
        {app.status === 'interview' && app.interviewDate && (
          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              {getInterviewTypeIcon(app.interviewType)}
              <span className="font-medium text-blue-800">
                {app.interviewType?.charAt(0).toUpperCase() + app.interviewType?.slice(1)} Interview Scheduled
              </span>
            </div>
            <p className="text-sm text-blue-700">
              📅 {new Date(app.interviewDate).toLocaleDateString()} at {new Date(app.interviewDate).toLocaleTimeString()}
            </p>
          </div>
        )}

        {/* Contact Person */}
        {app.contactPerson && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Contact Person</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {app.contactPerson.name}</p>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-gray-600" />
                <span>{app.contactPerson.email}</span>
              </div>
              {app.contactPerson.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-600" />
                  <span>{app.contactPerson.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium">Application Progress</span>
            <span className="text-sm text-muted-foreground">{app.progress}%</span>
          </div>
          <Progress value={app.progress} className="h-2" />
        </div>

        {app.notes && (
          <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-yellow-600" />
              <span className="font-medium text-yellow-800">Notes</span>
            </div>
            <p className="text-sm text-yellow-700">{app.notes}</p>
          </div>
        )}

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm font-medium">Next Step:</p>
            <p className="text-sm text-muted-foreground">{app.nextStep}</p>
          </div>
          <div className="flex gap-2">
            {app.status === 'interview' && (
              <Button size="sm" variant="outline">
                <Calendar className="h-4 w-4 mr-2" />
                Interview Details
              </Button>
            )}
            {app.contactPerson && (
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-2" />
                Contact
              </Button>
            )}
            <Button size="sm">
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-ehrdc-teal" />
            Application Tracker
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Enhanced Statistics Dashboard */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-ehrdc-teal">{stats.total}</div>
                <div className="text-sm text-muted-foreground">Total Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.active}</div>
                <div className="text-sm text-muted-foreground">Active Applications</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.interviews}</div>
                <div className="text-sm text-muted-foreground">Interviews Scheduled</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.offers}</div>
                <div className="text-sm text-muted-foreground">Job Offers</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{stats.avgMatchScore}%</div>
                <div className="text-sm text-muted-foreground">Avg Match Score</div>
              </CardContent>
            </Card>
          </div>

          {/* Enhanced Tabs with Counts */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All ({getTabCount('all')})</TabsTrigger>
              <TabsTrigger value="submitted">Submitted ({getTabCount('submitted')})</TabsTrigger>
              <TabsTrigger value="reviewed">Reviewed ({getTabCount('reviewed')})</TabsTrigger>
              <TabsTrigger value="interview">Interviews ({getTabCount('interview')})</TabsTrigger>
              <TabsTrigger value="offer">Offers ({getTabCount('offer')})</TabsTrigger>
              <TabsTrigger value="rejected">Rejected ({getTabCount('rejected')})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="mt-6">
              <div className="space-y-4">
                {applications.map(renderApplicationCard)}
              </div>
            </TabsContent>

            <TabsContent value="submitted" className="mt-6">
              <div className="space-y-4">
                {filterApplications('submitted').map(renderApplicationCard)}
              </div>
            </TabsContent>

            <TabsContent value="reviewed" className="mt-6">
              <div className="space-y-4">
                {filterApplications('reviewed').map(renderApplicationCard)}
              </div>
            </TabsContent>

            <TabsContent value="interview" className="mt-6">
              <div className="space-y-4">
                {filterApplications('interview').map(renderApplicationCard)}
              </div>
            </TabsContent>

            <TabsContent value="offer" className="mt-6">
              <div className="space-y-4">
                {filterApplications('offer').map(renderApplicationCard)}
              </div>
            </TabsContent>

            <TabsContent value="rejected" className="mt-6">
              <div className="space-y-4">
                {filterApplications('rejected').map(renderApplicationCard)}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
