
import React, { useState } from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Program, NewProgram } from '@/types/training-center';
import ProgramsList from './programs/ProgramsList';
import ProgramAnalytics from './programs/ProgramAnalytics';
import NewProgramDialog from './programs/NewProgramDialog';
import ProgramDetailsDialog from './programs/ProgramDetailsDialog';
import DocumentUploadDialog from './programs/DocumentUploadDialog';
import ProgramsCalendar from './programs/ProgramsCalendar';

interface ProgramsTabProps {
  programs: Program[];
  setPrograms: React.Dispatch<React.SetStateAction<Program[]>>;
}

const ProgramsTab: React.FC<ProgramsTabProps> = ({ programs, setPrograms }) => {
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [newProgramDialogOpen, setNewProgramDialogOpen] = useState(false);
  const [newProgram, setNewProgram] = useState<NewProgram>({
    title: '',
    description: '',
    startDate: '',
    status: 'planned'
  });
  const [activeView, setActiveView] = useState('list');

  const handleFileUpload = (programId: number) => {
    // In a real application, this would handle actual file uploads
    toast.success('Document uploaded successfully');
    setIsUploadDialogOpen(false);
  };

  const handleCreateProgram = () => {
    if (!newProgram.title || !newProgram.startDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    const newProgramItem: Program = {
      id: programs.length + 1,
      title: newProgram.title,
      description: newProgram.description,
      trainees: 0,
      startDate: newProgram.startDate,
      status: newProgram.status as 'active' | 'planned',
      documents: []
    };

    setPrograms([...programs, newProgramItem]);
    setNewProgram({
      title: '',
      description: '',
      startDate: '',
      status: 'planned'
    });
    setNewProgramDialogOpen(false);
    toast.success('New training program created');
  };

  const handleViewProgram = (program: Program) => {
    setSelectedProgram(program);
  };

  const handleOpenUploadDialog = (program: Program) => {
    setSelectedProgram(program);
    setIsUploadDialogOpen(true);
  };

  const handleUploadClick = () => {
    setIsUploadDialogOpen(true);
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Training Programs</CardTitle>
              <CardDescription>Manage your training offerings</CardDescription>
            </div>
            <NewProgramDialog 
              open={newProgramDialogOpen}
              onOpenChange={setNewProgramDialogOpen}
              newProgram={newProgram}
              onNewProgramChange={setNewProgram}
              onCreateProgram={handleCreateProgram}
            />
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={activeView} onValueChange={setActiveView} className="space-y-4">
            <TabsList>
              <TabsTrigger value="list">List View</TabsTrigger>
              <TabsTrigger value="calendar">Calendar View</TabsTrigger>
            </TabsList>
            
            <TabsContent value="list">
              <ProgramsList 
                programs={programs}
                onViewProgram={handleViewProgram}
                onOpenUploadDialog={handleOpenUploadDialog}
              />
            </TabsContent>
            
            <TabsContent value="calendar">
              <ProgramsCalendar 
                programs={programs}
                setPrograms={setPrograms}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Program Details Dialog */}
      <ProgramDetailsDialog 
        program={selectedProgram}
        open={!!selectedProgram && !isUploadDialogOpen}
        onOpenChange={(open) => !open && setSelectedProgram(null)}
        onUploadClick={handleUploadClick}
      />
      
      {/* Document Upload Dialog */}
      <DocumentUploadDialog 
        program={selectedProgram}
        open={isUploadDialogOpen && !!selectedProgram}
        onOpenChange={setIsUploadDialogOpen}
        onUpload={handleFileUpload}
      />
      
      {/* Program Analytics Section */}
      <ProgramAnalytics />
    </div>
  );
};

export default ProgramsTab;
