
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PlusCircle } from 'lucide-react';
import { AssessmentType } from '@/types/assessments';

interface Assessment {
  id: number;
  title: string;
  assessment_type: AssessmentType;
  duration_minutes?: number;
  is_active: boolean;
}

interface AssessmentTableProps {
  assessments: Assessment[];
  isLoading: boolean;
}

const AssessmentTable: React.FC<AssessmentTableProps> = ({ assessments, isLoading }) => {
  const getAssessmentTypeColor = (type: AssessmentType) => {
    switch (type) {
      case 'skills':
        return 'bg-blue-500/10 text-blue-700';
      case 'behaviors':
        return 'bg-green-500/10 text-green-700';
      case 'capabilities':
        return 'bg-purple-500/10 text-purple-700';
      default:
        return 'bg-gray-500/10 text-gray-700';
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Participation</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {assessments.length > 0 ? (
            assessments.map((assessment) => (
              <TableRow key={assessment.id}>
                <TableCell className="font-medium">{assessment.title}</TableCell>
                <TableCell>
                  <Badge className={getAssessmentTypeColor(assessment.assessment_type)}>
                    {assessment.assessment_type}
                  </Badge>
                </TableCell>
                <TableCell>
                  {assessment.duration_minutes ? `${assessment.duration_minutes} min` : 'N/A'}
                </TableCell>
                <TableCell>
                  <Badge variant={assessment.is_active ? "default" : "outline"}>
                    {assessment.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Progress value={75} className="h-2 w-24" />
                    <span className="text-xs text-muted-foreground">75%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">View</Button>
                    <Button variant="outline" size="sm">Edit</Button>
                    <Button variant="outline" size="sm">Results</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-6">
                <p className="text-muted-foreground">No assessments found</p>
                <Button variant="outline" className="mt-2">
                  <PlusCircle className="mr-2 h-4 w-4" /> Create Assessment
                </Button>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default AssessmentTable;
