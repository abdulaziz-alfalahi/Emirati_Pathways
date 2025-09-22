
import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ActionItem {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick?: () => void;
  link?: string; // Add support for link property
}

interface DashboardActionsProps {
  actions: ActionItem[];
}

const DashboardActions: React.FC<DashboardActionsProps> = ({ actions }) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
      {actions.map((action, index) => {
        const Icon = action.icon;
        
        // If a link is provided, wrap the button in a Link component
        const ButtonContent = (
          <Button 
            key={index}
            className="h-auto py-6 flex flex-col items-center justify-center w-full" 
            variant="outline"
            onClick={action.onClick}
          >
            <Icon className="h-6 w-6 mb-2" />
            <span className="text-lg font-semibold">{action.title}</span>
            <span className="text-xs text-muted-foreground mt-1">{action.description}</span>
          </Button>
        );
        
        return action.link ? (
          <Link key={index} to={action.link} className="block">
            {ButtonContent}
          </Link>
        ) : (
          ButtonContent
        );
      })}
    </div>
  );
};

export default DashboardActions;
