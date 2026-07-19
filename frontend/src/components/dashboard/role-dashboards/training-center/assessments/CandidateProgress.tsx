
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useNavigate } from 'react-router-dom';

const CandidateProgress: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Candidate Progress</CardTitle>
        <CardDescription>Monitor assessment progress and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3 mb-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Scheduled</p>
                <Badge variant="outline">24</Badge>
              </div>
              <Progress value={24} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">In Progress</p>
                <Badge variant="outline">36</Badge>
              </div>
              <Progress value={36} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Completed</p>
                <Badge variant="outline">128</Badge>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </div>
          
          <div className="rounded-md border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Candidate</TableHead>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="text-end">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Ahmed Hassan</TableCell>
                  <TableCell>Technical Skills Assessment</TableCell>
                  <TableCell>Apr 5, 2025</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-amber-600 bg-amber-50">
                      Scheduled
                    </Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Fatima Ali</TableCell>
                  <TableCell>Leadership Assessment</TableCell>
                  <TableCell>Apr 3, 2025</TableCell>
                  <TableCell>
                    <Badge className="bg-green-500/10 text-green-700">
                      Completed
                    </Badge>
                  </TableCell>
                  <TableCell>87%</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Omar Khan</TableCell>
                  <TableCell>Problem-Solving Assessment</TableCell>
                  <TableCell>Apr 4, 2025</TableCell>
                  <TableCell>
                    <Badge className="bg-blue-500/10 text-blue-700">
                      In Progress
                    </Badge>
                  </TableCell>
                  <TableCell>-</TableCell>
                  <TableCell className="text-end">
                    <Button variant="ghost" size="sm">View</Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t pt-4">
        <Button variant="outline" onClick={() => navigate('/assessments')} className="ms-auto">
          View All Candidates
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CandidateProgress;
