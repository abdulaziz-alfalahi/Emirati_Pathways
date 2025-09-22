
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Users, TrendingUp, Calendar } from 'lucide-react';

interface CommunityGrowthChartProps {
  groupId: string;
  timeRange: string;
  detailed?: boolean;
}

interface GrowthDataPoint {
  date: string;
  members: number;
  newMembers: number;
  cumulativeMembers: number;
}

const CommunityGrowthChart: React.FC<CommunityGrowthChartProps> = ({ 
  groupId, 
  timeRange, 
  detailed = false 
}) => {
  const [data, setData] = useState<GrowthDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalGrowth, setTotalGrowth] = useState(0);
  const [growthRate, setGrowthRate] = useState(0);

  useEffect(() => {
    generateGrowthData();
  }, [groupId, timeRange]);

  const generateGrowthData = () => {
    setLoading(true);
    
    // Generate mock data based on time range
    const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
    const data: GrowthDataPoint[] = [];
    
    let cumulativeMembers = Math.floor(Math.random() * 100) + 50; // Starting members
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // Generate realistic growth patterns
      const baseGrowth = Math.floor(Math.random() * 5); // 0-4 new members per day
      const weekendFactor = date.getDay() === 0 || date.getDay() === 6 ? 0.5 : 1;
      const newMembers = Math.floor(baseGrowth * weekendFactor);
      
      cumulativeMembers += newMembers;
      
      data.push({
        date: date.toISOString().split('T')[0],
        members: newMembers,
        newMembers,
        cumulativeMembers
      });
    }
    
    setData(data);
    
    // Calculate growth metrics
    const firstDataPoint = data[0];
    const lastDataPoint = data[data.length - 1];
    const totalGrowth = lastDataPoint.cumulativeMembers - firstDataPoint.cumulativeMembers;
    const growthRate = firstDataPoint.cumulativeMembers > 0 
      ? ((totalGrowth / firstDataPoint.cumulativeMembers) * 100) 
      : 0;
    
    setTotalGrowth(totalGrowth);
    setGrowthRate(growthRate);
    setLoading(false);
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

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Community Growth
          </CardTitle>
          <CardDescription>
            Member growth over the selected time period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="font-semibold text-gray-900">New Members</h3>
              </div>
              <div className="text-2xl font-bold text-blue-600 mt-2">+{totalGrowth}</div>
              <div className="text-sm text-gray-600">in {timeRange}</div>
            </div>
            
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center">
                <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Growth Rate</h3>
              </div>
              <div className="text-2xl font-bold text-green-600 mt-2">{growthRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-600">vs previous period</div>
            </div>
            
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-purple-600 mr-2" />
                <h3 className="font-semibold text-gray-900">Total Members</h3>
              </div>
              <div className="text-2xl font-bold text-purple-600 mt-2">
                {data[data.length - 1]?.cumulativeMembers || 0}
              </div>
              <div className="text-sm text-gray-600">current total</div>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => formatDate(value as string)}
                formatter={(value: number, name: string) => [
                  value,
                  name === 'cumulativeMembers' ? 'Total Members' : 'New Members'
                ]}
              />
              <Area
                type="monotone"
                dataKey="cumulativeMembers"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {detailed && (
        <Card>
          <CardHeader>
            <CardTitle>Daily New Members</CardTitle>
            <CardDescription>
              Daily breakdown of new member acquisitions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={formatDate}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => formatDate(value as string)}
                  formatter={(value: number) => [value, 'New Members']}
                />
                <Line
                  type="monotone"
                  dataKey="newMembers"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CommunityGrowthChart;
