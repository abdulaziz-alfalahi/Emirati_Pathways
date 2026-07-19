
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Calendar, CheckCircle, Clock, AlertCircle, FileText, Users } from 'lucide-react';

export const ApplicationTimeline: React.FC = () => {
  const [selectedYear, setSelectedYear] = useState('2024-2025');

  const timelineData = [
    {
      id: '1',
      title: 'Research Universities & Programs',
      description: 'Explore universities, programs, and admission requirements',
      deadline: 'September 2024',
      status: 'completed' as const,
      tasks: [
        'Research target universities',
        'Compare programs',
        'Check admission requirements',
        'Attend virtual info sessions'
      ],
      documents: [],
      tips: 'Start early and create a spreadsheet to track your options'
    },
    {
      id: '2',
      title: 'Standardized Tests',
      description: 'Complete required standardized tests (SAT, TOEFL, IELTS, etc.)',
      deadline: 'October - December 2024',
      status: 'in_progress' as const,
      tasks: [
        'Register for SAT/ACT',
        'Take TOEFL/IELTS',
        'Complete subject-specific tests',
        'Send official scores'
      ],
      documents: ['Test Registration', 'Score Reports'],
      tips: 'Allow time for retakes if needed. Many universities accept tests taken through January.'
    },
    {
      id: '3',
      title: 'Application Materials',
      description: 'Prepare and submit all required application documents',
      deadline: 'November 2024 - January 2025',
      status: 'upcoming' as const,
      tasks: [
        'Complete application forms',
        'Write personal statements',
        'Request transcripts',
        'Gather recommendation letters'
      ],
      documents: ['Transcripts', 'Personal Statement', 'Recommendation Letters', 'CV/Resume'],
      tips: 'Give recommenders at least 6-8 weeks notice. Keep copies of all documents.'
    },
    {
      id: '4',
      title: 'Scholarship Applications',
      description: 'Apply for scholarships and financial aid',
      deadline: 'December 2024 - February 2025',
      status: 'upcoming' as const,
      tasks: [
        'Research scholarship opportunities',
        'Complete FAFSA (if applicable)',
        'Submit scholarship essays',
        'Apply for UAE government scholarships'
      ],
      documents: ['Financial Documents', 'Scholarship Essays', 'FAFSA'],
      tips: 'Apply for multiple scholarships. Some have earlier deadlines than admissions.'
    },
    {
      id: '5',
      title: 'Submit Applications',
      description: 'Final submission of all university applications',
      deadline: 'January - March 2025',
      status: 'upcoming' as const,
      tasks: [
        'Submit early decision applications',
        'Submit regular decision applications',
        'Pay application fees',
        'Confirm receipt of materials'
      ],
      documents: ['Completed Applications', 'Payment Confirmations'],
      tips: 'Submit applications early to avoid technical issues. Keep confirmation emails.'
    },
    {
      id: '6',
      title: 'Interviews & Follow-ups',
      description: 'Complete interviews and provide additional information',
      deadline: 'February - April 2025',
      status: 'upcoming' as const,
      tasks: [
        'Schedule interviews',
        'Prepare for interviews',
        'Submit additional materials if requested',
        'Send thank you notes'
      ],
      documents: ['Interview Schedules', 'Additional Materials'],
      tips: 'Practice common interview questions. Research the university thoroughly.'
    },
    {
      id: '7',
      title: 'Admissions Decisions',
      description: 'Receive and respond to university decisions',
      deadline: 'March - May 2025',
      status: 'upcoming' as const,
      tasks: [
        'Receive admission decisions',
        'Compare financial aid packages',
        'Visit accepted universities',
        'Make final decision'
      ],
      documents: ['Admission Letters', 'Financial Aid Offers'],
      tips: 'Take time to carefully consider all offers. Visit campuses if possible.'
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'upcoming':
        return <AlertCircle className="h-5 w-5 text-blue-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'upcoming':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgress = () => {
    const completed = timelineData.filter(item => item.status === 'completed').length;
    return (completed / timelineData.length) * 100;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-blue-600 mb-2">Application Timeline</h2>
              <p className="text-muted-foreground">Track your university application progress</p>
            </div>
            <div className="text-end">
              <div className="text-sm text-muted-foreground mb-2">Overall Progress</div>
              <div className="flex items-center gap-4">
                <Progress value={getProgress()} className="w-32" />
                <span className="text-sm font-medium">{Math.round(getProgress())}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Timeline */}
      <div className="space-y-6">
        {timelineData.map((item, index) => (
          <Card key={item.id} className="relative">
            {/* Timeline connector */}
            {index < timelineData.length - 1 && (
              <div className="absolute start-6 top-16 w-0.5 h-full bg-gray-200 -z-10"></div>
            )}
            
            <CardContent className="p-6">
              <div className="flex gap-6">
                {/* Status Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-full bg-white border-2 border-gray-200 flex items-center justify-center">
                    {getStatusIcon(item.status)}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{item.title}</h3>
                        <Badge className={getStatusColor(item.status)}>
                          {item.status.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-4">{item.description}</p>
                      
                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">Deadline: {item.deadline}</span>
                        </div>
                      </div>

                      {/* Tasks */}
                      <div className="mb-4">
                        <h4 className="font-medium mb-2 text-sm">Tasks</h4>
                        <ul className="grid md:grid-cols-2 gap-1">
                          {item.tasks.map((task, taskIndex) => (
                            <li key={taskIndex} className="flex items-center gap-2 text-sm">
                              <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Documents */}
                      {item.documents.length > 0 && (
                        <div className="mb-4">
                          <h4 className="font-medium mb-2 text-sm">Required Documents</h4>
                          <div className="flex flex-wrap gap-2">
                            {item.documents.map((doc, docIndex) => (
                              <Badge key={docIndex} variant="outline" className="text-xs">
                                <FileText className="h-3 w-3 me-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-start gap-2">
                          <div className="w-4 h-4 bg-blue-600 rounded-full flex items-center justify-center mt-0.5">
                            <span className="text-white text-xs font-bold">!</span>
                          </div>
                          <p className="text-sm text-blue-800">{item.tips}</p>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col gap-2 lg:w-48">
                      <Button 
                        className="w-full bg-blue-600 hover:bg-blue-700"
                        disabled={item.status === 'completed'}
                      >
                        {item.status === 'completed' ? 'Completed' : 'Start Tasks'}
                      </Button>
                      <Button variant="outline" className="w-full">
                        View Resources
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-600" />
            Need Help?
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Calendar className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Schedule Counseling</span>
              <span className="text-xs text-muted-foreground">Get personalized guidance</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <FileText className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Document Checklist</span>
              <span className="text-xs text-muted-foreground">Download comprehensive list</span>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2">
              <Users className="h-6 w-6 text-blue-600" />
              <span className="font-medium">Connect with Alumni</span>
              <span className="text-xs text-muted-foreground">Learn from experiences</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
