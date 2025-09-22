
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const ErrorState: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach Dashboard</CardTitle>
        <CardDescription>Error loading your coaching assignments</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-destructive">
          There was an error loading your coaching assignments. Please try again later.
        </p>
      </CardContent>
    </Card>
  );
};
