
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface AnalyticsHeaderProps {
  timeRange: string;
  onTimeRangeChange: (range: string) => void;
}

export const AnalyticsHeader: React.FC<AnalyticsHeaderProps> = ({
  timeRange,
  onTimeRangeChange
}) => {
  return (
    <div className="flex justify-between items-center">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Learning Analytics</h2>
        <p className="text-muted-foreground">
          Track engagement, completion rates, and learning patterns
        </p>
      </div>
      
      <Select value={timeRange} onValueChange={onTimeRangeChange}>
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7d">Last 7 days</SelectItem>
          <SelectItem value="30d">Last 30 days</SelectItem>
          <SelectItem value="90d">Last 3 months</SelectItem>
          <SelectItem value="1y">Last year</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
