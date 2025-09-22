
import React from 'react';
import { FileQuestion } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ 
  title, 
  description, 
  icon = <FileQuestion className="h-12 w-12 text-muted-foreground" />
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border rounded-lg bg-muted/40">
      <div className="mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md">
        {description}
      </p>
    </div>
  );
};
