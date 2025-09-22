
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Star, Target, Award } from 'lucide-react';
import type { SuccessMetricsAnalytics } from '@/types/mentorship';

interface MetricsChartProps {
  analytics: SuccessMetricsAnalytics;
}

export const MetricsChart: React.FC<MetricsChartProps> = ({ analytics }) => {
  // Generate month labels for the last 6 months
  const getMonthLabels = () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('en-US', { month: 'short' }));
    }
    return months;
  };

  const monthLabels = getMonthLabels();

  // Prepare chart data
  const trendData = monthLabels.map((month, index) => ({
    month,
    satisfaction: analytics.trend_data.satisfaction_trend[index] || 0,
    skillDevelopment: analytics.trend_data.skill_development_trend[index] || 0,
    goalCompletions: analytics.trend_data.goal_completion_trend[index] || 0
  }));

  const formatTooltipValue = (value: number, name: string) => {
    if (name === 'goalCompletions') {
      return [`${value} goals`, 'Goals Completed'];
    }
    return [`${value.toFixed(1)}/5.0`, name === 'satisfaction' ? 'Satisfaction' : 'Skill Development'];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Satisfaction & Skill Development Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Satisfaction & Skill Trends
          </CardTitle>
          <CardDescription>
            Monthly satisfaction and skill development ratings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                domain={[0, 5]}
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={formatTooltipValue}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="satisfaction" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2, r: 4 }}
                name="Satisfaction"
              />
              <Line 
                type="monotone" 
                dataKey="skillDevelopment" 
                stroke="hsl(var(--chart-2))" 
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2, r: 4 }}
                name="Skill Development"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Goal Completion Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Goal Completion Trend
          </CardTitle>
          <CardDescription>
            Number of goals completed each month
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px'
                }}
                formatter={formatTooltipValue}
              />
              <Bar 
                dataKey="goalCompletions" 
                fill="hsl(var(--chart-3))" 
                radius={[4, 4, 0, 0]}
                name="goalCompletions"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Success Summary */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Success Summary
          </CardTitle>
          <CardDescription>
            Key insights from the mentorship relationship metrics
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Satisfaction Insight */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <h4 className="font-semibold mb-1">Overall Satisfaction</h4>
              <p className="text-2xl font-bold text-primary mb-2">
                {analytics.overall_satisfaction.toFixed(1)}/5.0
              </p>
              <p className="text-sm text-muted-foreground">
                {analytics.overall_satisfaction >= 4.5 ? 'Excellent' :
                 analytics.overall_satisfaction >= 4.0 ? 'Very Good' :
                 analytics.overall_satisfaction >= 3.5 ? 'Good' :
                 analytics.overall_satisfaction >= 3.0 ? 'Average' : 'Needs Improvement'} relationship satisfaction
              </p>
            </div>

            {/* Goal Achievement */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <Target className="h-8 w-8 text-green-500" />
              </div>
              <h4 className="font-semibold mb-1">Goal Achievement</h4>
              <p className="text-2xl font-bold text-primary mb-2">
                {Math.round(analytics.goal_completion_rate)}%
              </p>
              <p className="text-sm text-muted-foreground">
                {analytics.completed_goals} of {analytics.total_goals} goals completed
              </p>
            </div>

            {/* Skill Development */}
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
              <h4 className="font-semibold mb-1">Skill Growth</h4>
              <p className="text-2xl font-bold text-primary mb-2">
                {analytics.skill_improvement_average.toFixed(1)}/5.0
              </p>
              <p className="text-sm text-muted-foreground">
                Average skill development rating
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
