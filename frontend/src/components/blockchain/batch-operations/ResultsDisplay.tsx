
import React from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { BatchOperationResult } from '@/services/blockchain/batchCredentialService';

interface ResultsDisplayProps {
  result: BatchOperationResult;
  onReset: () => void;
}

const ResultsDisplay: React.FC<ResultsDisplayProps> = ({
  result,
  onReset
}) => {
  return (
    <div className="space-y-3">
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          Operation completed: {result.successful.length} successful, {result.failed.length} failed
        </AlertDescription>
      </Alert>

      {result.failed.length > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p>Failed operations:</p>
              {result.failed.map((failure) => (
                <p key={failure.id} className="text-xs">
                  {failure.id}: {failure.error}
                </p>
              ))}
            </div>
          </AlertDescription>
        </Alert>
      )}

      <Button onClick={onReset} className="w-full">
        Start New Operation
      </Button>
    </div>
  );
};

export default ResultsDisplay;
