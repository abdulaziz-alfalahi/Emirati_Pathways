
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Heart, Calendar, Vote, TrendingUp, TrendingDown } from 'lucide-react';
import { CommunitiesService } from '@/services/communitiesService';

interface EngagementMetricsProps {
  groupId: string;
  timeRange: string;
  detailed?: boolean;
}

interface EngagementData {
  posts: number;
  comments: number;
  likes: number;
  events: number;
  polls: number;
  engagementScore: number;
  trend: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

const EngagementMetrics: React.FC<EngagementMetricsProps> = ({ 
  groupId, 
  timeRange, 
  detailed = false 
}) => {
  const [data, setData] = useState<EngagementData | null>(null);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadEngagementData();
  }, [groupId, timeRange]);

  const loadEngagementData = async () => {
    try {
      setLoading(true);
      
      // In a real implementation, this would fetch actual analytics data
      // For now, we'll simulate the data based on recent activity
      const posts = await CommunitiesService.getGroupPosts(groupId);
      const events = await CommunitiesService.getGroupEvents(groupId);
      const polls = await CommunitiesService.getGroupPolls(groupId);

      // Calculate engagement metrics
      const totalPosts = posts.length;
      const totalLikes = posts.reduce((sum, post) => sum + (post.like_count || 0), 0);
      const totalComments = posts.reduce((sum, post) => sum + (post.reply_count || 0), 0);
      const totalEvents = events.length;
      const totalPolls = polls.length;

      // Calculate engagement score (weighted formula)
      const engagementScore = Math.round(
        (totalPosts * 2) + 
        (totalComments * 1.5) + 
        (totalLikes * 0.5) + 
        (totalEvents * 3) + 
        (totalPolls * 2)
      );

      // Simulate trend data
      const trend = Math.random() > 0.5 ? 'up' : 'down';
      const trendPercentage = Math.round(Math.random() * 25 + 5);

      const engagementData: EngagementData = {
        posts: totalPosts,
        comments: totalComments,
        likes: totalLikes,
        events: totalEvents,
        polls: totalPolls,
        engagementScore,
        trend,
        trendPercentage
      };

      setData(engagementData);

      // Prepare chart data
      const chartData = [
        { name: 'Posts', value: totalPosts, color: '#3b82f6' },
        { name: 'Comments', value: totalComments, color: '#10b981' },
        { name: 'Likes', value: totalLikes, color: '#f59e0b' },
        { name: 'Events', value: totalEvents, color: '#8b5cf6' },
        { name: 'Polls', value: totalPolls, color: '#ef4444' }
      ];

      setChartData(chartData);
    } catch (error) {
      console.error('Failed to load engagement data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/3"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Engagement Metrics</CardTitle>
          <CardDescription>Failed to load engagement data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const metricCards = [
    {
      title: 'Posts',
      value: data.posts,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Comments',
      value: data.comments,
      icon: MessageSquare,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Likes',
      value: data.likes,
      icon: Heart,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50'
    },
    {
      title: 'Events',
      value: data.events,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Polls',
      value: data.polls,
      icon: Vote,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Engagement Overview</span>
            <div className="flex items-center space-x-2 text-sm">
              {data.trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <span className={data.trend === 'up' ? 'text-green-600' : 'text-red-600'}>
                {data.trendPercentage}% vs last period
              </span>
            </div>
          </CardTitle>
          <CardDescription>
            Community engagement metrics for the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            {metricCards.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.title} className={`p-4 rounded-lg ${metric.bgColor}`}>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  <div className="text-2xl font-bold text-gray-900">{metric.value}</div>
                  <div className="text-sm text-gray-600">{metric.title}</div>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Engagement Score</h3>
                <p className="text-sm text-gray-600">Overall community engagement rating</p>
              </div>
              <div className="text-3xl font-bold text-blue-600">{data.engagementScore}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {detailed && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Engagement Distribution</CardTitle>
              <CardDescription>Breakdown of engagement types</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Engagement Breakdown</CardTitle>
              <CardDescription>Detailed view of engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default EngagementMetrics;
