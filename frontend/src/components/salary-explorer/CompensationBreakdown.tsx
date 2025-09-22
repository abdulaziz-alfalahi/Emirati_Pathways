
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { DollarSign } from 'lucide-react';

export const CompensationBreakdown: React.FC = () => {
  const compensationData = [
    { name: 'Base Salary', value: 70, color: '#3B82F6' },
    { name: 'Performance Bonus', value: 15, color: '#10B981' },
    { name: 'Benefits', value: 10, color: '#8B5CF6' },
    { name: 'Stock Options', value: 5, color: '#F59E0B' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-ehrdc-teal" />
          Total Compensation Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={compensationData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}%`}
              >
                {compensationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-4">
            {compensationData.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.color }}></div>
                  <span className="font-medium">{item.name}</span>
                </div>
                <span className="text-lg font-semibold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
