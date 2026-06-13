
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { CollaboratorInsight } from '@/types/collaborativeAssessments';

interface CollaboratorInsightsChartProps {
  insights: CollaboratorInsight[];
}

export const CollaboratorInsightsChart: React.FC<CollaboratorInsightsChartProps> = ({ insights }) => {
  const data = insights.map(insight => ({
    name: insight.collaborator_name.length > 15 
      ? insight.collaborator_name.substring(0, 15) + '...'
      : insight.collaborator_name,
    fullName: insight.collaborator_name,
    sectionsEvaluated: insight.sections_evaluated,
    averageScore: insight.average_score_given,
    role: insight.role
  }));

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return '#8b5cf6';
      case 'trainer': return '#3b82f6';
      case 'mentor': return '#10b981';
      case 'employer_admin': return '#f59e0b';
      case 'evaluator': return '#6b7280';
      case 'viewer': return '#9ca3af';
      default: return '#6b7280';
    }
  };

  return (
    <div className="space-y-6">
      <div className="h-80">
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
            <YAxis />
            <Tooltip 
              formatter={(value, name, props) => {
                if (name === 'sectionsEvaluated') {
                  return [value, 'Sections Evaluated'];
                }
                // Type check before calling toFixed
                const numericValue = typeof value === 'number' ? value : parseFloat(value as string);
                return [isNaN(numericValue) ? value : numericValue.toFixed(1), 'Average Score Given'];
              }}
              labelFormatter={(label, payload) => 
                payload?.[0]?.payload?.fullName || label
              }
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px'
              }}
            />
            <Legend />
            <Bar 
              dataKey="sectionsEvaluated" 
              fill="#3b82f6" 
              name="Sections Evaluated"
              radius={[2, 2, 0, 0]}
            />
            <Bar 
              dataKey="averageScore" 
              fill="#10b981" 
              name="Avg Score Given"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Collaborator Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {insights.map((insight, index) => (
          <div key={insight.collaborator_id} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{insight.collaborator_name}</h4>
              <span 
                className="px-2 py-1 rounded text-xs font-medium text-white"
                style={{ backgroundColor: getRoleColor(insight.role) }}
              >
                {insight.role}
              </span>
            </div>
            <div className="space-y-1 text-sm text-muted-foreground">
              <div>Sections: {insight.sections_evaluated}</div>
              <div>Avg Score: {insight.average_score_given.toFixed(1)}</div>
              <div>Comments: {insight.key_comments.length}</div>
            </div>
            {insight.key_comments.length > 0 && (
              <div className="mt-3">
                <div className="text-xs font-medium text-muted-foreground mb-1">
                  Recent Comments:
                </div>
                <div className="text-xs text-muted-foreground">
                  {insight.key_comments[0].substring(0, 100)}
                  {insight.key_comments[0].length > 100 && '...'}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
