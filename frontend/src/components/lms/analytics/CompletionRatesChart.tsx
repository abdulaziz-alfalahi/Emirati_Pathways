
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface CompletionData {
  course: string;
  rate: number;
}

interface CompletionRatesChartProps {
  data: CompletionData[];
}

export const CompletionRatesChart: React.FC<CompletionRatesChartProps> = ({ data }) => {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="course" 
            angle={-45}
            textAnchor="end"
            height={100}
          />
          <YAxis 
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={(value: any) => [`${value}%`, 'Completion Rate']}
          />
          <Legend />
          <Bar 
            dataKey="rate" 
            fill="#10b981"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
