
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, MapPin, Calendar, Award, DollarSign } from 'lucide-react';
import type { TrainingProgram } from '@/types/training';

interface TrainingProgramCardProps {
  program: TrainingProgram;
  onApply: (programId: string) => void;
  onViewDetails: (programId: string) => void;
}

export const TrainingProgramCard: React.FC<TrainingProgramCardProps> = ({
  program,
  onApply,
  onViewDetails
}) => {
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical_skills':
        return 'bg-[rgb(var(--pg-primary))] text-white';
      case 'trade_skills':
        return 'bg-[rgb(var(--pg-secondary))] text-white';
      case 'service_skills':
        return 'bg-[rgb(var(--pg-accent))] text-white';
      case 'entrepreneurship_business':
        return 'bg-purple-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'full':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const formatCurrency = (amount: number | undefined, currency: string) => {
    if (!amount) return 'Free';
    return `${currency} ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'TBD';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card className="hover:shadow-lg transition-all duration-200 hover:border-[rgb(var(--pg-primary))] group">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start mb-2">
          <CardTitle className="text-lg leading-tight group-hover:text-[rgb(var(--pg-primary))] transition-colors">
            {program.title}
          </CardTitle>
          <Badge className={getStatusColor(program.status)}>
            {program.status}
          </Badge>
        </div>
        {program.provider && (
          <p className="text-sm text-muted-foreground">{program.provider.name}</p>
        )}
        <Badge className={getCategoryColor(program.category)} variant="secondary">
          {program.category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {program.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {program.description}
          </p>
        )}
        
        <div className="grid grid-cols-2 gap-3 text-sm">
          {program.duration_weeks && (
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
              <span>{program.duration_weeks} weeks</span>
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
            <span>{program.current_participants}/{program.max_participants || '∞'}</span>
          </div>
          
          {program.location && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
              <span className="truncate">{program.location}</span>
            </div>
          )}
          
          {program.start_date && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[rgb(var(--pg-secondary))]" />
              <span>{formatDate(program.start_date)}</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-[rgb(var(--pg-accent))]" />
            <span className="font-semibold text-[rgb(var(--pg-accent))]">
              {formatCurrency(program.price_amount, program.price_currency)}
            </span>
          </div>
          
          {program.certification_offered && (
            <div className="flex items-center gap-1 text-sm text-[rgb(var(--pg-primary))]">
              <Award className="h-4 w-4" />
              <span>Certificate</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 pt-2">
          <Button 
            size="sm" 
            variant="outline" 
            className="flex-1 hover:border-[rgb(var(--pg-primary))] hover:text-[rgb(var(--pg-primary))]"
            onClick={() => onViewDetails(program.id)}
          >
            View Details
          </Button>
          <Button 
            size="sm"
            className="flex-1 bg-[rgb(var(--pg-primary))] hover:bg-[rgb(var(--pg-primary))/90] text-white"
            onClick={() => onApply(program.id)}
            disabled={program.status === 'full' || program.status === 'completed'}
          >
            {program.status === 'full' ? 'Full' : 'Apply Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
