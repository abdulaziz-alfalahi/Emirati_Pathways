
import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ProcessingStateProps {
  operation: 'download' | 'share' | 'revoke' | null;
  progress: number;
}

const ProcessingState: React.FC<ProcessingStateProps> = ({
  operation,
  progress
}) => {
  if (!operation) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center">
        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        <span className="text-sm">
          Processing {operation} operation...
        </span>
      </div>
      <Progress value={progress} className="w-full" />
    </div>
  );
};

export default ProcessingState;
