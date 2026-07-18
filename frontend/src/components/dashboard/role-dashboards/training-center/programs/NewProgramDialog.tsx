
import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { BookOpen } from 'lucide-react';
import { NewProgram } from '@/types/training-center';

interface NewProgramDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newProgram: NewProgram;
  onNewProgramChange: (program: NewProgram) => void;
  onCreateProgram: () => void;
}

const NewProgramDialog: React.FC<NewProgramDialogProps> = ({
  open,
  onOpenChange,
  newProgram,
  onNewProgramChange,
  onCreateProgram
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <BookOpen className="me-2 h-4 w-4" /> Create New Program
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Training Program</DialogTitle>
          <DialogDescription>
            Add details for your new training program.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="title" className="text-end">
              Title*
            </Label>
            <Input
              id="title"
              value={newProgram.title}
              onChange={(e) => onNewProgramChange({...newProgram, title: e.target.value})}
              className="col-span-3"
              placeholder="Program title"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-end">
              Description
            </Label>
            <Textarea
              id="description"
              value={newProgram.description}
              onChange={(e) => onNewProgramChange({...newProgram, description: e.target.value})}
              className="col-span-3"
              placeholder="Program description"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="startDate" className="text-end">
              Start Date*
            </Label>
            <Input
              id="startDate"
              type="date"
              value={newProgram.startDate}
              onChange={(e) => onNewProgramChange({...newProgram, startDate: e.target.value})}
              className="col-span-3"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="status" className="text-end">
              Status
            </Label>
            <select
              id="status"
              value={newProgram.status}
              onChange={(e) => onNewProgramChange({...newProgram, status: e.target.value})}
              className="col-span-3 p-2 border rounded"
            >
              <option value="planned">Planned</option>
              <option value="active">Active</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={onCreateProgram}>Create Program</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewProgramDialog;
