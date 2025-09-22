
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, CheckCircle, XCircle, Calendar, Clock } from 'lucide-react';

interface TraineeAssessmentsProps {
  traineeId: number;
}

// Mock assessment data - in a real app, this would come from an API
const mockAssessmentsData = [
  {
    id: 1,
    title: 'Web Development Skills Assessment',
    date: '2025-03-15',
    score: 87,
    status: 'completed',
    type: 'skills',
    passingScore: 70
  },
  {
    id: 2,
    title: 'Digital Marketing Knowledge Test',
    date: '2025-03-20',
    score: 65,
    status: 'completed',
    type: 'skills',
    passingScore: 70
  },
  {
    id: 3,
    title: 'Leadership Capability Assessment',
    date: '2025-04-10',
    score: null,
    status: 'scheduled',
    type: 'capabilities',
    passingScore: 75
  }
];

const TraineeAssessments: React.FC<TraineeAssessmentsProps> = ({ traineeId }) => {
  // In a real app, you would filter assessments by traineeId
  const traineeAssessments = mockAssessmentsData;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Assessment History</h3>
      
      {traineeAssessments.length > 0 ? (
        traineeAssessments.map(assessment => (
          <Card key={assessment.id} className="p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="font-medium flex items-center">
                  <FileText className="h-4 w-4 mr-2 text-emirati-teal" />
                  {assessment.title}
                </h4>
                <div className="flex items-center mt-1 text-sm text-muted-foreground">
                  <Badge variant="outline" className="mr-2">
                    {assessment.type}
                  </Badge>
                  <Calendar className="h-4 w-4 mr-1" />
                  {new Date(assessment.date).toLocaleDateString()}
                </div>
              </div>
              <AssessmentStatusBadge status={assessment.status} />
            </div>
            
            {assessment.status === 'completed' && (
              <div className="mt-2 border-t pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Score: <strong>{assessment.score}%</strong></span>
                  <div>
                    <Badge className={assessment.score >= assessment.passingScore ? "bg-green-500/10 text-green-700" : "bg-red-500/10 text-red-700"}>
                      {assessment.score >= assessment.passingScore ? (
                        <span className="flex items-center">
                          <CheckCircle className="h-3 w-3 mr-1" /> Passed
                        </span>
                      ) : (
                        <span className="flex items-center">
                          <XCircle className="h-3 w-3 mr-1" /> Failed
                        </span>
                      )}
                    </Badge>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  Passing score: {assessment.passingScore}%
                </div>
              </div>
            )}
            
            {assessment.status === 'scheduled' && (
              <div className="mt-2 border-t pt-2 text-sm flex items-center text-blue-600">
                <Clock className="h-4 w-4 mr-1" />
                Upcoming assessment
              </div>
            )}
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground">No assessments taken</p>
      )}
    </div>
  );
};

const AssessmentStatusBadge = ({ status }: { status: string }) => {
  switch(status) {
    case 'completed':
      return <Badge className="bg-green-500/10 text-green-700">Completed</Badge>;
    case 'scheduled':
      return <Badge className="bg-blue-500/10 text-blue-700">Scheduled</Badge>;
    case 'in-progress':
      return <Badge className="bg-amber-500/10 text-amber-700">In Progress</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

export default TraineeAssessments;
