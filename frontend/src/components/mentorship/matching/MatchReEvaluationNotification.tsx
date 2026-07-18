
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, Clock, AlertCircle } from 'lucide-react';

interface MatchReEvaluationNotificationProps {
  needsReEvaluation: boolean;
  isReEvaluating: boolean;
  lastEvaluationTime: Date | null;
  onTriggerReEvaluation: () => void;
}

export const MatchReEvaluationNotification: React.FC<MatchReEvaluationNotificationProps> = ({
  needsReEvaluation,
  isReEvaluating,
  lastEvaluationTime,
  onTriggerReEvaluation
}) => {
  if (!needsReEvaluation && !isReEvaluating) {
    return null;
  }

  const formatLastEvaluationTime = (date: Date | null) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Less than an hour ago';
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            {isReEvaluating ? (
              <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />
            ) : (
              <AlertCircle className="h-5 w-5 text-blue-600" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <h4 className="font-medium text-blue-900">
                {isReEvaluating ? 'Updating Your Matches...' : 'New Matches Available'}
              </h4>
              {needsReEvaluation && (
                <Badge variant="secondary" className="text-xs">
                  Update Available
                </Badge>
              )}
            </div>
            
            <p className="text-sm text-blue-800">
              {isReEvaluating 
                ? 'We\'re finding updated mentor matches based on your latest preferences.'
                : 'Your profile or preferences have been updated. Get fresh mentor recommendations.'
              }
            </p>
            
            {lastEvaluationTime && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Clock className="h-3 w-3" />
                <span>Last updated: {formatLastEvaluationTime(lastEvaluationTime)}</span>
              </div>
            )}
          </div>
          
          {!isReEvaluating && (
            <Button 
              size="sm" 
              onClick={onTriggerReEvaluation}
              className="flex-shrink-0"
            >
              <RefreshCw className="h-4 w-4 me-2" />
              Update Matches
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
