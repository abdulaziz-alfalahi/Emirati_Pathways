
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Target, Users } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// Mock Emiratization data
const emiratizationTrends = [
  { year: '2020', current: 42, target: 45, private: 38, public: 89 },
  { year: '2021', current: 45, target: 48, private: 41, public: 91 },
  { year: '2022', current: 48, target: 52, private: 44, public: 93 },
  { year: '2023', current: 52, target: 56, private: 48, public: 94 },
  { year: '2024', current: 56, target: 60, private: 52, public: 95 },
  { year: '2025', current: null, target: 64, private: 56, public: 96 },
  { year: '2026', current: null, target: 68, private: 61, public: 97 },
];

const sectorBreakdown = [
  { sector: 'Banking', current: 67, target: 75, gap: -8 },
  { sector: 'Technology', current: 34, target: 50, gap: -16 },
  { sector: 'Healthcare', current: 52, target: 60, gap: -8 },
  { sector: 'Education', current: 78, target: 80, gap: -2 },
  { sector: 'Energy', current: 45, target: 55, gap: -10 },
];

export const EmiratizationTab: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Progress</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">56%</div>
            <p className="text-xs text-muted-foreground">
              Overall Emiratization rate
            </p>
            <Badge variant="default" className="mt-2 bg-blue-600">2024 Current</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">2030 Projection</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-muted-foreground">
              Predicted achievement rate
            </p>
            <Badge variant="default" className="mt-2 bg-green-600">On Track</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+4%</div>
            <p className="text-xs text-muted-foreground">
              Annual improvement rate
            </p>
            <Badge variant="secondary" className="mt-2">Accelerating</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Progress Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Emiratization Progress Trends</CardTitle>
          <CardDescription>
            Historical progress and future projections towards 2030 goals
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={emiratizationTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Line 
                type="monotone" 
                dataKey="current" 
                stroke="#8884d8" 
                strokeWidth={3}
                name="Current Progress"
                connectNulls={false}
              />
              <Line 
                type="monotone" 
                dataKey="target" 
                stroke="#ff7300" 
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Target Goals"
              />
              <Line 
                type="monotone" 
                dataKey="private" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Private Sector"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Sector Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Sector-wise Performance</CardTitle>
          <CardDescription>
            Emiratization progress by key economic sectors
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={sectorBreakdown}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="sector" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Bar dataKey="current" fill="#8884d8" name="Current Rate" />
              <Bar dataKey="target" fill="#82ca9d" name="Target Rate" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Strategic Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Strategic Interventions</CardTitle>
            <CardDescription>
              Recommended actions to accelerate Emiratization progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 rounded border-s-4 border-blue-500">
                <div className="font-medium text-blue-800">Skills Development Programs</div>
                <div className="text-sm text-blue-700">
                  Accelerate technology and leadership training for Emirati professionals
                </div>
                <Badge variant="outline" className="mt-2">High Impact</Badge>
              </div>
              
              <div className="p-3 bg-green-50 rounded border-s-4 border-green-500">
                <div className="font-medium text-green-800">Public-Private Partnerships</div>
                <div className="text-sm text-green-700">
                  Strengthen collaboration between government and private sector
                </div>
                <Badge variant="outline" className="mt-2">Strategic</Badge>
              </div>
              
              <div className="p-3 bg-yellow-50 rounded border-s-4 border-yellow-500">
                <div className="font-medium text-yellow-800">Mentorship Programs</div>
                <div className="text-sm text-yellow-700">
                  Establish senior professional mentorship networks
                </div>
                <Badge variant="outline" className="mt-2">Long-term</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Assessment</CardTitle>
            <CardDescription>
              Potential challenges and mitigation strategies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-2 rounded bg-red-50">
                <span className="text-sm font-medium">Skills Gap in Technology</span>
                <Badge variant="destructive">High Risk</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-yellow-50">
                <span className="text-sm font-medium">Private Sector Adoption</span>
                <Badge variant="secondary">Medium Risk</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-blue-50">
                <span className="text-sm font-medium">Career Path Clarity</span>
                <Badge variant="outline">Low Risk</Badge>
              </div>
              
              <div className="flex justify-between items-center p-2 rounded bg-green-50">
                <span className="text-sm font-medium">Government Support</span>
                <Badge variant="default" className="bg-green-600">Mitigated</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
