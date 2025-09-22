import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Search, Filter, ExternalLink, Mail, Globe, UserPlus, Network, Heart, Star } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { ProfessionalGrowthLayout, StatItem, TabItem } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { ProfessionalGrowthTabContent } from '@/components/professional-growth/ProfessionalGrowthTabContent';

interface Community {
  id: string;
  name: string;
  description: string;
  focus_area: string;
  community_type: string;
  member_count: number;
  logo_url?: string;
  website_url?: string;
  contact_email?: string;
  is_active: boolean;
  created_at: string;
}

const CommunitiesPage: React.FC = () => {
  const { t } = useTranslation('communities');
  const [communities, setCommunities] = useState<Community[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [focusAreaFilter, setFocusAreaFilter] = useState<string>('all');
  const [communityTypeFilter, setCommunityTypeFilter] = useState<string>('all');
  const { toast } = useToast();

  const fetchCommunities = async () => {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_active', true)
        .order('member_count', { ascending: false });

      if (error) throw error;
      
      setCommunities(data || []);
      setFilteredCommunities(data || []);
    } catch (error) {
      console.error('Error fetching communities:', error);
      toast({
        title: t('messages.errorLoading', 'Error loading communities'),
        description: t('messages.errorLoading', 'Error loading communities'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunities();
  }, []);

  useEffect(() => {
    let filtered = communities;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(community => 
        community.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        community.focus_area.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply focus area filter
    if (focusAreaFilter !== 'all') {
      filtered = filtered.filter(community => 
        community.focus_area.toLowerCase() === focusAreaFilter.toLowerCase()
      );
    }

    // Apply community type filter
    if (communityTypeFilter !== 'all') {
      filtered = filtered.filter(community => 
        community.community_type.toLowerCase() === communityTypeFilter.toLowerCase()
      );
    }

    setFilteredCommunities(filtered);
  }, [searchQuery, focusAreaFilter, communityTypeFilter, communities]);

  const totalMembers = communities.reduce((sum, community) => sum + community.member_count, 0);
  const activeCommunities = communities.filter(c => c.is_active).length;
  const focusAreas = [...new Set(communities.map(c => c.focus_area))];
  const communityTypes = [...new Set(communities.map(c => c.community_type))];

  // Professional Growth themed statistics - ALL TRANSLATED
  const stats: StatItem[] = [
    {
      value: activeCommunities.toString(),
      label: t('stats.activeCommunitiesLabel', "Active Communities"),
      icon: Users
    },
    {
      value: totalMembers.toLocaleString(),
      label: t('stats.totalMembersLabel', "Total Members"),
      icon: Network
    },
    {
      value: focusAreas.length.toString(),
      label: t('stats.focusAreasLabel', "Focus Areas"),
      icon: Star
    },
    {
      value: t('stats.satisfactionValue', "95%"),
      label: t('stats.satisfactionLabel', "Member Satisfaction"),
      icon: Heart
    }
  ];

  const CommunityGrid = ({ communities }: { communities: Community[] }) => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {communities.map((community) => (
        <Card key={community.id} className="h-full hover:shadow-lg transition-all duration-200 hover:scale-[1.02]">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                {community.logo_url ? (
                  <div className="h-12 w-12 rounded-full overflow-hidden bg-muted">
                    <img 
                      src={community.logo_url} 
                      alt={community.name} 
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-12 w-12 rounded-full bg-[rgb(var(--pg-secondary))]/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-[rgb(var(--pg-secondary))]" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-lg">{community.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {t(`communityTypes.${community.community_type.toLowerCase().replace(/\s+/g, '')}`, community.community_type)}
                  </CardDescription>
                </div>
              </div>
              <Badge 
                variant="secondary" 
                className="text-xs bg-[rgb(var(--pg-accent))]/10 text-[rgb(var(--pg-accent))] border-[rgb(var(--pg-accent))]/20"
              >
                {t(`focusAreas.${community.focus_area.toLowerCase().replace(/\s+/g, '')}`, community.focus_area)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground line-clamp-3">
              {community.description}
            </p>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {community.member_count.toLocaleString()} {community.member_count === 1 ? t('community.member', 'member') : t('community.members', 'members')}
              </span>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 border-[rgb(var(--pg-secondary))] text-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))] hover:text-white"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('community.joinCommunity', 'Join Community')}
              </Button>
              {community.website_url && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={community.website_url} target="_blank" rel="noopener noreferrer" title={t('community.visitWebsite', 'Visit Website')}>
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              )}
              {community.contact_email && (
                <Button variant="ghost" size="sm" asChild>
                  <a href={`mailto:${community.contact_email}`} title={t('community.contactEmail', 'Contact Email')}>
                    <Mail className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const FilterSection = () => (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />
          {t('filters.title', 'Filters')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.searchPlaceholder', 'Search communities...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={focusAreaFilter} onValueChange={setFocusAreaFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.focusAreaFilter', 'Focus Area')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allFocusAreas', 'All Focus Areas')}</SelectItem>
              {focusAreas.map(area => (
                <SelectItem key={area} value={area.toLowerCase()}>
                  {t(`focusAreas.${area.toLowerCase().replace(/\s+/g, '')}`, area)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={communityTypeFilter} onValueChange={setCommunityTypeFilter}>
            <SelectTrigger>
              <SelectValue placeholder={t('filters.communityTypeFilter', 'Community Type')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allCommunityTypes', 'All Types')}</SelectItem>
              {communityTypes.map(type => (
                <SelectItem key={type} value={type.toLowerCase()}>
                  {t(`communityTypes.${type.toLowerCase().replace(/\s+/g, '')}`, type)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );

  // ALL TAB CONTENT TRANSLATED
  const tabs: TabItem[] = [
    {
      id: 'browse',
      label: t('tabs.browse.label', 'Browse Communities'),
      icon: <Users className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.browse.title', 'Discover Communities')}
          icon={<Users className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.browse.description', 'Explore and join professional communities that align with your interests and career goals')}
        >
          <div className="space-y-6">
            <FilterSection />
            {filteredCommunities.length > 0 ? (
              <CommunityGrid communities={filteredCommunities} />
            ) : (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">{t('empty.title', 'No communities found')}</h3>
                  <p className="text-muted-foreground">
                    {t('empty.description', 'No communities match your current filters.')}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {t('empty.suggestion', 'Try adjusting your search criteria.')}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'my-communities',
      label: t('tabs.myCommunities.label', 'My Communities'),
      icon: <Heart className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.myCommunities.title', 'My Communities')}
          icon={<Heart className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.myCommunities.description', 'Manage your community memberships and track your engagement')}
        >
          <div className="text-center py-12">
            <Heart className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('tabs.myCommunities.contentTitle', 'Your Community Hub')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('tabs.myCommunities.contentDescription', 'Join communities to see them here. Track your participation, contributions, and connections.')}
            </p>
            <Button 
              className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))]/90 text-white"
              onClick={() => {
                // Switch to browse tab
                const browseTab = document.querySelector('[data-value="browse"]') as HTMLElement;
                browseTab?.click();
              }}
            >
              <Users className="h-4 w-4 mr-2" />
              {t('tabs.myCommunities.browseButton', 'Browse Communities')}
            </Button>
          </div>
        </ProfessionalGrowthTabContent>
      )
    },
    {
      id: 'create',
      label: t('tabs.create.label', 'Create Community'),
      icon: <UserPlus className="h-4 w-4" />,
      content: (
        <ProfessionalGrowthTabContent
          title={t('tabs.create.title', 'Create New Community')}
          icon={<UserPlus className="h-5 w-5 text-[rgb(var(--pg-secondary))]" />}
          description={t('tabs.create.description', 'Start your own professional community and bring like-minded individuals together')}
        >
          <div className="text-center py-12">
            <UserPlus className="h-16 w-16 text-[rgb(var(--pg-secondary))] mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">{t('tabs.create.contentTitle', 'Start Your Community')}</h3>
            <p className="text-muted-foreground max-w-md mx-auto mb-6">
              {t('tabs.create.contentDescription', 'Create a space for professionals to connect, share knowledge, and grow together in your area of expertise.')}
            </p>
            <Button 
              className="bg-[rgb(var(--pg-secondary))] hover:bg-[rgb(var(--pg-secondary))]/90 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {t('tabs.create.createButton', 'Create Community')}
            </Button>
          </div>
        </ProfessionalGrowthTabContent>
      )
    }
  ];

  if (loading) {
    return (
      <ProfessionalGrowthLayout
        title={t('title', 'Professional Communities')}
        description={t('description', 'Connect with like-minded professionals, share knowledge, and accelerate your career growth through meaningful community engagement')}
        icon={<Users className="h-8 w-8 text-white" />}
        stats={stats}
        tabs={[
          {
            id: 'loading',
            label: t('loading.label', 'Loading...'),
            icon: <Users className="h-4 w-4" />,
            content: (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[rgb(var(--pg-secondary))]"></div>
              </div>
            )
          }
        ]}
        defaultTab="loading"
      />
    );
  }

  return (
    <ProfessionalGrowthLayout
      title={t('title', 'Professional Communities')}
      description={t('description', 'Connect with like-minded professionals, share knowledge, and accelerate your career growth through meaningful community engagement')}
      icon={<Users className="h-8 w-8 text-white" />}
      stats={stats}
      tabs={tabs}
      defaultTab="browse"
      showProgress={true}
      progressStep={3}
      totalSteps={4}
      stepLabel={t('progressLabel', 'Community Engagement')}
      ctaTitle={t('cta.title', 'Ready to Lead?')}
      ctaDescription={t('cta.description', 'Take your professional growth to the next level by creating and leading your own community.')}
      ctaActionLabel={t('cta.actionLabel', 'Explore Leadership Opportunities')}
      ctaActionHref="/leadership"
    />
  );
};

export default CommunitiesPage;

