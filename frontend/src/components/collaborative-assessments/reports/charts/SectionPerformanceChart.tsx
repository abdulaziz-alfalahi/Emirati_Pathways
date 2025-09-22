
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { SectionScore } from '@/types/collaborativeAssessments';

interface SectionPerformanceChartProps {
  sections: SectionScore[];
  detailed?: boolean;
}

export const SectionPerformanceChart: React.FC<SectionPerformanceChartProps> = ({ 
  sections, 
  detailed = false 
}) => {
  const data = sections.map(section => ({
    name: section.section_title.length > 20 
      ? section.section_title.substring(0, 20) + '...'
      : section.section_title,
    fullName: section.section_title,
    score: section.score,
    maxScore: section.max_score,
    percentage: section.percentage
  }));

  const getBarColor = (percentage: number) => {
    if (percentage >= 80) return '#22c55e';
    if (percentage >= 60) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <div className={detailed ? "h-96" : "h-80"}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 60,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="name" 
            angle={-45}
            textAnchor="end"
            height={60}
            interval={0}
          />
          <YAxis 
            label={{ value: 'Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value, name, props) => [
              `${value}/${props.payload.maxScore} (${props.payload.percentage.toFixed(1)}%)`,
              'Score'
            ]}
            labelFormatter={(label, payload) => 
              payload?.[0]?.payload?.fullName || label
            }
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Bar dataKey="score" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.percentage)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {detailed && (
        <div className="mt-6 space-y-4">
          {sections.map((section, index) => (
            <div key={section.section_id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{section.section_title}</h4>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  section.percentage >= 80 
                    ? 'bg-green-100 text-green-800'
                    : section.percentage >= 60
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                }`}>
                  {section.percentage.toFixed(1)}%
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Score: {section.score}/{section.max_score}
              </div>
              <div className="text-sm text-muted-foreground">
                Criteria evaluated: {section.criteria_scores.length}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
