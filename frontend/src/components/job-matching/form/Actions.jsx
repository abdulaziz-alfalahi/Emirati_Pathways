
import React from 'react';
import { Button } from '@/components/ui/button';
import { List } from 'lucide-react';

export function Actions({ testDatabaseInsert, viewSavedJobDescriptions }) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="outline" 
        onClick={testDatabaseInsert}
        className="flex items-center gap-2"
      >
        Test DB Connection
      </Button>
      <Button 
        variant="outline" 
        onClick={viewSavedJobDescriptions}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        View Saved Job Descriptions
      </Button>
    </div>
  );
}
