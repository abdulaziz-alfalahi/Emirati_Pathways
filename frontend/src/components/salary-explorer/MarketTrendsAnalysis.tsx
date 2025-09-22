
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const MarketTrendsAnalysis: React.FC = () => {
  const trendData = [
    { year: '2020', tech: 85, finance: 90, healthcare: 88 },
    { year: '2021', tech: 92, finance: 87, healthcare: 91 },
    { year: '2022', tech: 110, finance: 95, healthcare: 94 },
    { year: '2023', tech: 125, finance: 102, healthcare: 98 },
    { year: '2024', tech: 138, finance: 108, healthcare: 105 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
          Market Salary Trends (2020-2024)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip formatter={(value) => [`${value}%`, '']} />
            <Line type="monotone" dataKey="tech" stroke="#3B82F6" name="Technology" strokeWidth={3} />
            <Line type="monotone" dataKey="finance" stroke="#10B981" name="Finance" strokeWidth={3} />
            <Line type="monotone" dataKey="healthcare" stroke="#8B5CF6" name="Healthcare" strokeWidth={3} />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
