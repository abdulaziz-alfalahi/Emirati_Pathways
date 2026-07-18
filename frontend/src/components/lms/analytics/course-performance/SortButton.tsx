
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowUpDown } from 'lucide-react';
import { SortField } from './types';

interface SortButtonProps {
  field: SortField;
  onSort: (field: SortField) => void;
  children: React.ReactNode;
}

export const SortButton: React.FC<SortButtonProps> = ({ field, onSort, children }) => {
  return (
    <Button 
      variant="ghost" 
      onClick={() => onSort(field)}
      className="h-auto p-0 font-semibold"
    >
      {children}
      <ArrowUpDown className="ms-2 h-3 w-3" />
    </Button>
  );
};
