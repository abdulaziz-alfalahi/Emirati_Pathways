
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Clipboard, CheckCircle, Users } from 'lucide-react';

interface AssessmentStatisticsProps {
  totalAssessments: number;
  activeAssessments: number;
  candidatesAssessed: number;
}

const AssessmentStatistics: React.FC<AssessmentStatisticsProps> = ({
  totalAssessments,
  activeAssessments,
  candidatesAssessed
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Assessments</p>
              <h3 className="text-3xl font-bold">{totalAssessments}</h3>
            </div>
            <div className="p-2 bg-blue-100 rounded-full">
              <Clipboard className="h-6 w-6 text-blue-700" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Assessments</p>
              <h3 className="text-3xl font-bold">{activeAssessments}</h3>
            </div>
            <div className="p-2 bg-green-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-700" />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Candidates Assessed</p>
              <h3 className="text-3xl font-bold">{candidatesAssessed}</h3>
            </div>
            <div className="p-2 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-700" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssessmentStatistics;
