import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { searchAnalytics, PerformanceReport } from '@/services/searchAnalytics';
import { 
  Search, 
  Filter, 
  Clock, 
  TrendingUp, 
  Database, 
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';

interface SearchPerformanceDashboardProps {
  className?: string;
}

export const SearchPerformanceDashboard: React.FC<SearchPerformanceDashboardProps> = ({
  className
}) => {
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [popularTerms, setPopularTerms] = useState<Array<{ term: string; count: number }>>([]);
  const [componentStats, setComponentStats] = useState<Array<{ component: string; searches: number; filters: number }>>([]);
  const [refreshing, setRefreshing] = useState(false);

  const refreshData = async () => {
    setRefreshing(true);
    
    // Simulate a small delay for smooth UX
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const newReport = searchAnalytics.getPerformanceReport(24);
    const newPopularTerms = searchAnalytics.getPopularSearchTerms(5);
    const newComponentStats = searchAnalytics.getComponentStats();
    
    setReport(newReport);
    setPopularTerms(newPopularTerms);
    setComponentStats(newComponentStats);
    setRefreshing(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  if (!report) {
    return null;
  }

  const cacheHitPercentage = Math.round(report.cacheHitRate * 100);
  const avgResponseTime = Math.round(report.averageResponseTime);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Search Performance Dashboard</h2>
          <p className="text-muted-foreground">Last 24 hours performance metrics</p>
        </div>
        <Button 
          onClick={refreshData} 
          variant="outline" 
          size="sm"
          disabled={refreshing}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Searches */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Searches</CardTitle>
            <Search className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.totalSearches.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              {report.totalFilterChanges} filter changes
            </p>
          </CardContent>
        </Card>

        {/* Cache Hit Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cacheHitPercentage}%</div>
            <Progress value={cacheHitPercentage} className="mt-2" />
          </CardContent>
        </Card>

        {/* Average Response Time */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              {avgResponseTime < 200 ? 'Excellent' : avgResponseTime < 500 ? 'Good' : 'Needs optimization'}
            </p>
          </CardContent>
        </Card>

        {/* API Calls Reduced */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API Calls Reduced</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{report.apiCallsReduced}</div>
            <p className="text-xs text-muted-foreground">
              Through debouncing
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Search Terms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Popular Search Terms
            </CardTitle>
          </CardHeader>
          <CardContent>
            {popularTerms.length > 0 ? (
              <div className="space-y-3">
                {popularTerms.map((term, index) => (
                  <div key={term.term} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        #{index + 1}
                      </Badge>
                      <span className="text-sm">{term.term}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {term.count} searches
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No search data available</p>
            )}
          </CardContent>
        </Card>

        {/* Component Usage */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Component Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            {componentStats.length > 0 ? (
              <div className="space-y-3">
                {componentStats.slice(0, 5).map((stat) => (
                  <div key={stat.component} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span>{stat.component}</span>
                      <div className="flex gap-2">
                        <Badge variant="outline" className="text-xs">
                          {stat.searches} searches
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {stat.filters} filters
                        </Badge>
                      </div>
                    </div>
                    <Progress 
                      value={(stat.searches + stat.filters) / Math.max(...componentStats.map(s => s.searches + s.filters)) * 100} 
                      className="h-2"
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No usage data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance Insights */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            {cacheHitPercentage > 70 && (
              <div className="flex items-center gap-2 text-green-600">
                <TrendingUp className="h-4 w-4" />
                Excellent cache performance reducing server load
              </div>
            )}
            {avgResponseTime < 200 && (
              <div className="flex items-center gap-2 text-green-600">
                <Clock className="h-4 w-4" />
                Response times are optimal for great user experience
              </div>
            )}
            {report.apiCallsReduced > 10 && (
              <div className="flex items-center gap-2 text-blue-600">
                <Filter className="h-4 w-4" />
                Debouncing has reduced {report.apiCallsReduced} unnecessary API calls
              </div>
            )}
            {avgResponseTime > 500 && (
              <div className="flex items-center gap-2 text-orange-600">
                <Clock className="h-4 w-4" />
                Consider optimizing search queries for better performance
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
