
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, Clock, AlertTriangle, FileText, Calendar, 
  MessageSquare, Upload, Target, TrendingUp 
} from 'lucide-react';

export const ApplicationTracker: React.FC = () => {
  const [activeApplication, setActiveApplication] = useState(null);

  const applications = [
    {
      id: 1,
      program: 'Emirates Future Leaders Program',
      company: 'Emirates Group',
      status: 'In Progress',
      stage: 'Assessment Center',
      progress: 65,
      appliedDate: '2024-01-15',
      nextStep: 'Group Exercise',
      nextStepDate: '2024-02-20',
      documents: {
        cv: { status: 'uploaded', lastUpdated: '2024-01-15' },
        coverLetter: { status: 'uploaded', lastUpdated: '2024-01-15' },
        transcript: { status: 'pending', lastUpdated: null },
        certificates: { status: 'uploaded', lastUpdated: '2024-01-16' }
      },
      timeline: [
        { stage: 'Application Submitted', completed: true, date: '2024-01-15' },
        { stage: 'Initial Screening', completed: true, date: '2024-01-22' },
        { stage: 'Online Assessment', completed: true, date: '2024-02-01' },
        { stage: 'Assessment Center', completed: false, date: '2024-02-20' },
        { stage: 'Final Interview', completed: false, date: 'TBD' },
        { stage: 'Offer Decision', completed: false, date: 'TBD' }
      ]
    },
    {
      id: 2,
      program: 'ADNOC Graduate Development Program',
      company: 'ADNOC',
      status: 'Submitted',
      stage: 'Under Review',
      progress: 25,
      appliedDate: '2024-02-01',
      nextStep: 'Waiting for response',
      nextStepDate: null,
      documents: {
        cv: { status: 'uploaded', lastUpdated: '2024-02-01' },
        coverLetter: { status: 'uploaded', lastUpdated: '2024-02-01' },
        transcript: { status: 'uploaded', lastUpdated: '2024-02-01' },
        certificates: { status: 'pending', lastUpdated: null }
      },
      timeline: [
        { stage: 'Application Submitted', completed: true, date: '2024-02-01' },
        { stage: 'Initial Screening', completed: false, date: 'TBD' },
        { stage: 'Technical Assessment', completed: false, date: 'TBD' },
        { stage: 'Panel Interview', completed: false, date: 'TBD' },
        { stage: 'Offer Decision', completed: false, date: 'TBD' }
      ]
    },
    {
      id: 3,
      program: 'ADCB Banking Graduate Scheme',
      company: 'Abu Dhabi Commercial Bank',
      status: 'Interview Scheduled',
      stage: 'Final Interview',
      progress: 80,
      appliedDate: '2024-01-10',
      nextStep: 'Final Interview',
      nextStepDate: '2024-02-25',
      documents: {
        cv: { status: 'uploaded', lastUpdated: '2024-01-10' },
        coverLetter: { status: 'uploaded', lastUpdated: '2024-01-10' },
        transcript: { status: 'uploaded', lastUpdated: '2024-01-10' },
        certificates: { status: 'uploaded', lastUpdated: '2024-01-10' }
      },
      timeline: [
        { stage: 'Application Submitted', completed: true, date: '2024-01-10' },
        { stage: 'Phone Screening', completed: true, date: '2024-01-18' },
        { stage: 'Online Assessment', completed: true, date: '2024-02-05' },
        { stage: 'Final Interview', completed: false, date: '2024-02-25' },
        { stage: 'Offer Decision', completed: false, date: 'TBD' }
      ]
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Progress': return 'bg-blue-100 text-blue-800';
      case 'Submitted': return 'bg-yellow-100 text-yellow-800';
      case 'Interview Scheduled': return 'bg-green-100 text-green-800';
      case 'Rejected': return 'bg-red-100 text-red-800';
      case 'Offered': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDocumentStatusIcon = (status: string) => {
    switch (status) {
      case 'uploaded': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending': return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'missing': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Dashboard Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Target className="h-8 w-8 text-ehrdc-teal mx-auto mb-2" />
            <div className="text-2xl font-bold text-ehrdc-teal">{applications.length}</div>
            <div className="text-sm text-gray-600">Active Applications</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-green-600">
              {applications.filter(a => a.status === 'Interview Scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Interviews Scheduled</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Clock className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-yellow-600">3</div>
            <div className="text-sm text-gray-600">Pending Responses</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-blue-600">5</div>
            <div className="text-sm text-gray-600">Days to Next Deadline</div>
          </CardContent>
        </Card>
      </div>

      {/* Applications List */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-ehrdc-teal">Your Applications</h2>
        
        {applications.map((application) => (
          <Card key={application.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{application.program}</h3>
                  <p className="text-ehrdc-teal font-medium">{application.company}</p>
                  <p className="text-sm text-gray-600">Applied: {application.appliedDate}</p>
                </div>
                
                <div className="text-right">
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                  <p className="text-sm text-gray-600 mt-1">Stage: {application.stage}</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span>Application Progress</span>
                  <span>{application.progress}%</span>
                </div>
                <Progress value={application.progress} className="h-2" />
              </div>
              
              {/* Next Step */}
              {application.nextStep && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <Calendar className="h-4 w-4 text-blue-600" />
                    <span className="font-medium text-blue-900">Next Step: {application.nextStep}</span>
                  </div>
                  {application.nextStepDate && (
                    <p className="text-sm text-blue-700">Scheduled for: {application.nextStepDate}</p>
                  )}
                </div>
              )}
              
              {/* Documents Status */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Documents Status:</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Object.entries(application.documents).map(([docType, doc]) => (
                    <div key={docType} className="flex items-center gap-2">
                      {getDocumentStatusIcon(doc.status)}
                      <span className="text-sm capitalize">{docType.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Timeline */}
              <div className="mb-4">
                <h4 className="font-medium mb-2">Application Timeline:</h4>
                <div className="space-y-2">
                  {application.timeline.map((step, index) => (
                    <div key={index} className="flex items-center gap-3">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 border-2 border-gray-300 rounded-full"></div>
                      )}
                      <span className={`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`}>
                        {step.stage}
                      </span>
                      {step.date !== 'TBD' && (
                        <span className="text-xs text-gray-500">({step.date})</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <FileText className="h-4 w-4 mr-1" />
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-1" />
                  Upload Documents
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-4 w-4 mr-1" />
                  Contact Recruiter
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
