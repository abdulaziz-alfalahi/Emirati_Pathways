
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Circle } from 'lucide-react';

const JourneyMapLegend: React.FC = () => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-blue-600 fill-current" />
            <span>Current Stage</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-orange-600" />
            <span>Recommended Next</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="h-4 w-4 text-gray-400" />
            <span>Future Stage</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default JourneyMapLegend;
