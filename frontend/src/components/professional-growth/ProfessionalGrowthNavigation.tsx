
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home, ArrowRight, Trophy, Users, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NavigationItem {
  label: string;
  href: string;
  category: string;
}

interface RelatedPage {
  title: string;
  description: string;
  href: string;
  category: 'core' | 'innovation' | 'community';
  icon: React.ReactNode;
}

const navigationMap: Record<string, NavigationItem[]> = {
  '/skills-marketplace': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Skills Marketplace', href: '/skills-marketplace', category: 'current' }
  ],
  '/professional-certifications': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Professional Certifications', href: '/professional-certifications', category: 'current' }
  ],
  '/leadership': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Leadership Development', href: '/leadership', category: 'current' }
  ],
  '/innovation': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Innovation Hub', href: '/innovation', category: 'current' }
  ],
  '/startup': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Startup Ecosystem', href: '/startup', category: 'current' }
  ],
  '/business-development': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Business Development', href: '/business-development', category: 'current' }
  ],
  '/mentorship': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Mentorship Programs', href: '/mentorship', category: 'current' }
  ],
  '/networking': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Networking Events', href: '/networking', category: 'current' }
  ],
  '/industry-networks': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Industry Networks', href: '/industry-networks', category: 'current' }
  ],
  '/success-stories': [
    { label: 'Professional Growth', href: '/professional-growth', category: 'section' },
    { label: 'Success Stories', href: '/success-stories', category: 'current' }
  ]
};

const relatedPages: Record<string, RelatedPage[]> = {
  '/skills-marketplace': [
    {
      title: 'Professional Certifications',
      description: 'Validate your skills with industry-recognized credentials',
      href: '/professional-certifications',
      category: 'core',
      icon: <Trophy className="h-5 w-5" />
    },
    {
      title: 'Mentorship Programs',
      description: 'Connect with experienced professionals for guidance',
      href: '/mentorship',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Innovation Hub',
      description: 'Apply your skills to innovative projects',
      href: '/innovation',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    }
  ],
  '/professional-certifications': [
    {
      title: 'Skills Marketplace',
      description: 'Assess and develop your professional skills',
      href: '/skills-marketplace',
      category: 'core',
      icon: <Trophy className="h-5 w-5" />
    },
    {
      title: 'Leadership Development',
      description: 'Enhance your leadership capabilities',
      href: '/leadership',
      category: 'core',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Business Development',
      description: 'Grow your business and entrepreneurial skills',
      href: '/business-development',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    }
  ],
  '/leadership': [
    {
      title: 'Mentorship Programs',
      description: 'Learn from experienced leaders',
      href: '/mentorship',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Business Development',
      description: 'Apply leadership skills to business growth',
      href: '/business-development',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      title: 'Industry Networks',
      description: 'Connect with industry leaders',
      href: '/industry-networks',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    }
  ],
  '/innovation': [
    {
      title: 'Startup Ecosystem',
      description: 'Turn your innovations into viable ventures',
      href: '/startup',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      title: 'Skills Marketplace',
      description: 'Develop skills needed for innovation',
      href: '/skills-marketplace',
      category: 'core',
      icon: <Trophy className="h-5 w-5" />
    },
    {
      title: 'Networking Events',
      description: 'Connect with fellow innovators',
      href: '/networking',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    }
  ],
  '/startup': [
    {
      title: 'Innovation Hub',
      description: 'Develop innovative solutions for your startup',
      href: '/innovation',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      title: 'Business Development',
      description: 'Scale and grow your startup',
      href: '/business-development',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      title: 'Mentorship Programs',
      description: 'Get guidance from successful entrepreneurs',
      href: '/mentorship',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    }
  ],
  '/business-development': [
    {
      title: 'Leadership Development',
      description: 'Build leadership skills for business success',
      href: '/leadership',
      category: 'core',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Industry Networks',
      description: 'Build strategic business partnerships',
      href: '/industry-networks',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Startup Ecosystem',
      description: 'Explore startup opportunities and ventures',
      href: '/startup',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    }
  ],
  '/mentorship': [
    {
      title: 'Leadership Development',
      description: 'Develop your leadership potential',
      href: '/leadership',
      category: 'core',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Success Stories',
      description: 'Learn from successful mentorship journeys',
      href: '/success-stories',
      category: 'community',
      icon: <Trophy className="h-5 w-5" />
    },
    {
      title: 'Skills Marketplace',
      description: 'Identify skills to develop with your mentor',
      href: '/skills-marketplace',
      category: 'core',
      icon: <Trophy className="h-5 w-5" />
    }
  ],
  '/networking': [
    {
      title: 'Industry Networks',
      description: 'Connect with sector-specific communities',
      href: '/industry-networks',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Mentorship Programs',
      description: 'Find mentors through networking',
      href: '/mentorship',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Innovation Hub',
      description: 'Network with innovative professionals',
      href: '/innovation',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    }
  ],
  '/industry-networks': [
    {
      title: 'Networking Events',
      description: 'Attend industry-specific networking events',
      href: '/networking',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Business Development',
      description: 'Leverage networks for business growth',
      href: '/business-development',
      category: 'innovation',
      icon: <Lightbulb className="h-5 w-5" />
    },
    {
      title: 'Leadership Development',
      description: 'Connect with industry leaders',
      href: '/leadership',
      category: 'core',
      icon: <Users className="h-5 w-5" />
    }
  ],
  '/success-stories': [
    {
      title: 'Mentorship Programs',
      description: 'Find mentors who can guide your success',
      href: '/mentorship',
      category: 'community',
      icon: <Users className="h-5 w-5" />
    },
    {
      title: 'Skills Marketplace',
      description: 'Develop skills showcased in success stories',
      href: '/skills-marketplace',
      category: 'core',
      icon: <Trophy className="h-5 w-5" />
    },
    {
      title: 'Leadership Development',
      description: 'Learn leadership from successful leaders',
      href: '/leadership',
      category: 'core',
      icon: <Users className="h-5 w-5" />
    }
  ]
};

