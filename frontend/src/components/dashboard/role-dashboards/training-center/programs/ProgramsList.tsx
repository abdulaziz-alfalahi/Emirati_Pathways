
import React from 'react';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, FileUp } from 'lucide-react';
import { Program } from '@/types/training-center';

interface ProgramsListProps {
  programs: Program[];
  onViewProgram: (program: Program) => void;
  onOpenUploadDialog: (program: Program) => void;
}

const ProgramsList: React.FC<ProgramsListProps> = ({ 
  programs, 
  onViewProgram, 
  onOpenUploadDialog 
}) => {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Program Name</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Trainees</TableHead>
          <TableHead>Start Date</TableHead>
          <TableHead>Documents</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {programs.map(program => (
          <TableRow key={program.id}>
            <TableCell className="font-medium">{program.title}</TableCell>
            <TableCell>
              <Badge 
                variant={program.status === 'active' ? 'default' : 'secondary'}
                className={program.status === 'active' ? 'bg-green-500/10 text-green-700' : ''}
              >
                {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
              </Badge>
            </TableCell>
            <TableCell>{program.trainees}</TableCell>
            <TableCell>{program.startDate}</TableCell>
            <TableCell>
              {program.documents?.length || 0} files
            </TableCell>
            <TableCell>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => onViewProgram(program)}
                >
                  <FolderOpen className="h-4 w-4 me-1" /> View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onOpenUploadDialog(program)}
                >
                  <FileUp className="h-4 w-4 me-1" /> Upload
                </Button>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default ProgramsList;
