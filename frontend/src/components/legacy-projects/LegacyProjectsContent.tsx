
import React from 'react';
import { ExploreProjectsTab } from './ExploreProjectsTab';
import { MyContributionsTab } from './MyContributionsTab';
import { ProposeProjectTab } from './ProposeProjectTab';

interface LegacyProjectsContentProps {
  activeTab: string;
}

export const LegacyProjectsContent: React.FC<LegacyProjectsContentProps> = ({ activeTab }) => {
  switch (activeTab) {
    case 'explore':
      return <ExploreProjectsTab />;
    case 'contributions':
      return <MyContributionsTab />;
    case 'propose':
      return <ProposeProjectTab />;
    default:
      return <ExploreProjectsTab />;
  }
};
