
import React from 'react';
import { ProjectContribution } from '@/types/legacyProject';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Clock, Wrench, Package } from 'lucide-react';

interface ContributionCardProps {
  contribution: ProjectContribution;
}

export const ContributionCard: React.FC<ContributionCardProps> = ({ contribution }) => {
  const getContributionIcon = (type: string) => {
    switch (type) {
      case 'financial':
        return <DollarSign className="h-4 w-4" />;
      case 'time':
        return <Clock className="h-4 w-4" />;
      case 'skills':
        return <Wrench className="h-4 w-4" />;
      case 'resources':
        return <Package className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  const getContributionValue = () => {
    switch (contribution.contribution_type) {
      case 'financial':
        return contribution.amount ? 
          `${new Intl.NumberFormat('en-AE', {
            style: 'currency',
            currency: contribution.currency,
            minimumFractionDigits: 0,
          }).format(contribution.amount)}` : 'Amount not specified';
      case 'time':
        return contribution.hours_contributed ? 
          `${contribution.hours_contributed} hours` : 'Hours not specified';
      case 'skills':
        return contribution.skills_provided?.join(', ') || 'Skills not specified';
      case 'resources':
        return 'Resources provided';
      default:
        return 'Contribution made';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'withdrawn':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{contribution.project?.title}</CardTitle>
          <Badge className={getStatusColor(contribution.status)}>
            {contribution.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          {getContributionIcon(contribution.contribution_type)}
          <span className="font-medium capitalize">{contribution.contribution_type} Contribution</span>
        </div>

        <div className="text-sm text-gray-600">
          <strong>Value:</strong> {getContributionValue()}
        </div>

        {contribution.description && (
          <div className="text-sm text-gray-600">
            <strong>Description:</strong> {contribution.description}
          </div>
        )}

        <div className="flex items-center text-sm text-gray-500">
          <Calendar className="h-4 w-4 me-1" />
          Contributed on {new Date(contribution.contribution_date).toLocaleDateString()}
        </div>

        {contribution.project?.location && (
          <div className="text-sm text-gray-500">
            <strong>Project Location:</strong> {contribution.project.location}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
