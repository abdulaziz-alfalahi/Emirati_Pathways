
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { MapPin } from 'lucide-react';

export const LocationComparison: React.FC = () => {
  const locationData = [
    { location: 'Dubai', salary: 18000, costOfLiving: 85 },
    { location: 'Abu Dhabi', salary: 17000, costOfLiving: 80 },
    { location: 'Sharjah', salary: 14000, costOfLiving: 70 },
    { location: 'Ajman', salary: 12000, costOfLiving: 65 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-ehrdc-teal" />
          Salary vs Cost of Living by Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={locationData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="location" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="salary" fill="#3B82F6" name="Average Salary (AED)" />
            <Bar dataKey="costOfLiving" fill="#10B981" name="Cost of Living Index" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
