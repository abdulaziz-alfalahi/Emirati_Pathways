
import React from 'react';
import { DubaiCard, DubaiCardHeader, DubaiCardTitle, DubaiCardDescription, DubaiCardContent } from '@/components/ui/dubai-card';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle, CheckCircle, Info } from 'lucide-react';

interface InformationCardProps {
  title: string;
  description: string;
  type?: 'info' | 'success' | 'warning' | 'announcement';
  date?: string;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  onClick?: () => void;
}

export const InformationCard: React.FC<InformationCardProps> = ({
  title,
  description,
  type = 'info',
  date,
  priority,
  tags = [],
  onClick
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'announcement':
        return <Info className="h-5 w-5 text-ehrdc-teal" />;
      default:
        return <Info className="h-5 w-5 text-ehrdc-teal" />;
    }
  };

  const getPriorityColor = () => {
    switch (priority) {
      case 'high':
        return 'border-l-4 border-l-red-500';
      case 'medium':
        return 'border-l-4 border-l-orange-500';
      case 'low':
        return 'border-l-4 border-l-green-500';
      default:
        return 'border-l-4 border-l-ehrdc-teal';
    }
  };

  return (
    <DubaiCard 
      variant="information" 
      interactive={!!onClick}
      onClick={onClick}
      className={`${getPriorityColor()}`}
    >
      <DubaiCardHeader>
        <div className="flex items-start space-x-3">
          {getTypeIcon()}
          <div className="flex-1">
            <DubaiCardTitle className="text-lg">{title}</DubaiCardTitle>
            <DubaiCardDescription className="mt-2">{description}</DubaiCardDescription>
          </div>
        </div>
      </DubaiCardHeader>
      
      <DubaiCardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          {date && (
            <div className="flex items-center space-x-1 text-sm text-ehrdc-neutral-dark/60">
              <Calendar className="h-4 w-4" />
              <span>{date}</span>
            </div>
          )}
        </div>
      </DubaiCardContent>
    </DubaiCard>
  );
};
