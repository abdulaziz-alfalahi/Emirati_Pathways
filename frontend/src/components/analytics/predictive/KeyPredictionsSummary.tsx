
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, Briefcase, GraduationCap } from 'lucide-react';

export const KeyPredictionsSummary: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workforce Growth</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">+23%</div>
          <p className="text-xs text-muted-foreground">
            Predicted growth over 5 years
          </p>
          <Badge variant="default" className="mt-2 bg-green-600">High Confidence</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Skills Demand</CardTitle>
          <GraduationCap className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">AI/ML</div>
          <p className="text-xs text-muted-foreground">
            Top emerging skill requirement
          </p>
          <Badge variant="secondary" className="mt-2">+120% Growth</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sector Growth</CardTitle>
          <Briefcase className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">Technology</div>
          <p className="text-xs text-muted-foreground">
            Fastest growing sector
          </p>
          <Badge variant="default" className="mt-2">+45% Projected</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Emiratization</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">78%</div>
          <p className="text-xs text-muted-foreground">
            Projected target achievement
          </p>
          <Badge variant="outline" className="mt-2">2030 Goal</Badge>
        </CardContent>
      </Card>
    </div>
  );
};
