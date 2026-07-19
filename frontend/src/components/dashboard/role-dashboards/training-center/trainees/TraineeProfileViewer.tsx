
import React from 'react';
import { Card, CardHeader, CardContent, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Book, Award, User, Calendar, Mail, Phone, MapPin, FileText, GraduationCap, CheckCircle, XCircle } from 'lucide-react';
import { Trainee } from '@/types/training-center';
import TraineePrograms from './TraineePrograms';
import TraineeAssessments from './TraineeAssessments';
import TraineePersonalInfo from './TraineePersonalInfo';

interface TraineeProfileViewerProps {
  trainee: Trainee;
  onClose: () => void;
}

const TraineeProfileViewer: React.FC<TraineeProfileViewerProps> = ({ trainee, onClose }) => {
  return (
    <Card className="w-full shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={trainee.profileImage} alt={trainee.name} />
              <AvatarFallback className="text-lg">{trainee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-2xl">{trainee.name}</CardTitle>
              <CardDescription className="flex items-center mt-1">
                <Mail className="h-4 w-4 me-1" />
                {trainee.email}
              </CardDescription>
              <div className="mt-2">
                {getStatusBadge(trainee.status)}
              </div>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </CardHeader>
      <Separator />
      <CardContent className="pt-6">
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Overall Progress</h3>
            <span className="text-sm font-medium">{trainee.progress}%</span>
          </div>
          <Progress value={trainee.progress} className="h-2" />
        </div>

        <Tabs defaultValue="programs" className="w-full">
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="programs" className="flex items-center">
              <Book className="h-4 w-4 me-2" /> Programs
            </TabsTrigger>
            <TabsTrigger value="assessments" className="flex items-center">
              <FileText className="h-4 w-4 me-2" /> Assessments
            </TabsTrigger>
            <TabsTrigger value="personal" className="flex items-center">
              <User className="h-4 w-4 me-2" /> Personal Info
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="programs">
            <TraineePrograms trainee={trainee} />
          </TabsContent>
          
          <TabsContent value="assessments">
            <TraineeAssessments traineeId={trainee.id} />
          </TabsContent>
          
          <TabsContent value="personal">
            <TraineePersonalInfo trainee={trainee} />
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="border-t pt-4 flex justify-end space-x-2">
        <Button variant="outline">Export Profile</Button>
        <Button>Message Trainee</Button>
      </CardFooter>
    </Card>
  );
};

const getStatusBadge = (status: Trainee['status']) => {
  switch(status) {
    case 'active':
      return <Badge className="bg-blue-500/10 text-blue-700">Active</Badge>;
    case 'graduated':
      return <Badge className="bg-green-500/10 text-green-700">Graduated</Badge>;
    case 'withdrawn':
      return <Badge className="bg-red-500/10 text-red-700">Withdrawn</Badge>;
    default:
      return <Badge>Unknown</Badge>;
  }
};

export default TraineeProfileViewer;
