
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, ExternalLink, FileText, Clock } from 'lucide-react';

const MyApplications: React.FC = () => {
  // Mock data - replace with actual data from your backend
  const applications = [
    {
      id: '1',
      programName: 'Master of Science in Computer Science',
      universityName: 'United Arab Emirates University',
      status: 'under_review',
      submittedDate: '2024-01-15',
      deadline: '2024-02-15',
      requirements: ['Transcripts', 'Letters of Recommendation', 'Personal Statement'],
      completedRequirements: ['Transcripts', 'Personal Statement']
    },
    {
      id: '2',
      programName: 'Bachelor of Architecture',
      universityName: 'American University of Sharjah',
      status: 'incomplete',
      submittedDate: null,
      deadline: '2024-03-01',
      requirements: ['Portfolio', 'Transcripts', 'English Proficiency'],
      completedRequirements: ['Transcripts']
    },
    {
      id: '3',
      programName: 'PhD in Artificial Intelligence',
      universityName: 'Khalifa University',
      status: 'accepted',
      submittedDate: '2023-12-10',
      deadline: '2024-01-30',
      requirements: ['Research Proposal', 'Transcripts', 'Publications'],
      completedRequirements: ['Research Proposal', 'Transcripts', 'Publications']
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'under_review': return 'bg-yellow-100 text-yellow-800';
      case 'incomplete': return 'bg-gray-100 text-gray-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      case 'under_review': return 'Under Review';
      case 'incomplete': return 'Incomplete';
      default: return 'Submitted';
    }
  };

  if (applications.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Applications Yet</h3>
            <p className="text-muted-foreground mb-4">
              Start exploring programs and submit your applications.
            </p>
            <Button>Browse Programs</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {applications.map((application) => (
        <Card key={application.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-1">{application.programName}</h3>
                <p className="text-muted-foreground">{application.universityName}</p>
              </div>
              <Badge className={getStatusColor(application.status)}>
                {getStatusLabel(application.status)}
              </Badge>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="h-4 w-4 me-2" />
                Deadline: {new Date(application.deadline).toLocaleDateString()}
              </div>
              {application.submittedDate && (
                <div className="flex items-center text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 me-2" />
                  Submitted: {new Date(application.submittedDate).toLocaleDateString()}
                </div>
              )}
            </div>

            {/* Requirements Progress */}
            <div className="space-y-3 mb-4">
              <h4 className="font-medium text-sm">Application Requirements</h4>
              <div className="space-y-2">
                {application.requirements.map((requirement) => {
                  const isCompleted = application.completedRequirements.includes(requirement);
                  return (
                    <div key={requirement} className="flex items-center justify-between text-sm">
                      <span className={isCompleted ? 'text-green-700' : 'text-muted-foreground'}>
                        {requirement}
                      </span>
                      <div className={`w-3 h-3 rounded-full ${
                        isCompleted ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                    </div>
                  );
                })}
              </div>
              <div className="text-xs text-muted-foreground">
                {application.completedRequirements.length} of {application.requirements.length} completed
              </div>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 me-1" />
                View Details
              </Button>
              {application.status === 'incomplete' && (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                  Continue Application
                </Button>
              )}
              {application.status === 'accepted' && (
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Accept Offer
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default MyApplications;
