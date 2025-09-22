
import React from 'react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, Users, Clock, Star } from 'lucide-react';
import { SummerCamp } from '@/types/summerCamps';
import { formatDistanceToNow } from 'date-fns';
import { formatNumber } from '@/lib/translationUtils';

interface CampCardProps {
  camp: SummerCamp;
  onEnroll: () => void;
  onCancelEnrollment?: () => void;
  isEnrolled: boolean;
  showActions: boolean;
}

const CampCard: React.FC<CampCardProps> = ({ 
  camp, 
  onEnroll, 
  onCancelEnrollment,
  isEnrolled, 
  showActions 
}) => {
  // Use capacity as fallback for max_participants if not available
  const maxParticipants = camp.max_participants || camp.capacity;
  const registrationDeadline = camp.registration_deadline;
  
  const isRegistrationOpen = registrationDeadline 
    ? new Date(registrationDeadline) > new Date()
    : true; // Default to open if no deadline specified
  const isFull = camp.enrolled >= maxParticipants;

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start mb-2">
          <Badge variant="outline" className="text-xs">
            {camp.category}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {camp.age_group}
          </Badge>
        </div>
        <CardTitle className="text-lg line-clamp-2">{camp.title}</CardTitle>
        <p className="text-sm text-muted-foreground line-clamp-2">{camp.description}</p>
      </CardHeader>

      <CardContent className="flex-grow">
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{camp.location}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>
              {new Date(camp.start_date).toLocaleDateString()} - {new Date(camp.end_date).toLocaleDateString()}
            </span>
          </div>
          
          {registrationDeadline && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span>
                Registration deadline: {formatDistanceToNow(new Date(registrationDeadline), { addSuffix: true })}
              </span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{formatNumber(camp.enrolled)}/{formatNumber(maxParticipants)} enrolled</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-medium">Organizer:</span>
            <span>{camp.organizer}</span>
          </div>

          {camp.rating && (
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>{formatNumber(camp.rating)}/5</span>
            </div>
          )}
        </div>
      </CardContent>

      {showActions && (
        <CardFooter className="pt-2">
          {isEnrolled ? (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onCancelEnrollment}
              className="w-full"
            >
              Cancel Enrollment
            </Button>
          ) : (
            <Button 
              size="sm" 
              onClick={onEnroll}
              disabled={!isRegistrationOpen || isFull}
              className="w-full"
            >
              {!isRegistrationOpen ? 'Registration Closed' : 
               isFull ? 'Full' : 'Enroll Now'}
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default CampCard;
