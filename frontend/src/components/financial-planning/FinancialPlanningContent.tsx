import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ExternalLink, Clock, Star, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FinancialResource } from './types';

interface FinancialPlanningContentProps {
  category: 'budgeting' | 'investments' | 'retirement' | 'tools' | 'insurance' | 'education' | 'advisory';
}

export const FinancialPlanningContent: React.FC<FinancialPlanningContentProps> = ({ category }) => {
  const { t } = useTranslation('financial-planning');
  const [resources, setResources] = useState<FinancialResource[]>([]);
  const [filteredResources, setFilteredResources] = useState<FinancialResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');

  useEffect(() => {
    fetchResources();
  }, [category]);

  useEffect(() => {
    filterResources();
  }, [resources, searchTerm, difficultyFilter]);

  const fetchResources = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('financial_resources')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Type assertion to ensure the data matches our interface
      setResources((data || []) as FinancialResource[]);
    } catch (error) {
      console.error('Error fetching financial resources:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResources = () => {
    let filtered = resources;

    // Search filter
    if (searchTerm.trim()) {
      filtered = filtered.filter(resource =>
        resource.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        resource.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(resource => resource.difficulty_level === difficultyFilter);
    }

    setFilteredResources(filtered);
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner': return t('filters.beginner');
      case 'intermediate': return t('filters.intermediate');
      case 'advanced': return t('filters.advanced');
      default: return level;
    }
  };

  const getCategoryDescription = () => {
    return t(`tabs.${category}.description`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Description */}
      <div className="text-center">
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {getCategoryDescription()}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('filters.search')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t('filters.difficulty')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('filters.allLevels')}</SelectItem>
              <SelectItem value="beginner">{t('filters.beginner')}</SelectItem>
              <SelectItem value="intermediate">{t('filters.intermediate')}</SelectItem>
              <SelectItem value="advanced">{t('filters.advanced')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Featured Resources */}
      {filteredResources.some(r => r.is_featured) && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            {t('sections.featured')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {filteredResources
              .filter(resource => resource.is_featured)
              .map((resource) => (
                <ResourceCard 
                  key={resource.id} 
                  resource={resource} 
                  featured 
                  getDifficultyColor={getDifficultyColor}
                  getDifficultyLabel={getDifficultyLabel}
                  t={t}
                />
              ))}
          </div>
        </div>
      )}

      {/* All Resources */}
      <div>
        <h3 className="text-lg font-semibold mb-4">{t('sections.allResources')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources
            .filter(resource => !resource.is_featured)
            .map((resource) => (
              <ResourceCard 
                key={resource.id} 
                resource={resource} 
                getDifficultyColor={getDifficultyColor}
                getDifficultyLabel={getDifficultyLabel}
                t={t}
              />
            ))}
        </div>
      </div>

      {filteredResources.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="text-muted-foreground mb-4">
            <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">{t('emptyState.title')}</h3>
            <p>{t('emptyState.description')}</p>
          </div>
        </div>
      )}
    </div>
  );
};

const ResourceCard: React.FC<{ 
  resource: FinancialResource; 
  featured?: boolean;
  getDifficultyColor: (level: string) => string;
  getDifficultyLabel: (level: string) => string;
  t: (key: string) => string;
}> = ({ 
  resource, 
  featured = false,
  getDifficultyColor,
  getDifficultyLabel,
  t
}) => {
  return (
    <Card className={`hover:shadow-md transition-shadow ${featured ? 'border-yellow-200 bg-yellow-50/50' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg leading-tight flex items-center gap-2">
              {resource.title}
              {featured && (
                <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                  <Star className="h-3 w-3 mr-1" />
                  {t('resourceCard.featured')}
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="mt-2">
              {resource.description}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Tags and Difficulty */}
          <div className="flex flex-wrap gap-2">
            {resource.difficulty_level && (
              <Badge variant="outline" className={getDifficultyColor(resource.difficulty_level)}>
                {getDifficultyLabel(resource.difficulty_level)}
              </Badge>
            )}
            {resource.tags?.slice(0, 2).map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Read Time */}
          {resource.estimated_read_time && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{resource.estimated_read_time} {t('resourceCard.readTime')}</span>
            </div>
          )}

          {/* Action Button */}
          {resource.resource_url && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              asChild
            >
              <a
                href={resource.resource_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                {t('resourceCard.viewResource')}
                <ExternalLink className="h-3 w-3" />
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

