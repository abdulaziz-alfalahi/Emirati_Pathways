
import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Book, Calendar, GraduationCap } from 'lucide-react';
import { Trainee } from '@/types/training-center';

interface TraineeProgramsProps {
  trainee: Trainee;
}

// Mock program data - in a real app, this would come from an API
const mockProgramsData = [
  {
    id: 1,
    title: 'Web Development Bootcamp',
    progress: 65,
    startDate: '2025-02-15',
    endDate: '2025-05-15',
    status: 'in-progress',
    instructor: 'Ahmed Mohammed'
  },
  {
    id: 2,
    title: 'Digital Marketing Intensive',
    progress: 42,
    startDate: '2025-03-10',
    endDate: '2025-06-10',
    status: 'in-progress',
    instructor: 'Fatima Al Zaabi'
  },
  {
    id: 3,
    title: 'Basic Computing Skills',
    progress: 100,
    startDate: '2025-01-05',
    endDate: '2025-02-05',
    status: 'completed',
    instructor: 'Omar Khan'
  }
];

const TraineePrograms: React.FC<TraineeProgramsProps> = ({ trainee }) => {
  // In a real app, you would filter programs by trainee.id
  const traineePrograms = mockProgramsData;
  
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium mb-2">Enrolled Programs</h3>
      
      {traineePrograms.length > 0 ? (
        traineePrograms.map(program => (
          <Card key={program.id} className="p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h4 className="font-medium flex items-center">
                  <Book className="h-4 w-4 me-2 text-emirati-teal" />
                  {program.title}
                </h4>
                <p className="text-sm text-muted-foreground">Instructor: {program.instructor}</p>
              </div>
              <Badge 
                className={
                  program.status === 'completed' 
                    ? "bg-green-500/10 text-green-700" 
                    : "bg-blue-500/10 text-blue-700"
                }
              >
                {program.status === 'completed' ? 'Completed' : 'In Progress'}
              </Badge>
            </div>
            
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <Calendar className="h-4 w-4 me-1" />
              {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
            </div>
            
            <div className="mt-2">
              <div className="flex justify-between text-xs mb-1">
                <span>Progress</span>
                <span>{program.progress}%</span>
              </div>
              <Progress value={program.progress} className="h-2" />
            </div>
          </Card>
        ))
      ) : (
        <p className="text-muted-foreground">No programs enrolled</p>
      )}
    </div>
  );
};

export default TraineePrograms;
