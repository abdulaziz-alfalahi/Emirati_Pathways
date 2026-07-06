
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from '@tanstack/react-query';
interface ProgressTimelineChartProps {
  assessmentId: string;
}

export const ProgressTimelineChart: React.FC<ProgressTimelineChartProps> = ({ assessmentId }) => {
  const { data: timelineData } = useQuery({
    queryKey: ['assessment-timeline', assessmentId],
    queryFn: async () => {
      // Fetch evaluation timeline data
      const { data: evaluations } = await supabase
        .from('assessment_evaluations')
        .select('*')
        .eq('assessment_id', assessmentId)
        .not('submitted_at', 'is', null)
        .order('submitted_at', { ascending: true });

      if (!evaluations) return [];

      // Group evaluations by date
      const dailyProgress: Record<string, number> = {};
      
      evaluations.forEach(evaluation => {
        if (evaluation.submitted_at) {
          const date = new Date(evaluation.submitted_at).toISOString().split('T')[0];
          dailyProgress[date] = (dailyProgress[date] || 0) + 1;
        }
      });

      // Convert to cumulative progress
      let cumulative = 0;
      const timeline = Object.entries(dailyProgress)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => {
          cumulative += count;
          return {
            date: new Date(date).toLocaleDateString(),
            evaluations: cumulative,
            dailyCount: count
          };
        });

      return timeline;
    }
  });

  if (!timelineData || timelineData.length === 0) {
    return (
      <div className="h-80 flex items-center justify-center">
        <p className="text-muted-foreground">No evaluation timeline data available</p>
      </div>
    );
  }

  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={timelineData}
          margin={{
            top: 20,
            right: 30,
            left: 20,
            bottom: 20,
          }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            angle={-45}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            label={{ value: 'Cumulative Evaluations', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value, name) => [
              value, 
              name === 'evaluations' ? 'Total Evaluations' : 'Daily Evaluations'
            ]}
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px'
            }}
          />
          <Line 
            type="monotone" 
            dataKey="evaluations" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
