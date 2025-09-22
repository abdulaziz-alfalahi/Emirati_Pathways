
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users } from 'lucide-react';

interface ABTestsTabProps {
  activeTests: any[];
  testResults: Record<string, any>;
  formatChartData: (results: Record<string, any>) => any[];
  formatTooltipValue: (value: any, name: string) => any[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

const ABTestsTab: React.FC<ABTestsTabProps> = ({
  activeTests,
  testResults,
  formatChartData,
  formatTooltipValue
}) => {
  if (activeTests.length === 0) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Active A/B Tests</h3>
          <p className="text-muted-foreground">
            A/B tests will appear here when they're running
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {activeTests.map((test) => {
        const results = testResults[test.id];
        if (!results) return null;

        const chartData = formatChartData(results);

        return (
          <Card key={test.id}>
            <CardHeader>
              <CardTitle>{test.name}</CardTitle>
              <CardDescription>{test.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-sm font-medium mb-4">Click-Through Rates</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="variant" />
                      <YAxis />
                      <Tooltip formatter={formatTooltipValue} />
                      <Bar dataKey="clickRate" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-4">User Distribution</h4>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="assignments"
                        label={({ variant, assignments }) => `${variant}: ${assignments}`}
                      >
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="mt-6">
                <h4 className="text-sm font-medium mb-2">Variant Performance</h4>
                <div className="space-y-2">
                  {Object.entries(results).map(([variantId, stats]: [string, any]) => (
                    <div key={variantId} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <span className="font-medium capitalize">{variantId}</span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({stats.assignments} users)
                        </span>
                      </div>
                      <div className="flex space-x-4 text-sm">
                        <span>CTR: {stats.clickThroughRate.toFixed(1)}%</span>
                        <span>Conv: {stats.conversionRate.toFixed(1)}%</span>
                        <span>Feedback: {stats.feedbackRate.toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default ABTestsTab;
