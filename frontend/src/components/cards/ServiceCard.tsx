
import React from 'react';
import { DubaiCard, DubaiCardHeader, DubaiCardTitle, DubaiCardDescription, DubaiCardContent, DubaiCardFooter } from '@/components/ui/dubai-card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Clock, Users } from 'lucide-react';

interface ServiceCardProps {
  title: string;
  description: string;
  category?: string;
  duration?: string;
  users?: number;
  status?: 'available' | 'coming-soon' | 'popular';
  onClick?: () => void;
  actionLabel?: string;
  icon?: React.ReactNode;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  category,
  duration,
  users,
  status = 'available',
  onClick,
  actionLabel = 'Learn More',
  icon
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'popular':
        return <Badge className="bg-ehrdc-teal text-white">Popular</Badge>;
      case 'coming-soon':
        return <Badge variant="secondary">Coming Soon</Badge>;
      default:
        return null;
    }
  };

  return (
    <DubaiCard 
      variant="service" 
      interactive={!!onClick}
      onClick={onClick}
      className="h-full"
    >
      <DubaiCardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="p-2 rounded-lg bg-ehrdc-teal/10 text-ehrdc-teal">
                {icon}
              </div>
            )}
            <div>
              <DubaiCardTitle>{title}</DubaiCardTitle>
              {category && (
                <p className="text-xs text-ehrdc-teal font-medium mt-1">{category}</p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>
        <DubaiCardDescription>{description}</DubaiCardDescription>
      </DubaiCardHeader>
      
      <DubaiCardContent>
        <div className="flex items-center space-x-4 text-sm text-ehrdc-neutral-dark/60">
          {duration && (
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{duration}</span>
            </div>
          )}
          {users && (
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4" />
              <span>{users.toLocaleString()} users</span>
            </div>
          )}
        </div>
      </DubaiCardContent>

      <DubaiCardFooter>
        <Button 
          variant="ghost" 
          className="text-ehrdc-teal hover:text-ehrdc-dark-teal hover:bg-ehrdc-teal/10 p-0 h-auto font-medium"
          disabled={status === 'coming-soon'}
        >
          {actionLabel}
          <ArrowRight className="ms-2 h-4 w-4" />
        </Button>
      </DubaiCardFooter>
    </DubaiCard>
  );
};
