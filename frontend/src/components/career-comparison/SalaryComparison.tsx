
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign } from 'lucide-react';

export const SalaryComparison: React.FC = () => {
  const salaryData = [
    { career: 'Software Engineer', junior: 8000, mid: 15000, senior: 25000 },
    { career: 'Data Scientist', junior: 10000, mid: 18000, senior: 30000 },
    { career: 'Product Manager', junior: 12000, mid: 20000, senior: 35000 },
    { career: 'UX Designer', junior: 7000, mid: 13000, senior: 22000 }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-ehrdc-teal" />
            Salary Comparison by Experience Level
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={salaryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="career" />
              <YAxis />
              <Tooltip formatter={(value) => [`AED ${value.toLocaleString()}`, '']} />
              <Bar dataKey="junior" fill="#3B82F6" name="Junior (0-2 years)" />
              <Bar dataKey="mid" fill="#10B981" name="Mid-level (3-5 years)" />
              <Bar dataKey="senior" fill="#8B5CF6" name="Senior (6+ years)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
