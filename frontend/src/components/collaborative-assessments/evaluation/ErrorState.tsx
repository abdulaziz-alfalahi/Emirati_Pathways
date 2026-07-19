
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface ErrorStateProps {
  title: string;
  message: string;
  onBack: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  message,
  onBack
}) => {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <h3 className="text-lg font-medium">{title}</h3>
        <p className="text-muted-foreground">{message}</p>
        <Button onClick={onBack} className="mt-4">
          <ArrowLeft className="h-4 w-4 me-2" />
          Go Back
        </Button>
      </div>
    </div>
  );
};
