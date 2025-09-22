
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Target, TrendingUp, Users, Award } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface OutcomeTrackingTabProps {
  timeRange: string;
  stakeholderView: string;
}

// Mock outcome data
const outcomeProgressData = [
  { month: 'Jan', employment: 65, education: 78, skills: 72, retention: 84 },
  { month: 'Feb', employment: 68, education: 81, skills: 75, retention: 86 },
  { month: 'Mar', employment: 72, education: 84, skills: 78, retention: 88 },
  { month: 'Apr', employment: 75, education: 87, skills: 82, retention: 89 },
  { month: 'May', employment: 78, education: 89, skills: 85, retention: 91 },
  { month: 'Jun', employment: 82, education: 92, skills: 88, retention: 93 },
];

const longitudinalData = [
  { phase: 'Education', year1: 85, year2: 92, year3: 96 },
  { phase: 'Career Dev', year1: 72, year2: 84, year3: 91 },
  { phase: 'Employment', year1: 68, year2: 79, year3: 87 },
  { phase: 'Retirement', year1: 76, year2: 88, year3: 94 },
];

export const OutcomeTrackingTab: React.FC<OutcomeTrackingTabProps> = ({
  timeRange,
  stakeholderView
}) => {
  const [selectedOutcome, setSelectedOutcome] = useState('all');

  return (
    <div className="space-y-6">
      {/* Outcome Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Track Outcomes:</span>
            <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select Outcome Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Outcomes</SelectItem>
                <SelectItem value="employment">Employment Success</SelectItem>
                <SelectItem value="education">Educational Achievement</SelectItem>
                <SelectItem value="skills">Skills Development</SelectItem>
                <SelectItem value="retention">Service Retention</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Key Outcome Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Employment Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">82%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+7%</span> from last quarter
            </p>
            <Badge variant="secondary" className="mt-2">Target: 80%</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Educational Achievement</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5%</span> from last quarter
            </p>
            <Badge variant="secondary" className="mt-2">Target: 85%</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Skills Development</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+12%</span> from last quarter
            </p>
            <Badge variant="secondary" className="mt-2">Target: 75%</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Long-term Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">93%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+4%</span> from last quarter
            </p>
            <Badge variant="secondary" className="mt-2">Target: 90%</Badge>
          </CardContent>
        </Card>
      </div>

      {/* Outcome Progress Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Outcome Progress Trends</CardTitle>
          <CardDescription>
            Tracking success rates across key performance indicators over time
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={outcomeProgressData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Line 
                type="monotone" 
                dataKey="employment" 
                stroke="#8884d8" 
                strokeWidth={2}
                name="Employment Success"
              />
              <Line 
                type="monotone" 
                dataKey="education" 
                stroke="#82ca9d" 
                strokeWidth={2}
                name="Educational Achievement"
              />
              <Line 
                type="monotone" 
                dataKey="skills" 
                stroke="#ffc658" 
                strokeWidth={2}
                name="Skills Development"
              />
              <Line 
                type="monotone" 
                dataKey="retention" 
                stroke="#ff7300" 
                strokeWidth={2}
                name="Service Retention"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Longitudinal Impact Assessment */}
      <Card>
        <CardHeader>
          <CardTitle>Longitudinal Impact Assessment</CardTitle>
          <CardDescription>
            Long-term success rates across different phases over 3-year period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={longitudinalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="phase" />
              <YAxis domain={[0, 100]} />
              <Tooltip formatter={(value) => [`${value}%`, '']} />
              <Bar dataKey="year1" fill="#8884d8" name="Year 1" />
              <Bar dataKey="year2" fill="#82ca9d" name="Year 2" />
              <Bar dataKey="year3" fill="#ffc658" name="Year 3" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Impact Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Policy Impact Assessment</CardTitle>
            <CardDescription>
              Effectiveness of recent policy interventions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                <div>
                  <div className="font-medium">Skills Development Initiative</div>
                  <div className="text-sm text-muted-foreground">Launched Q1 2024</div>
                </div>
                <Badge variant="default" className="bg-green-600">+15% Success</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                <div>
                  <div className="font-medium">Employment Matching Program</div>
                  <div className="text-sm text-muted-foreground">Launched Q2 2024</div>
                </div>
                <Badge variant="default" className="bg-blue-600">+12% Placement</Badge>
              </div>
              
              <div className="flex justify-between items-center p-3 bg-yellow-50 rounded">
                <div>
                  <div className="font-medium">Digital Literacy Campaign</div>
                  <div className="text-sm text-muted-foreground">Launched Q3 2024</div>
                </div>
                <Badge variant="default" className="bg-yellow-600">+8% Engagement</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Success Factors Analysis</CardTitle>
            <CardDescription>
              Key factors contributing to positive outcomes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Early intervention programs</span>
                <span className="text-sm font-bold text-green-600">78% correlation</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Personalized guidance</span>
                <span className="text-sm font-bold text-green-600">72% correlation</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Skills-based matching</span>
                <span className="text-sm font-bold text-green-600">69% correlation</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Stakeholder engagement</span>
                <span className="text-sm font-bold text-green-600">65% correlation</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm">Continuous monitoring</span>
                <span className="text-sm font-bold text-green-600">61% correlation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
