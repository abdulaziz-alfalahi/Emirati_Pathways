
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export const GrowthProjections: React.FC = () => {
  const growthData = [
    { year: '2024', softwareEng: 100, dataScientist: 100, productMgr: 100 },
    { year: '2025', softwareEng: 112, dataScientist: 118, productMgr: 108 },
    { year: '2026', softwareEng: 125, dataScientist: 140, productMgr: 117 },
    { year: '2027', softwareEng: 140, dataScientist: 165, productMgr: 127 },
    { year: '2028', softwareEng: 157, dataScientist: 195, productMgr: 138 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-ehrdc-teal" />
            Career Growth Projections (2024-2028)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Line type="monotone" dataKey="softwareEng" stroke="#3B82F6" name="Software Engineer" strokeWidth={3} />
              <Line type="monotone" dataKey="dataScientist" stroke="#10B981" name="Data Scientist" strokeWidth={3} />
              <Line type="monotone" dataKey="productMgr" stroke="#8B5CF6" name="Product Manager" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
