
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PatternData {
  timeSlot: string;
  activity: number;
}

interface LearningPatternsChartProps {
  data: PatternData[];
}

export const LearningPatternsChart: React.FC<LearningPatternsChartProps> = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="timeSlot" />
          <YAxis 
            tickFormatter={(value) => `${value}`}
          />
          <Tooltip 
            formatter={(value: any) => [`${value}`, 'Active Learners']}
          />
          <Legend />
          <Area 
            type="monotone" 
            dataKey="activity" 
            stroke="#8b5cf6" 
            fill="#8b5cf6"
            fillOpacity={0.3}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};
