
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Compass } from 'lucide-react';

interface EmptyCareerPathStateProps {
  message: string;
  action: string;
}

const EmptyCareerPathState: React.FC<EmptyCareerPathStateProps> = ({ 
  message = "No career paths available", 
  action = "Check back later for new career paths" 
}) => {
  return (
    <Card className="w-full">
      <CardContent className="py-10 flex flex-col items-center justify-center text-center">
        <div className="rounded-full bg-muted p-3 mb-4">
          <Compass className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">{message}</h3>
        <p className="text-sm text-muted-foreground">
          {action}
        </p>
      </CardContent>
    </Card>
  );
};

export default EmptyCareerPathState;
