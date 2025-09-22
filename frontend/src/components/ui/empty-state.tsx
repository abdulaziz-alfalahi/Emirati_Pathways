
import React from 'react';
import { Briefcase, GraduationCap, User, Languages, Award, FileText } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  description: string;
  icon?: 'briefcase' | 'education' | 'user' | 'languages' | 'skills' | 'document';
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  icon = 'document'
}) => {
  const renderIcon = () => {
    switch (icon) {
      case 'briefcase':
        return <Briefcase className="h-12 w-12 text-muted-foreground/50" />;
      case 'education':
        return <GraduationCap className="h-12 w-12 text-muted-foreground/50" />;
      case 'user':
        return <User className="h-12 w-12 text-muted-foreground/50" />;
      case 'languages':
        return <Languages className="h-12 w-12 text-muted-foreground/50" />;
      case 'skills':
        return <Award className="h-12 w-12 text-muted-foreground/50" />;
      default:
        return <FileText className="h-12 w-12 text-muted-foreground/50" />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center">
      <div className="mb-4 rounded-full bg-muted p-3">
        {renderIcon()}
      </div>
      <h3 className="mb-2 font-medium">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
        {description}
      </p>
    </div>
  );
};