const quickAccessItems = [
  { label: 'Skills Assessment', href: '/skills-marketplace', icon: <Trophy className="h-4 w-4" /> },
  { label: 'Find Mentor', href: '/mentorship', icon: <Users className="h-4 w-4" /> },
  { label: 'Get Certified', href: '/professional-certifications', icon: <Trophy className="h-4 w-4" /> },
  { label: 'Join Innovation', href: '/innovation', icon: <Lightbulb className="h-4 w-4" /> }
];

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'core': return 'bg-blue-100 text-blue-800';
    case 'innovation': return 'bg-purple-100 text-purple-800';
    case 'community': return 'bg-green-100 text-green-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export const ProfessionalGrowthBreadcrumbs: React.FC = () => {
  const location = useLocation();
  const breadcrumbs = navigationMap[location.pathname] || [];

  return (
    <nav className="flex items-center space-x-2 text-sm text-muted-foreground mb-6">
      <Link to="/" className="hover:text-foreground flex items-center">
        <Home className="h-4 w-4 mr-1" />
        Home
      </Link>
      {breadcrumbs.map((item, index) => (
        <React.Fragment key={index}>
          <ChevronRight className="h-4 w-4" />
          {item.category === 'current' ? (
            <span className="text-foreground font-medium">{item.label}</span>
          ) : (
            <Link to={item.href} className="hover:text-foreground">
              {item.label}
            </Link>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
};

export const RelatedPagesSection: React.FC = () => {
  const location = useLocation();
  const related = relatedPages[location.pathname] || [];

  if (related.length === 0) return null;

  return (
    <section className="mt-12 pt-8 border-t">
      <h2 className="text-2xl font-bold mb-6">Continue Your Professional Growth Journey</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {related.map((page, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to={page.href}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {page.icon}
                    <CardTitle className="text-lg">{page.title}</CardTitle>
                  </div>
                  <Badge variant="outline" className={getCategoryColor(page.category)}>
                    {page.category}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-3">{page.description}</p>
                <div className="flex items-center text-sm text-[rgb(var(--pg-secondary))] font-medium">
                  Explore <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </section>
  );
};

export const QuickAccessNavigation: React.FC = () => {
  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Card className="shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Quick Access</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex flex-col gap-2">
            {quickAccessItems.map((item, index) => (
              <Link key={index} to={item.href}>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  {item.icon}
                  <span className="ml-2 text-xs">{item.label}</span>
                </Button>
              </Link>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export const ProfessionalGrowthProgress: React.FC<{ currentStep: number; totalSteps: number; stepLabel: string }> = ({
  currentStep,
  totalSteps,
  stepLabel
}) => {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <div className="mb-6 p-4 bg-gradient-to-r from-[rgb(var(--pg-gradient-from))] to-[rgb(var(--pg-gradient-to))] rounded-lg text-white">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Professional Growth Progress</span>
        <span className="text-sm">{currentStep} of {totalSteps}</span>
      </div>
      <div className="w-full bg-white/20 rounded-full h-2 mb-2">
        <div 
          className="bg-white h-2 rounded-full transition-all duration-300" 
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-sm opacity-90">{stepLabel}</p>
    </div>
  );
};

export const ProfessionalGrowthCTA: React.FC<{ title: string; description: string; actionLabel: string; actionHref: string }> = ({
  title,
  description,
  actionLabel,
  actionHref
}) => {
  return (
    <div className="mt-8 p-6 bg-gradient-to-r from-[rgb(var(--pg-gradient-from))] to-[rgb(var(--pg-gradient-to))] rounded-lg text-white text-center">
      <h3 className="text-xl font-bold mb-2">{title}</h3>
      <p className="mb-4 opacity-90">{description}</p>
      <Link to={actionHref}>
        <Button variant="secondary" className="bg-white text-[rgb(var(--pg-primary))] hover:bg-white/90">
          {actionLabel}
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </Link>
    </div>
  );
};
