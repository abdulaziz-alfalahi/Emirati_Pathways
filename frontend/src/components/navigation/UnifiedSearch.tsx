/**
 * Unified Search Component
 * Provides cross-phase search capabilities with intelligent filtering
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Search,
  Filter,
  Clock,
  TrendingUp,
  Star,
  ArrowRight,
  X,
  MapPin
} from 'lucide-react';
import { usePhase, Phase } from '@/context/PhaseContext';
import { Link } from 'react-router-dom';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  phase: Phase;
  category: string;
  url: string;
  relevanceScore: number;
  tags: string[];
  estimatedTime?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

interface UnifiedSearchProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UnifiedSearch: React.FC<UnifiedSearchProps> = ({ isOpen, onClose }) => {
  const { currentPhase, phaseInfo, searchAcrossPhases } = usePhase();
  const [query, setQuery] = useState('');
  const [selectedPhases, setSelectedPhases] = useState<Phase[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Mock comprehensive search data
  const allSearchableContent: SearchResult[] = [
    // Education Phase
    {
      id: 'knowledge-camps-1',
      title: 'STEM Knowledge Camps',
      description: 'Science, technology, engineering, and mathematics programs for youth',
      phase: 'education',
      category: 'programs',
      url: '/knowledge-camps',
      relevanceScore: 95,
      tags: ['STEM', 'youth', 'summer', 'science'],
      estimatedTime: '2-8 weeks',
      difficulty: 'beginner'
    },
    {
      id: 'scholarships-1',
      title: 'University Scholarships',
      description: 'Financial aid for higher education opportunities',
      phase: 'education',
      category: 'funding',
      url: '/scholarships',
      relevanceScore: 90,
      tags: ['scholarship', 'university', 'funding', 'education'],
      difficulty: 'intermediate'
    },

    // Career Phase
    {
      id: 'job-matching-1',
      title: 'AI-Powered Job Matching',
      description: 'Find career opportunities that match your skills and interests',
      phase: 'career',
      category: 'tools',
      url: '/job-matching',
      relevanceScore: 88,
      tags: ['jobs', 'AI', 'matching', 'career'],
      estimatedTime: '15 minutes',
      difficulty: 'beginner'
    },
    {
      id: 'resume-builder-1',
      title: 'Professional Resume Builder',
      description: 'Create compelling resumes with industry-specific templates',
      phase: 'career',
      category: 'tools',
      url: '/resume-builder',
      relevanceScore: 85,
      tags: ['resume', 'CV', 'professional', 'template'],
      estimatedTime: '30-60 minutes',
      difficulty: 'beginner'
    },
    {
      id: 'interview-prep-1',
      title: 'Interview Preparation Hub',
      description: 'Practice interviews and get expert feedback',
      phase: 'career',
      category: 'preparation',
      url: '/interview-preparation',
      relevanceScore: 82,
      tags: ['interview', 'practice', 'feedback', 'preparation'],
      estimatedTime: '1-2 hours',
      difficulty: 'intermediate'
    },

    // Professional Phase
    {
      id: 'certifications-1',
      title: 'Professional Certifications',
      description: 'Industry-recognized certifications to advance your career',
      phase: 'professional',
      category: 'certification',
      url: '/professional-certifications',
      relevanceScore: 87,
      tags: ['certification', 'professional', 'industry', 'advancement'],
      difficulty: 'intermediate'
    },
    {
      id: 'mentorship-1',
      title: 'Mentorship Network',
      description: 'Connect with experienced professionals for guidance',
      phase: 'professional',
      category: 'networking',
      url: '/mentorship',
      relevanceScore: 84,
      tags: ['mentorship', 'networking', 'guidance', 'professional'],
      difficulty: 'beginner'
    },
    {
      id: 'digital-skills-1',
      title: 'Digital Skills Development',
      description: 'Technology and digital literacy programs',
      phase: 'professional',
      category: 'skills',
      url: '/digital-skills-development',
      relevanceScore: 86,
      tags: ['digital', 'technology', 'skills', 'literacy'],
      estimatedTime: '2-12 weeks',
      difficulty: 'intermediate'
    },

    // Lifelong Phase
    {
      id: 'success-stories-1',
      title: 'Share Success Stories',
      description: 'Inspire others by sharing your achievements and journey',
      phase: 'lifelong',
      category: 'inspiration',
      url: '/share-success-stories',
      relevanceScore: 80,
      tags: ['success', 'stories', 'inspiration', 'sharing'],
      estimatedTime: '20-30 minutes',
      difficulty: 'beginner'
    },
    {
      id: 'financial-planning-1',
      title: 'Financial Planning Tools',
      description: 'Comprehensive financial wellness and retirement planning',
      phase: 'lifelong',
      category: 'planning',
      url: '/financial-planning',
      relevanceScore: 83,
      tags: ['financial', 'planning', 'retirement', 'wellness'],
      difficulty: 'intermediate'
    },
    {
      id: 'thought-leadership-1',
      title: 'Thought Leadership Platform',
      description: 'Share industry insights and expert perspectives',
      phase: 'lifelong',
      category: 'leadership',
      url: '/thought-leadership',
      relevanceScore: 78,
      tags: ['thought', 'leadership', 'insights', 'expertise'],
      difficulty: 'advanced'
    }
  ];

  // Available categories
  const categories = ['tools', 'programs', 'funding', 'certification', 'networking', 'skills', 'preparation', 'inspiration', 'planning', 'leadership'];

  // Perform search
  const performSearch = useMemo(() => {
    if (!query.trim()) return [];

    setIsLoading(true);

    const filtered = allSearchableContent.filter(item => {
      const matchesQuery =
        item.title.toLowerCase().includes(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));

      const matchesPhase = selectedPhases.length === 0 || selectedPhases.includes(item.phase);
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(item.category);

      return matchesQuery && matchesPhase && matchesCategory;
    });

    // Sort by relevance and current phase priority
    const sorted = filtered.sort((a, b) => {
      // Boost current phase results
      const aCurrentPhase = a.phase === currentPhase ? 10 : 0;
      const bCurrentPhase = b.phase === currentPhase ? 10 : 0;

      return (b.relevanceScore + bCurrentPhase) - (a.relevanceScore + aCurrentPhase);
    });

    setTimeout(() => setIsLoading(false), 300);
    return sorted;
  }, [query, selectedPhases, selectedCategories, currentPhase]);

  useEffect(() => {
    setSearchResults(performSearch);
  }, [performSearch]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    if (searchQuery.trim() && !recentSearches.includes(searchQuery)) {
      setRecentSearches(prev => [searchQuery, ...prev.slice(0, 4)]);
    }
  };

  const clearFilters = () => {
    setSelectedPhases([]);
    setSelectedCategories([]);
  };

  const togglePhaseFilter = (phase: Phase) => {
    setSelectedPhases(prev =>
      prev.includes(phase)
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const toggleCategoryFilter = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const getPhaseColor = (phase: Phase) => {
    return phaseInfo[phase]?.color || '#006E6D';
  };

  const renderSearchResults = () => (
    <div className="space-y-4">
      {searchResults.map((result) => (
        <Link
          key={result.id}
          to={result.url}
          onClick={onClose}
          className="block"
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{result.title}</h3>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: getPhaseColor(result.phase),
                        color: getPhaseColor(result.phase)
                      }}
                    >
                      {phaseInfo[result.phase]?.name}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{result.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="capitalize">{result.category}</span>
                    {result.estimatedTime && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {result.estimatedTime}
                      </span>
                    )}
                    {result.difficulty && (
                      <Badge variant="secondary" className="text-xs">
                        {result.difficulty}
                      </Badge>
                    )}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 mt-1" />
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}

      {query && searchResults.length === 0 && !isLoading && (
        <div className="text-center py-8 text-muted-foreground">
          <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No results found for "{query}"</p>
          <p className="text-sm">Try adjusting your search terms or filters</p>
        </div>
      )}
    </div>
  );

  const renderQuickActions = () => (
    <div className="space-y-4">
      <div>
        <h3 className="font-medium mb-3">Quick Access</h3>
        <div className="grid grid-cols-2 gap-3">
          <Link to="/dashboard" onClick={onClose}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Dashboard</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/portfolio" onClick={onClose}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4 text-center">
                <Star className="h-6 w-6 mx-auto mb-2 text-primary" />
                <p className="text-sm font-medium">Portfolio</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </div>

      {recentSearches.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Recent Searches</h3>
          <div className="space-y-2">
            {recentSearches.map((search, index) => (
              <button
                key={index}
                onClick={() => handleSearch(search)}
                className="flex items-center gap-2 w-full text-left p-2 rounded hover:bg-muted text-sm"
              >
                <Clock className="h-4 w-4 text-gray-400" />
                {search}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Unified Search</DialogTitle>
          <DialogDescription>
            Search across all phases and discover relevant opportunities
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for tools, programs, opportunities..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-4"
              autoFocus
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-4 pb-4 border-b">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Filters:</span>
            </div>

            {/* Phase Filters */}
            <div className="flex gap-2">
              {Object.entries(phaseInfo).map(([phaseId, info]) => (
                <Button
                  key={phaseId}
                  variant={selectedPhases.includes(phaseId as Phase) ? "default" : "outline"}
                  size="sm"
                  onClick={() => togglePhaseFilter(phaseId as Phase)}
                  style={{
                    backgroundColor: selectedPhases.includes(phaseId as Phase) ? info.color : 'transparent',
                    borderColor: info.color
                  }}
                >
                  {info.name}
                </Button>
              ))}
            </div>

            {(selectedPhases.length > 0 || selectedCategories.length > 0) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden">
            <Tabs defaultValue={query ? "results" : "quick"} className="h-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="quick">Quick Access</TabsTrigger>
                <TabsTrigger value="results">
                  Search Results {query && `(${searchResults.length})`}
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 h-96 overflow-y-auto">
                <TabsContent value="quick" className="mt-0">
                  {renderQuickActions()}
                </TabsContent>
                <TabsContent value="results" className="mt-0">
                  {renderSearchResults()}
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
