
import React, { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format } from 'date-fns';
import { Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Program } from '@/types/training-center';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface ProgramsCalendarProps {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
}

const ProgramsCalendar: React.FC<ProgramsCalendarProps> = ({ programs, setPrograms }) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAddProgramDialogOpen, setIsAddProgramDialogOpen] = useState(false);
  const [programsOnSelectedDate, setProgramsOnSelectedDate] = useState<Program[]>([]);
  const [isProgramDetailsOpen, setIsProgramDetailsOpen] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  
  // Form state for adding a new program
  const [newProgram, setNewProgram] = useState({
    title: '',
    description: '',
    status: 'planned',
    instructor: '',
    location: ''
  });
  
  // Handle date selection on calendar
  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      const formattedSelectedDate = format(date, 'yyyy-MM-dd');
      
      // Find programs scheduled on the selected date
      const filteredPrograms = programs.filter(program => {
        const programStartDate = program.startDate.split('T')[0];
        return programStartDate === formattedSelectedDate;
      });
      
      setProgramsOnSelectedDate(filteredPrograms);
      setIsProgramDetailsOpen(filteredPrograms.length > 0);
    }
  };

  // Add a new program
  const handleAddProgram = () => {
    if (!selectedDate || !newProgram.title) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProgramItem: Program = {
      id: programs.length + 1,
      title: newProgram.title,
      description: newProgram.description,
      trainees: 0,
      startDate: format(selectedDate, 'yyyy-MM-dd'),
      status: newProgram.status as 'active' | 'planned' | 'completed' | 'cancelled',
      instructor: newProgram.instructor,
      location: newProgram.location,
      documents: []
    };

    setPrograms([...programs, newProgramItem]);
    setIsAddProgramDialogOpen(false);
    setNewProgram({
      title: '',
      description: '',
      status: 'planned',
      instructor: '',
      location: ''
    });
    toast.success('Program scheduled successfully');
  };

  // Open program details when clicking on a program in the popover
  const handleProgramClick = (program: Program) => {
    setSelectedProgram(program);
    setIsProgramDetailsOpen(true);
  };

  // Render dots for dates with programs
  const renderProgramIndicator = (date: Date) => {
    const formattedDate = format(date, 'yyyy-MM-dd');
    const programsOnDate = programs.filter(program => {
      const programStartDate = program.startDate.split('T')[0];
      return programStartDate === formattedDate;
    });

    if (programsOnDate.length > 0) {
      return <div className="absolute bottom-0 start-0 end-0 flex justify-center">
        <div className="h-1 w-1 bg-emirati-teal rounded-full"></div>
      </div>;
    }
    
    return null;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Training Programs Calendar</CardTitle>
          <Button 
            size="sm" 
            onClick={() => {
              setIsAddProgramDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 me-1" /> Schedule Program
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-[350px_1fr] gap-6">
          <div>
            <Calendar 
              mode="single"
              selected={selectedDate}
              onSelect={handleDateSelect}
              className="rounded-md border p-3 w-full"
              components={{
                DayContent: ({ date }) => (
                  <div className="relative w-full h-full flex items-center justify-center">
                    {date.getDate()}
                    {renderProgramIndicator(date)}
                  </div>
                ),
              }}
            />
          </div>
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  {selectedDate ? (
                    <>Programs on {format(selectedDate, 'MMMM d, yyyy')}</>
                  ) : (
                    <>Select a date</>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {programsOnSelectedDate.length > 0 ? (
                  <div className="space-y-3">
                    {programsOnSelectedDate.map(program => (
                      <div 
                        key={program.id} 
                        className="border rounded-md p-3 cursor-pointer hover:bg-gray-50"
                        onClick={() => handleProgramClick(program)}
                      >
                        <div className="font-medium">{program.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {program.instructor && `Instructor: ${program.instructor}`}
                          {program.location && ` • Location: ${program.location}`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    {selectedDate ? 'No programs scheduled for this date' : 'Select a date to view programs'}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Add Program Dialog */}
        <Dialog open={isAddProgramDialogOpen} onOpenChange={setIsAddProgramDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Schedule New Program</DialogTitle>
              <DialogDescription>
                Create a new training program for {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'the selected date'}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title">Program Title *</Label>
                <Input 
                  id="title" 
                  placeholder="Enter program title" 
                  value={newProgram.title}
                  onChange={(e) => setNewProgram({...newProgram, title: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input 
                  id="description" 
                  placeholder="Enter program description" 
                  value={newProgram.description}
                  onChange={(e) => setNewProgram({...newProgram, description: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={newProgram.status} 
                  onValueChange={(value) => setNewProgram({...newProgram, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planned">Planned</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="instructor">Instructor</Label>
                <Input 
                  id="instructor" 
                  placeholder="Enter instructor name" 
                  value={newProgram.instructor}
                  onChange={(e) => setNewProgram({...newProgram, instructor: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input 
                  id="location" 
                  placeholder="Enter program location" 
                  value={newProgram.location}
                  onChange={(e) => setNewProgram({...newProgram, location: e.target.value})}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddProgramDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleAddProgram}>Schedule Program</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Program Details Dialog */}
        <Dialog open={isProgramDetailsOpen && !!selectedProgram} onOpenChange={setIsProgramDetailsOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedProgram?.title}</DialogTitle>
              <DialogDescription>
                {selectedProgram?.description || 'No description available'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm">{selectedProgram?.startDate}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Status</p>
                  <p className="text-sm capitalize">{selectedProgram?.status}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Location</p>
                  <p className="text-sm">{selectedProgram?.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Instructor</p>
                  <p className="text-sm">{selectedProgram?.instructor || 'Not assigned'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Trainees</p>
                  <p className="text-sm">{selectedProgram?.trainees || 0}</p>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsProgramDetailsOpen(false)}>Close</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ProgramsCalendar;
