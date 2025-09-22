
import React from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { 
  Crown, 
  Users, 
  Target, 
  TrendingUp, 
  Award,
  BookOpen,
  Calendar,
  Briefcase
} from 'lucide-react';

const LeadershipDevelopmentPage: React.FC = () => {
  const stats: StatItem[] = [
    {
      value: "100+",
      label: "Leadership Programs",
      icon: Crown
    },
    {
      value: "1,200+",
      label: "Leaders Trained",
      icon: Users
    },
    {
      value: "50+",
      label: "Executive Mentors",
      icon: Target
    },
    {
      value: "95%",
      label: "Promotion Rate",
      icon: TrendingUp
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "programs",
      label: "Leadership Programs",
      icon: <Crown className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Leadership Development Programs"
          icon={<Crown className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Comprehensive leadership development programs designed for emerging and established leaders"
        >
          <EmptyTabContent
            icon={Crown}
            title="Leadership Programs"
            description="Discover leadership development programs tailored to enhance your management and leadership capabilities."
            actionLabel="Explore Programs"
            onAction={() => console.log("Explore leadership programs")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "mentorship",
      label: "Executive Mentorship",
      icon: <Users className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Executive Mentorship"
          icon={<Users className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Connect with senior executives and industry leaders for personalized mentorship"
        >
          <EmptyTabContent
            icon={Users}
            title="Executive Mentorship"
            description="Connect with experienced executives and industry leaders for personalized guidance and career development."
            actionLabel="Find Mentors"
            onAction={() => console.log("Find executive mentors")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "workshops",
      label: "Workshops",
      icon: <Calendar className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Leadership Workshops"
          icon={<Calendar className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Attend interactive workshops focused on specific leadership skills and competencies"
        >
          <EmptyTabContent
            icon={Calendar}
            title="Leadership Workshops"
            description="Participate in hands-on workshops designed to develop specific leadership skills and competencies."
            actionLabel="View Workshops"
            onAction={() => console.log("View leadership workshops")}
          />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "resources",
      label: "Resources",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Leadership Resources"
          icon={<BookOpen className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Access comprehensive leadership development resources and tools"
        >
          <EmptyTabContent
            icon={BookOpen}
            title="Leadership Resources"
            description="Access books, articles, assessments, and tools to support your leadership development journey."
            actionLabel="Browse Resources"
            onAction={() => console.log("Browse leadership resources")}
          />
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Leadership Development"
      description="Develop essential leadership skills through comprehensive programs, mentorship opportunities, and executive training designed for the next generation of UAE leaders"
      icon={<Crown className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="programs"
      showProgress={true}
      progressStep={4}
      totalSteps={5}
      stepLabel="Leadership Skill Development"
      ctaTitle="Scale Your Impact Through Innovation"
      ctaDescription="Apply your leadership skills to drive innovation and create meaningful change"
      ctaActionLabel="Join Innovation Hub"
      ctaActionHref="/innovation"
    />
  );
};

export default LeadershipDevelopmentPage;
