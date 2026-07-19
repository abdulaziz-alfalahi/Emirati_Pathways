
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';
import { Link } from 'react-router-dom';

interface JobsTableProps {
  jobs: any[];
  onFindMatches: (jobId: string) => void;
}

const JobsTable = ({ jobs, onFindMatches }: JobsTableProps) => {
  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Job Title</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Posted</TableHead>
            <TableHead className="text-end">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <TableRow key={job.id}>
                <TableCell className="font-medium">{job.title}</TableCell>
                <TableCell>{job.company || 'N/A'}</TableCell>
                <TableCell>{job.location || 'N/A'}</TableCell>
                <TableCell>{formatDate(job.created_at)}</TableCell>
                <TableCell className="text-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => onFindMatches(job.id)} className="gap-1">
                    <Users className="h-4 w-4" /> Match
                  </Button>
                  <Link to={`/recruiter/jobs/${job.id}`}>
                    <Button variant="outline" size="sm">Details</Button>
                  </Link>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-4">
                No job descriptions found. Create a new job or upload job descriptions to get started.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
};

export default JobsTable;
