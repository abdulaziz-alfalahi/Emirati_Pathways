
import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, Settings } from 'lucide-react';

interface BatchOperationsHeaderProps {
  selectedCredentials: string[];
  totalCredentials: number;
  viewMode: 'list' | 'grid';
  onSelectAll: () => void;
  onViewModeChange: (mode: 'list' | 'grid') => void;
  onBatchOperations: () => void;
}

const BatchOperationsHeader: React.FC<BatchOperationsHeaderProps> = ({
  selectedCredentials,
  totalCredentials,
  viewMode,
  onSelectAll,
  onViewModeChange,
  onBatchOperations
}) => {
  return (
    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
      <div className="flex items-center space-x-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onSelectAll}
          className="flex items-center"
        >
          {selectedCredentials.length === totalCredentials ? (
            <CheckSquare className="h-4 w-4 me-2" />
          ) : (
            <Square className="h-4 w-4 me-2" />
          )}
          {selectedCredentials.length === totalCredentials ? 'Deselect All' : 'Select All'}
        </Button>
        
        {selectedCredentials.length > 0 && (
          <Badge variant="secondary">
            {selectedCredentials.length} selected
          </Badge>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onViewModeChange(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? 'List View' : 'Grid View'}
        </Button>
        
        {selectedCredentials.length > 0 && (
          <Button
            onClick={onBatchOperations}
            className="flex items-center"
          >
            <Settings className="h-4 w-4 me-2" />
            Batch Operations
          </Button>
        )}
      </div>
    </div>
  );
};

export default BatchOperationsHeader;
