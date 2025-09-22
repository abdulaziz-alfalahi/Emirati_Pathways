
import React from 'react';
import { TrainingWorkshopsTab } from './TrainingWorkshopsTab';
import { LeadershipOpportunitiesTab } from './LeadershipOpportunitiesTab';
import { SuccessStoriesTab } from './SuccessStoriesTab';

interface CommunityLeadershipContentProps {
  activeTab: string;
}

export const CommunityLeadershipContent: React.FC<CommunityLeadershipContentProps> = ({ activeTab }) => {
  switch (activeTab) {
    case 'training':
      return <TrainingWorkshopsTab />;
    case 'opportunities':
      return <LeadershipOpportunitiesTab />;
    case 'stories':
      return <SuccessStoriesTab />;
    default:
      return <TrainingWorkshopsTab />;
  }
};
