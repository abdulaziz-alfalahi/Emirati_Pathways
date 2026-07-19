
import React from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { File, FileText, Upload } from 'lucide-react';
import { Program, ProgramDocument } from '@/types/training-center';

interface ProgramDetailsDialogProps {
  program: Program | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadClick: () => void;
}

const ProgramDetailsDialog: React.FC<ProgramDetailsDialogProps> = ({
  program,
  open,
  onOpenChange,
  onUploadClick
}) => {
  if (!program) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{program.title}</DialogTitle>
          <DialogDescription>
            {program.description || 'No description available.'}
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-4">
          <div className="flex justify-between">
            <div>
              <span className="text-sm text-muted-foreground">Status:</span>
              <Badge 
                variant={program.status === 'active' ? 'default' : 'secondary'}
                className={program.status === 'active' ? 'bg-green-500/10 text-green-700 ms-2' : 'ms-2'}
              >
                {program.status.charAt(0).toUpperCase() + program.status.slice(1)}
              </Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Start Date:</span> 
              <span className="ms-2">{program.startDate}</span>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Trainees:</span> 
              <span className="ms-2">{program.trainees}</span>
            </div>
          </div>
          
          <div className="pt-4">
            <h4 className="text-sm font-medium mb-2">Program Documents</h4>
            {program.documents && program.documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {program.documents.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium flex items-center">
                        <File className="h-4 w-4 me-2" /> {doc.name}
                      </TableCell>
                      <TableCell>{doc.type}</TableCell>
                      <TableCell>{doc.uploadDate}</TableCell>
                      <TableCell>{doc.size}</TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm">
                          <FileText className="h-4 w-4 me-1" /> View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 border rounded-md">
                <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="mt-2 text-muted-foreground">No documents uploaded yet</p>
                <Button variant="outline" size="sm" className="mt-2" onClick={onUploadClick}>
                  <Upload className="h-4 w-4 me-1" /> Upload Document
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProgramDetailsDialog;
