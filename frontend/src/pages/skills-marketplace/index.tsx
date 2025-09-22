
import React, { useState, useEffect } from 'react';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent, EmptyTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';
import { AuthenticationRequired } from '@/components/auth/AuthenticationRequired';
import { Button } from '@/components/ui/button';
import { 
  Search, 
  Users, 
  Briefcase, 
  Star, 
  TrendingUp,
  Plus,
  ArrowRightLeft,
  BarChart
} from 'lucide-react';
import { SkillsMarketplaceDashboard } from '@/components/skills-marketplace/SkillsMarketplaceDashboard';
import { OpportunitiesList } from '@/components/skills-marketplace/OpportunitiesList';
import { CreateOpportunityDialog } from '@/components/skills-marketplace/CreateOpportunityDialog';
import { UserSkillsManager } from '@/components/skills-marketplace/UserSkillsManager';
import { SkillExchangeBoard } from '@/components/skills-marketplace/SkillExchangeBoard';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SkillsMarketplacePage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOpportunities: 0,
    activeProjects: 0,
    skillExchanges: 0,
    successRate: 0
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // These would be real API calls in a production app
      setStats({
        totalOpportunities: 45,
        activeProjects: 12,
        skillExchanges: 8,
        successRate: 92
      });
    } catch (error) {
      // Handle error silently for demo
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <ProfessionalGrowthLayout
        title="Skills Marketplace"
        description="Connect, collaborate, and exchange skills with professionals worldwide"
        icon={<Briefcase className="h-8 w-8 text-white" />}
        tabs={[]}
        showQuickAccess={false}
      >
        <AuthenticationRequired 
          message="Please log in to access the skills marketplace and start collaborating with other professionals" 
          icon={<Users className="h-12 w-12 text-muted-foreground mb-4" />}
        />
      </ProfessionalGrowthLayout>
    );
  }

  if (loading) {
    return (
      <ProfessionalGrowthLayout
        title="Skills Marketplace"
        description="Connect, collaborate, and exchange skills with professionals worldwide"
        icon={<Briefcase className="h-8 w-8 text-white" />}
        tabs={[]}
        showQuickAccess={false}
      >
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </ProfessionalGrowthLayout>
    );
  }

  const statsItems: StatItem[] = [
    {
      value: stats.totalOpportunities.toString(),
      label: "Open Opportunities",
      icon: Briefcase
    },
    {
      value: stats.activeProjects.toString(),
      label: "Active Projects",
      icon: TrendingUp
    },
    {
      value: stats.skillExchanges.toString(),
      label: "Skill Exchanges",
      icon: ArrowRightLeft
    },
    {
      value: `${stats.successRate}%`,
      label: "Success Rate",
      icon: Star
    }
  ];

  const tabs: TabItem[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <TrendingUp className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Dashboard"
          icon={<TrendingUp className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Overview of your skills marketplace activity"
        >
          <SkillsMarketplaceDashboard />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "browse",
      label: "Browse Opportunities",
      icon: <Search className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Browse Opportunities"
          icon={<Search className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Find projects and collaborations that match your skills"
          action={
            <CreateOpportunityDialog>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Post Opportunity
              </Button>
            </CreateOpportunityDialog>
          }
        >
          <OpportunitiesList />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "my-skills",
      label: "My Skills",
      icon: <Users className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="My Skills"
          icon={<Users className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Manage your skills profile and showcase your expertise"
        >
          <UserSkillsManager />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "skill-exchange",
      label: "Skill Exchange",
      icon: <ArrowRightLeft className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title="Skill Exchange"
          icon={<ArrowRightLeft className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description="Exchange skills with other professionals through collaborative learning"
        >
          <SkillExchangeBoard />
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: <BarChart className="h-4 w-4" />,
      content: (
        <EmptyTabContent
          icon={BarChart}
          title="Skills Analytics"
          description="Track your skills development and marketplace activity over time."
          actionLabel="Enable Analytics"
          onAction={() => toast({ title: "Analytics coming soon!", description: "We're working on advanced analytics features." })}
        />
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Skills Marketplace"
      description="Connect, collaborate, and exchange skills with professionals worldwide. Build your professional network and accelerate your career growth through meaningful collaborations."
      icon={<Briefcase className="h-8 w-8 text-white" />}
      stats={statsItems}
      tabs={tabs}
      defaultTab="dashboard"
      showProgress={true}
      progressStep={2}
      totalSteps={5}
      stepLabel="Skills Assessment & Profile Setup"
      ctaTitle="Ready to Take the Next Step?"
      ctaDescription="Complete your skills assessment and start connecting with professionals in your field"
      ctaActionLabel="Get Professional Certification"
      ctaActionHref="/professional-certifications"
    />
  );
};

export default SkillsMarketplacePage;
