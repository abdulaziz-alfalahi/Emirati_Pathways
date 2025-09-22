
import React, { ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface ProfessionalGrowthTabContentProps {
  title: string;
  description?: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}

export const ProfessionalGrowthTabContent: React.FC<ProfessionalGrowthTabContentProps> = ({
  title,
  description,
  icon,
  children,
  action
}) => {
  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          {icon}
          <CardTitle>{title}</CardTitle>
        </div>
        {action && <div>{action}</div>}
      </CardHeader>
      {description && (
        <CardContent className="pt-0 pb-3">
          <p className="text-muted-foreground">{description}</p>
        </CardContent>
      )}
      <CardContent className="pt-0">
        {children}
      </CardContent>
    </Card>
  );
};

export const EmptyTabContent: React.FC<{
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}> = ({ icon: Icon, title, description, actionLabel, onAction }) => {
  return (
    <div className="text-center py-12">
      <Icon className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
      <h3 className="text-2xl font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground max-w-md mx-auto mb-6">{description}</p>
      {actionLabel && onAction && (
        <button 
          onClick={onAction}
          className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))/90] text-white px-4 py-2 rounded-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
