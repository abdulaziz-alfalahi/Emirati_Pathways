
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

interface FilterSummaryProps {
  totalRecords: number;
  filteredRecords: number;
  activeFilters: Record<string, any>;
  crossFilters?: Record<string, any>;
}

export const FilterSummary: React.FC<FilterSummaryProps> = ({
  totalRecords,
  filteredRecords,
  activeFilters,
  crossFilters = {}
}) => {
  const filterPercentage = totalRecords > 0 ? ((filteredRecords / totalRecords) * 100).toFixed(1) : 0;
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4" />
          Filter Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Showing:</span>
          <span className="font-medium">
            {filteredRecords.toLocaleString()} of {totalRecords.toLocaleString()} records ({filterPercentage}%)
          </span>
        </div>
        
        {Object.keys(crossFilters).length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-medium text-muted-foreground">Cross-Filters Active:</span>
            <div className="flex flex-wrap gap-1">
              {Object.entries(crossFilters).map(([key, value]) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {key}: {value}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
            style={{ width: `${filterPercentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
};
