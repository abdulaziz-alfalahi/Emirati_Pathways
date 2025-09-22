
import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Compass, Search, Filter, BookOpen, Users, Calendar, FileText, Plus, ArrowRight } from 'lucide-react';
import { ProfessionalGrowthLayout } from '@/components/professional-growth/ProfessionalGrowthLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CareerTransitionResource {
  id: string;
  created_at: string;
  title: string;
  type: string;
  description: string;
  source_from_industry: string | null;
  target_to_industry: string | null;
  required_skills_summary: string | null;
  estimated_transition_time: string | null;
  content_url: string | null;
  content_markdown: string | null;
  image_url: string | null;
  tags: string[] | null;
  status: string;
}

const CareerTransitionPage = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [filterByType, setFilterByType] = useState('all');
  const [filterByIndustry, setFilterByIndustry] = useState('all');

  const { data: resources = [], isLoading } = useQuery({
    queryKey: ['career-transition-resources'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('career_transition_resources')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as CareerTransitionResource[];
    }
  });

  const filteredAndSortedResources = useMemo(() => {
    let filtered = resources.filter(resource => {
      const matchesSearch = !searchQuery || 
        resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.source_from_industry?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        resource.target_to_industry?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesType = filterByType === 'all' || resource.type === filterByType;
      
      const matchesIndustry = filterByIndustry === 'all' || 
        resource.source_from_industry?.toLowerCase().includes(filterByIndustry.toLowerCase()) ||
        resource.target_to_industry?.toLowerCase().includes(filterByIndustry.toLowerCase());
      
      return matchesSearch && matchesType && matchesIndustry;
    });

    // Sort resources
    filtered.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });

    return filtered;
  }, [resources, searchQuery, sortBy, filterByType, filterByIndustry]);

  const getFilteredResources = (types: string[]) => {
    return filteredAndSortedResources.filter(resource => types.includes(resource.type));
  };

  const handleAddResource = () => {
    toast({
      title: "Admin: Manage Career Transition Resources",
      description: "Coming Soon - Resource management functionality will be available here.",
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return <BookOpen className="h-4 w-4" />;
      case 'success_story': return <Users className="h-4 w-4" />;
      case 'tool': return <FileText className="h-4 w-4" />;
      case 'course_pathway': return <Calendar className="h-4 w-4" />;
      case 'webinar': return <Calendar className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'guide': return 'bg-blue-100 text-blue-800';
      case 'success_story': return 'bg-green-100 text-green-800';
      case 'tool': return 'bg-purple-100 text-purple-800';
      case 'course_pathway': return 'bg-orange-100 text-orange-800';
      case 'webinar': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const ResourceCard = ({ resource }: { resource: CareerTransitionResource }) => (
    <Card className="h-full hover:shadow-lg transition-shadow">
      <div className="aspect-video relative overflow-hidden rounded-t-lg">
        <img 
          src={resource.image_url || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=500&q=60'} 
          alt={resource.title}
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <Badge className={`flex items-center gap-1 ${getTypeColor(resource.type)}`}>
            {getTypeIcon(resource.type)}
            {resource.type.replace('_', ' ').charAt(0).toUpperCase() + resource.type.replace('_', ' ').slice(1)}
          </Badge>
          {resource.estimated_transition_time && (
            <Badge variant="outline" className="text-xs">
              {resource.estimated_transition_time}
            </Badge>
          )}
        </div>
        <CardTitle className="text-lg leading-tight">{resource.title}</CardTitle>
        {(resource.source_from_industry || resource.target_to_industry) && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {resource.source_from_industry && (
              <span className="bg-gray-100 px-2 py-1 rounded text-xs">{resource.source_from_industry}</span>
            )}
            {resource.source_from_industry && resource.target_to_industry && (
              <ArrowRight className="h-3 w-3" />
            )}
            {resource.target_to_industry && (
              <span className="bg-ehrdc-teal/10 text-ehrdc-teal px-2 py-1 rounded text-xs">{resource.target_to_industry}</span>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
          {resource.description}
        </p>
        {resource.required_skills_summary && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground mb-1">Required Skills:</p>
            <p className="text-xs text-muted-foreground">{resource.required_skills_summary}</p>
          </div>
        )}
        {resource.tags && resource.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {resource.tags.slice(0, 3).map((tag, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {tag.replace('_', ' ')}
              </Badge>
            ))}
            {resource.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{resource.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
        <Button 
          className="w-full bg-ehrdc-teal hover:bg-ehrdc-teal/90"
          onClick={() => {
            if (resource.content_url) {
              window.open(resource.content_url, '_blank');
            } else {
              toast({
                title: "Content Preview",
                description: "Full content viewing functionality coming soon.",
              });
            }
          }}
        >
          {resource.type === 'tool' ? 'Use Tool' : 'View Resource'}
        </Button>
      </CardContent>
    </Card>
  );

  const FilterControls = () => (
    <div className="flex flex-col sm:flex-row gap-4 mb-6">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search resources..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={sortBy} onValueChange={setSortBy}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Sort by" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest First</SelectItem>
          <SelectItem value="title">Title A-Z</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterByType} onValueChange={setFilterByType}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter by type" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Types</SelectItem>
          <SelectItem value="guide">Guides</SelectItem>
          <SelectItem value="success_story">Success Stories</SelectItem>
          <SelectItem value="tool">Tools</SelectItem>
          <SelectItem value="course_pathway">Course Pathways</SelectItem>
          <SelectItem value="webinar">Webinars</SelectItem>
        </SelectContent>
      </Select>
      <Select value={filterByIndustry} onValueChange={setFilterByIndustry}>
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Filter by industry" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Industries</SelectItem>
          <SelectItem value="technology">Technology</SelectItem>
          <SelectItem value="finance">Finance</SelectItem>
          <SelectItem value="healthcare">Healthcare</SelectItem>
          <SelectItem value="energy">Energy</SelectItem>
          <SelectItem value="marketing">Marketing</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const ResourceGrid = ({ resources }: { resources: CareerTransitionResource[] }) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-gray-200 aspect-video rounded-t-lg"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (resources.length === 0) {
      return (
        <div className="text-center py-12">
          <Compass className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No resources found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search or filter criteria.
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((resource) => (
          <ResourceCard key={resource.id} resource={resource} />
        ))}
      </div>
    );
  };

  const stats = [
    {
      value: `${resources.length}+`,
      label: "Transition Resources",
      icon: BookOpen,
    },
    {
      value: "Personalized Pathways",
      label: "Coming Soon", 
      icon: Compass,
    },
    {
      value: `${resources.filter(r => r.type === 'success_story').length}+`,
      label: "Success Stories",
      icon: Users,
    }
  ];

  const tabs = [
    {
      id: "all",
      label: "All Resources",
      icon: <Search className="h-4 w-4" />,
      content: (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-ehrdc-teal mb-2">All Career Transition Resources</h2>
              <p className="text-muted-foreground">
                Discover comprehensive resources to guide your career transition journey
              </p>
            </div>
            {user && hasRole('administrator') && (
              <Button onClick={handleAddResource} className="bg-ehrdc-teal hover:bg-ehrdc-teal/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Resource
              </Button>
            )}
          </div>
          <FilterControls />
          <ResourceGrid resources={filteredAndSortedResources} />
        </div>
      )
    },
    {
      id: "guides",
      label: "Transition Guides",
      icon: <BookOpen className="h-4 w-4" />,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ehrdc-teal mb-2">Transition Guides</h2>
            <p className="text-muted-foreground">
              Step-by-step guides to help you navigate your career transition
            </p>
          </div>
          <ResourceGrid resources={getFilteredResources(['guide'])} />
        </div>
      )
    },
    {
      id: "stories",
      label: "Success Stories",
      icon: <Users className="h-4 w-4" />,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ehrdc-teal mb-2">Success Stories</h2>
            <p className="text-muted-foreground">
              Real stories from professionals who successfully transitioned careers
            </p>
          </div>
          <ResourceGrid resources={getFilteredResources(['success_story'])} />
        </div>
      )
    },
    {
      id: "tools",
      label: "Tools & Pathways",
      icon: <FileText className="h-4 w-4" />,
      content: (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-ehrdc-teal mb-2">Tools & Pathways</h2>
            <p className="text-muted-foreground">
              Interactive tools and structured pathways to support your transition
            </p>
          </div>
          <ResourceGrid resources={getFilteredResources(['tool', 'course_pathway'])} />
        </div>
      )
    }
  ];

  return (
    <ProfessionalGrowthLayout
      title="Career Transition"
      description="Navigate your next career move with confidence. Explore resources, tools, and inspiring stories to guide your transition to new roles or industries."
      icon={<Compass className="h-10 w-10" />}
      stats={stats}
      tabs={tabs}
      defaultTab="all"
    />
  );
};

export default CareerTransitionPage;
