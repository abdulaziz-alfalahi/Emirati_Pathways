
import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { AssessmentReport } from '@/types/collaborativeAssessments';

interface AssessmentOverviewChartProps {
  report: AssessmentReport;
}

export const AssessmentOverviewChart: React.FC<AssessmentOverviewChartProps> = ({ report }) => {
  const data = [
    {
      name: 'Achieved Score',
      value: report.overall_score,
      color: '#22c55e'
    },
    {
      name: 'Remaining Points',
      value: report.max_possible_score - report.overall_score,
      color: '#e5e7eb'
    }
  ];

  const COLORS = ['#22c55e', '#e5e7eb'];

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent > 0.05) {
      return (
        <text 
          x={x} 
          y={y} 
          fill="white" 
          textAnchor={x > cx ? 'start' : 'end'} 
          dominantBaseline="central"
          className="text-sm font-medium"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    }
  };

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value, name]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
      
      <div className="text-center mt-4">
        <div className="text-3xl font-bold text-green-600">
          {report.percentage_score.toFixed(1)}%
        </div>
        <div className="text-sm text-muted-foreground">
          Overall Performance
        </div>
      </div>
    </div>
  );
};
