
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ExternalLink, Eye, FileText, Star } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { ThoughtLeadershipContent } from './types';

interface ResearchPapersTabProps {
  searchQuery: string;
}

export const ResearchPapersTab: React.FC<ResearchPapersTabProps> = ({ searchQuery }) => {
  const [papers, setPapers] = useState<ThoughtLeadershipContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPapers();
  }, [searchQuery]);

  const fetchPapers = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('thought_leadership_content')
        .select('*')
        .eq('content_type', 'research_paper')
        .eq('status', 'published')
        .order('published_date', { ascending: false });

      if (searchQuery.trim()) {
        query = query.or(`title.ilike.%${searchQuery}%,summary.ilike.%${searchQuery}%,author_name.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPapers((data || []) as ThoughtLeadershipContent[]);
    } catch (error) {
      console.error('Error fetching research papers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Featured Papers */}
      {papers.some(paper => paper.is_featured) && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Featured Research
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {papers
              .filter(paper => paper.is_featured)
              .map((paper) => (
                <Card key={paper.id} className="border-yellow-200 bg-yellow-50/50">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg leading-tight">{paper.title}</CardTitle>
                        <CardDescription className="mt-2">
                          By {paper.author_name}
                          {paper.author_title && `, ${paper.author_title}`}
                          {paper.author_organization && ` at ${paper.author_organization}`}
                        </CardDescription>
                      </div>
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                        Featured
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                      {paper.summary}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                      <div className="flex items-center gap-4">
                        {paper.reading_time_minutes && (
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {paper.reading_time_minutes} min read
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          {paper.view_count} views
                        </span>
                      </div>
                      <span>{new Date(paper.published_date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 mb-4">
                      {paper.tags?.slice(0, 3).map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <Button size="sm" className="w-full" asChild>
                      <a
                        href={paper.full_content_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2"
                      >
                        Download Paper
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}

      {/* All Papers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Research Papers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {papers
            .filter(paper => !paper.is_featured)
            .map((paper) => (
              <Card key={paper.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <CardTitle className="text-base leading-tight">{paper.title}</CardTitle>
                  <CardDescription>
                    By {paper.author_name}
                    {paper.author_title && `, ${paper.author_title}`}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {paper.summary}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                    <div className="flex items-center gap-3">
                      {paper.reading_time_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {paper.reading_time_minutes}m
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        {paper.view_count}
                      </span>
                    </div>
                    <span>{new Date(paper.published_date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mb-4">
                    {paper.tags?.slice(0, 2).map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <Button size="sm" variant="outline" className="w-full" asChild>
                    <a
                      href={paper.full_content_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2"
                    >
                      View Paper
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ))}
        </div>
      </div>

      {papers.length === 0 && !loading && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No research papers found</h3>
          <p className="text-muted-foreground">
            {searchQuery ? 'Try adjusting your search terms.' : 'No research papers are currently available.'}
          </p>
        </div>
      )}
    </div>
  );
};
