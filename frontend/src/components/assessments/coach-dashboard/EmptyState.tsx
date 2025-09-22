
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const EmptyState: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Coach Dashboard</CardTitle>
        <CardDescription>No coaching assignments at this time</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">
          You don't have any coaching assignments yet. Assignments will appear here when students schedule sessions with you.
        </p>
      </CardContent>
    </Card>
  );
};
