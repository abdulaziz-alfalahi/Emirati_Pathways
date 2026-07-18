
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface AssessmentCardProps {
  assessment: {
    id: string;
    title: string;
    description: string;
    status: 'draft' | 'in_progress' | 'completed' | 'pending';
    dueDate: string;
    participants: {
      name: string;
      imageUrl: string;
    }[];
    progress: number;
  };
}

const AssessmentCard: React.FC<AssessmentCardProps> = ({ assessment }) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{assessment.title}</CardTitle>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem>View Details</DropdownMenuItem>
              <DropdownMenuItem>Edit</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <CardDescription>{assessment.description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center">
          <Users className="h-4 w-4 me-2 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {assessment.participants.length} Participants
          </span>
        </div>
        <div className="flex items-center">
          {assessment.status === 'completed' ? (
            <CheckCircle className="h-4 w-4 me-2 text-green-500" />
          ) : assessment.status === 'pending' ? (
            <AlertTriangle className="h-4 w-4 me-2 text-yellow-500" />
          ) : (
            <Clock className="h-4 w-4 me-2 text-muted-foreground" />
          )}
          <span className="text-sm text-muted-foreground">
            Due: {assessment.dueDate}
          </span>
        </div>
        <div>
          <Badge variant={
            assessment.status === 'completed' ? 'default' :
            assessment.status === 'in_progress' ? 'secondary' :
            assessment.status === 'draft' ? 'outline' : 'destructive'
          }>
            {assessment.status}
          </Badge>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <div className="flex -space-x-2">
          {assessment.participants.map((participant, index) => (
            <Avatar key={index} className="h-7 w-7">
              <AvatarImage src={participant.imageUrl} alt={participant.name} />
              <AvatarFallback>{participant.name.charAt(0)}</AvatarFallback>
            </Avatar>
          ))}
        </div>
        <Button>View</Button>
      </CardFooter>
    </Card>
  );
};

export default AssessmentCard;
