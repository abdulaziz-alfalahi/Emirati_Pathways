import React from 'react';
import { useTranslation } from 'react-i18next';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  Users, 
  Calendar, 
  MapPin, 
  Star, 
  Briefcase,
  Coffee,
  Building,
  TrendingUp
} from 'lucide-react';

const NetworkingEventsPage: React.FC = () => {
  const { t } = useTranslation('networking');

  const stats: StatItem[] = [
    {
      value: "150+",
      label: t('stats.monthlyEvents'),
      icon: Calendar
    },
    {
      value: "5,000+",
      label: t('stats.activeMembers'),
      icon: Users
    },
    {
      value: "50+",
      label: t('stats.industryPartners'),
      icon: Building
    },
    {
      value: "4.7/5",
      label: t('stats.eventRating'),
      icon: Star
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "events",
      label: t('tabs.events.label'),
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.events.title')}
          icon={<Calendar className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.events.description')}
        >
          <EmptyTabContent
            icon={Calendar}
            title={t('events.title')}
            description={t('events.description')}
            actionLabel={t('events.actionLabel')}
            onAction={() => console.log("View networking events")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "my-events",
      label: t('tabs.myEvents.label'),
      icon: <Star className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.myEvents.title')}
          icon={<Star className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.myEvents.description')}
        >
          <EmptyTabContent
            icon={Star}
            title={t('myEvents.title')}
            description={t('myEvents.description')}
            actionLabel={t('myEvents.actionLabel')}
            onAction={() => console.log("View my events")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "meetups",
      label: t('tabs.meetups.label'),
      icon: <Coffee className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.meetups.title')}
          icon={<Coffee className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.meetups.description')}
        >
          <EmptyTabContent
            icon={Coffee}
            title={t('meetups.title')}
            description={t('meetups.description')}
            actionLabel={t('meetups.actionLabel')}
            onAction={() => console.log("Find informal meetups")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "virtual",
      label: t('tabs.virtual.label'),
      icon: <MapPin className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.virtual.title')}
          icon={<MapPin className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.virtual.description')}
        >
          <EmptyTabContent
            icon={MapPin}
            title={t('virtual.title')}
            description={t('virtual.description')}
            actionLabel={t('virtual.actionLabel')}
            onAction={() => console.log("Join virtual networking")}
          />
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
      defaultTab="events"
    />
  );
};

export default NetworkingEventsPage;

