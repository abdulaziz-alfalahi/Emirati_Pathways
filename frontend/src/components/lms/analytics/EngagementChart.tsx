
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface EngagementData {
  date: string;
  engagement: number;
}

interface EngagementChartProps {
  data: EngagementData[];
}

export const EngagementChart: React.FC<EngagementChartProps> = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            labelFormatter={(value) => `Date: ${new Date(value).toLocaleDateString()}`}
            formatter={(value: any) => [`${value}%`, 'Engagement']}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="engagement" 
            stroke="#3b82f6" 
            strokeWidth={3}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
