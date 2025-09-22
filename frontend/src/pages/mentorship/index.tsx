import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  Users, 
  UserCheck, 
  Calendar, 
  Star, 
  MessageCircle,
  BookOpen,
  Search,
  UserPlus
} from 'lucide-react';
import { FindMentorsTab } from '@/components/mentorship/FindMentorsTab';
import { MyMentorshipsTab } from '@/components/mentorship/MyMentorshipsTab';
import { MentorApplicationsTab } from '@/components/mentorship/MentorApplicationsTab';
import { MentorshipResourcesTab } from '@/components/mentorship/MentorshipResourcesTab';

const MentorshipProgramsPage: React.FC = () => {
  const { t } = useTranslation('mentorship');

  const stats: StatItem[] = [
    {
      value: "300+",
      label: t('stats.activeMentors'),
      icon: UserCheck
    },
    {
      value: "800+",
      label: t('stats.mentees'),
      icon: Users
    },
    {
      value: "1,500+",
      label: t('stats.sessionsCompleted'),
      icon: Calendar
    },
    {
      value: "4.8/5",
      label: t('stats.averageRating'),
      icon: Star
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "find-mentors",
      label: t('tabs.findMentors.label'),
      icon: <Search className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.findMentors.title')}
          icon={<Search className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
          description={t('tabs.findMentors.description')}
        >
          <FindMentorsTab />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "my-mentorships",
      label: t('tabs.myMentorships.label'),
      icon: <MessageCircle className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.myMentorships.title')}
          icon={<MessageCircle className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.myMentorships.description')}
        >
          <MyMentorshipsTab />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "mentor-applications",
      label: t('tabs.mentorApplications.label'),
      icon: <UserPlus className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.mentorApplications.title')}
          icon={<UserPlus className="h-5 w-5 text-[rgb(var(--pg-accent))]" />}
          description={t('tabs.mentorApplications.description')}
        >
          <MentorApplicationsTab />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "resources",
      label: t('tabs.resources.label'),
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.resources.title')}
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-primary))]" />}
          description={t('tabs.resources.description')}
        >
          <MentorshipResourcesTab />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title={t('title')}
      description={t('description')}
      icon={<Users className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="find-mentors"
      ctaTitle={t('cta.title')}
      ctaDescription={t('cta.description')}
      ctaActionLabel={t('cta.actionLabel')}
      ctaActionHref="#find-mentors"
      showProgress={false}
    />
  );
};

export default MentorshipProgramsPage;

