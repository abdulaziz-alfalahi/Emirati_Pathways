import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Clock, 
  Eye, 
  Calendar, 
  CheckCircle, 
  XCircle,
  MessageSquare,
  FileText,
  Briefcase,
  MapPin,
  Phone,
  Mail
} from 'lucide-react';

interface Application {
  id: string;
  jobTitle: string;
  company: string;
  location: string;
  appliedDate: string;
  status: 'pending' | 'reviewed' | 'interview' | 'offer' | 'rejected';
  lastUpdate: string;
  notes?: string;
  interviewDate?: string;
  interviewType?: 'phone' | 'video' | 'in-person';
  contactPerson?: {
    name: string;
    email: string;
    phone?: string;
  };
}

interface ApplicationTrackerProps {
  candidateId?: string;
}

const ApplicationTracker: React.FC<ApplicationTrackerProps> = ({ candidateId }) => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    loadApplications();
  }, [candidateId]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:5001/api/candidate/applications', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setApplications(data.applications || []);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
      // Set mock data for demonstration
      setApplications([
        {
          id: '1',
          jobTitle: 'Senior Software Engineer',
          company: 'ADNOC Digital',
          location: 'Abu Dhabi, UAE',
          appliedDate: '2024-09-10',
          status: 'interview',
          lastUpdate: '2024-09-13',
          interviewDate: '2024-09-16',
          interviewType: 'video',
          contactPerson: {
            name: 'Sarah Al-Mansouri',
            email: 'sarah.almansouri@adnoc.ae',
            phone: '+971 2 123 4567'
          },
          notes: 'Technical interview scheduled with the development team.'
        },
        {
          id: '2',
          jobTitle: 'Data Analyst',
          company: 'Emirates NBD',
          location: 'Dubai, UAE',
          appliedDate: '2024-09-12',
          status: 'reviewed',
          lastUpdate: '2024-09-14',
          notes: 'Application under review by HR department.'
        },
        {
          id: '3',
          jobTitle: 'UX Designer',
          company: 'Careem',
          location: 'Dubai, UAE',
          appliedDate: '2024-09-11',
          status: 'pending',
          lastUpdate: '2024-09-11',
          notes: 'Application submitted successfully.'
        },
        {
          id: '4',
          jobTitle: 'Marketing Specialist',
          company: 'Dubai Tourism',
          location: 'Dubai, UAE',
          appliedDate: '2024-09-09',
          status: 'offer',
          lastUpdate: '2024-09-14',
          contactPerson: {
            name: 'Ahmed Al-Rashid',
            email: 'ahmed.alrashid@dubaitourism.ae'
          },
          notes: 'Congratulations! Job offer received. Please respond by September 20th.'
        },
        {
          id: '5',
          jobTitle: 'Project Manager',
          company: 'DP World',
          location: 'Dubai, UAE',
          appliedDate: '2024-09-08',
          status: 'rejected',
          lastUpdate: '2024-09-12',
          notes: 'Thank you for your interest. We have decided to move forward with another candidate.'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'reviewed':
        return <Eye className="h-4 w-4 text-blue-500" />;
      case 'interview':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'offer':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'reviewed':
        return 'bg-blue-100 text-blue-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offer':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'Pending Review';
      case 'reviewed':
        return 'Under Review';
      case 'interview':
        return 'Interview Scheduled';
      case 'offer':
        return 'Offer Received';
      case 'rejected':
        return 'Not Selected';
      default:
        return status;
    }
  };

  const filterApplications = (status?: string) => {
    if (!status || status === 'all') return applications;
    return applications.filter(app => app.status === status);
  };

  const getTabCount = (status?: string) => {
    return filterApplications(status).length;
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Application Tracker</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading your applications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderApplicationCard = (application: Application) => (
    <Card key={application.id} className="mb-4">
      <CardContent className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h3 className="text-lg font-semibold">{application.jobTitle}</h3>
              <Badge className={getStatusColor(application.status)}>
                <div className="flex items-center space-x-1">
                  {getStatusIcon(application.status)}
                  <span>{getStatusText(application.status)}</span>
                </div>
              </Badge>
            </div>
            <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
              <div className="flex items-center space-x-1">
                <Briefcase className="h-4 w-4" />
                <span>{application.company}</span>
              </div>
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{application.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Applied Date</p>
            <p className="font-medium">{new Date(application.appliedDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Last Update</p>
            <p className="font-medium">{new Date(application.lastUpdate).toLocaleDateString()}</p>
          </div>
        </div>

        {application.interviewDate && (
          <div className="bg-purple-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              <h4 className="font-medium text-purple-800">Interview Scheduled</h4>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p><strong>Date:</strong> {new Date(application.interviewDate).toLocaleDateString()}</p>
              <p><strong>Type:</strong> {application.interviewType}</p>
            </div>
          </div>
        )}

        {application.contactPerson && (
          <div className="bg-blue-50 rounded-lg p-4 mb-4">
            <h4 className="font-medium text-blue-800 mb-2">Contact Person</h4>
            <div className="space-y-1 text-sm">
              <p><strong>Name:</strong> {application.contactPerson.name}</p>
              <div className="flex items-center space-x-1">
                <Mail className="h-4 w-4 text-blue-600" />
                <span>{application.contactPerson.email}</span>
              </div>
              {application.contactPerson.phone && (
                <div className="flex items-center space-x-1">
                  <Phone className="h-4 w-4 text-blue-600" />
                  <span>{application.contactPerson.phone}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {application.notes && (
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-4 w-4 text-gray-600" />
              <h4 className="font-medium text-gray-800">Notes</h4>
            </div>
            <p className="text-sm text-gray-700">{application.notes}</p>
          </div>
        )}

        <div className="flex space-x-2">
          {application.status === 'interview' && (
            <Button size="sm">
              <Calendar className="h-4 w-4 mr-2" />
              View Interview Details
            </Button>
          )}
          {application.status === 'offer' && (
            <Button size="sm" className="bg-green-600 hover:bg-green-700">
              <CheckCircle className="h-4 w-4 mr-2" />
              Respond to Offer
            </Button>
          )}
          <Button variant="outline" size="sm">
            <MessageSquare className="h-4 w-4 mr-2" />
            Contact Employer
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Application Tracker</CardTitle>
        <CardDescription>
          Track the status of your job applications
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="all">All ({getTabCount()})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({getTabCount('pending')})</TabsTrigger>
            <TabsTrigger value="reviewed">Reviewed ({getTabCount('reviewed')})</TabsTrigger>
            <TabsTrigger value="interview">Interview ({getTabCount('interview')})</TabsTrigger>
            <TabsTrigger value="offer">Offers ({getTabCount('offer')})</TabsTrigger>
            <TabsTrigger value="rejected">Rejected ({getTabCount('rejected')})</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {applications.length > 0 ? (
              applications.map(renderApplicationCard)
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
                <p className="text-muted-foreground">
                  Start applying to jobs to track your applications here.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="mt-6">
            {filterApplications('pending').map(renderApplicationCard)}
          </TabsContent>

          <TabsContent value="reviewed" className="mt-6">
            {filterApplications('reviewed').map(renderApplicationCard)}
          </TabsContent>

          <TabsContent value="interview" className="mt-6">
            {filterApplications('interview').map(renderApplicationCard)}
          </TabsContent>

          <TabsContent value="offer" className="mt-6">
            {filterApplications('offer').map(renderApplicationCard)}
          </TabsContent>

          <TabsContent value="rejected" className="mt-6">
            {filterApplications('rejected').map(renderApplicationCard)}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ApplicationTracker;

