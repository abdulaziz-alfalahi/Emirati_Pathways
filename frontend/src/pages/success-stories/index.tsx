
import React, { useState } from 'react';
import { Plus, Users, FileText, Eye, Star } from 'lucide-react';
import { LifelongEngagementLayout } from '@/components/lifelong-engagement/LifelongEngagementLayout';
import SuccessStoriesShowcase from '@/components/success-stories/SuccessStoriesShowcase';
import StorySubmissionForm from '@/components/success-stories/StorySubmissionForm';
import { useAuth } from '@/context/AuthContext';

const SuccessStoriesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('browse');

  const stats = [
    { value: '150+', label: 'Success Stories', icon: Star },
    { value: '50+', label: 'Featured Stories', icon: Eye },
    { value: '25+', label: 'Categories', icon: FileText },
    { value: '1000+', label: 'Community Members', icon: Users }
  ];

  const tabs = [
    {
      id: 'browse',
      label: 'Explore Stories',
      icon: <Eye className="h-4 w-4" />,
      content: <SuccessStoriesShowcase />
    },
    {
      id: 'submit',
      label: 'Share Your Story',
      icon: <Plus className="h-4 w-4" />,
      content: (
        <StorySubmissionForm 
          onSubmissionComplete={() => setActiveTab('my-submissions')}
        />
      )
    }
  ];

  // Add "My Submissions" tab only if user is authenticated
  if (user) {
    tabs.push({
      id: 'my-submissions',
      label: 'My Submissions',
      icon: <FileText className="h-4 w-4" />,
      content: <SuccessStoriesShowcase showOnlyUserStories={true} />
    });
  }

  return (
    <LifelongEngagementLayout
      title="Emirati Journeys: Stories of Triumph"
      description="Discover inspiring success stories from Emiratis across various fields and life stages. Share your own journey to inspire others and celebrate the achievements that make our nation proud."
      icon={<Star className="h-12 w-12" />}
      stats={stats}
      tabs={tabs}
      defaultTab="browse"
    />
  );
};

export default SuccessStoriesPage;
