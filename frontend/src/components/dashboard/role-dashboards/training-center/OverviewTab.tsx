
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Users, Badge as BadgeIcon, Calendar, BarChart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import DashboardOverview from '@/components/dashboard/DashboardOverview';
import { Program, Assessment } from '@/types/training-center';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface OverviewTabProps {
  programs: Program[];
  assessments: Assessment[];
}

const OverviewTab: React.FC<OverviewTabProps> = ({ programs, assessments }) => {
  // Sample enrollment data for chart
  const enrollmentData = [
    { month: 'Jan', trainees: 120 },
    { month: 'Feb', trainees: 140 },
    { month: 'Mar', trainees: 135 },
    { month: 'Apr', trainees: 180 },
    { month: 'May', trainees: 210 },
    { month: 'Jun', trainees: 245 }
  ];

  // Sample program category distribution data
  const programCategoryData = [
    { name: 'Technical', value: 45 },
    { name: 'Professional', value: 30 },
    { name: 'Leadership', value: 15 },
    { name: 'Certification', value: 10 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Calculate statistics
  const activeProgramsCount = programs.filter(p => p.status === 'active').length;
  const plannedProgramsCount = programs.filter(p => p.status === 'planned').length;
  const totalTrainees = programs.reduce((acc, program) => acc + program.trainees, 0);
  const averageCompletion = programs.filter(p => p.progress !== undefined)
    .reduce((acc, program) => acc + (program.progress || 0), 0) / programs.length;

  return (
    <div className="space-y-8">
      <DashboardOverview 
        metrics={[
          { title: "Active Programs", value: activeProgramsCount.toString(), change: "+3", description: "Training courses offered" },
          { title: "Enrolled Trainees", value: totalTrainees.toString(), change: "+12%", description: "Current enrollment" },
          { title: "Completion Rate", value: `${Math.round(averageCompletion)}%`, change: "+2%", description: "Average success rate" },
          { title: "Upcoming Programs", value: plannedProgramsCount.toString(), change: "+1", description: "Scheduled to begin" }
        ]}
      />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Enrollment Trends</CardTitle>
              <Badge variant="outline">Last 6 Months</Badge>
            </div>
            <CardDescription>Trainee enrollment statistics</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={enrollmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="trainees" 
                  stroke="#0ea5e9" 
                  activeDot={{ r: 8 }} 
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Program Distribution</CardTitle>
            <CardDescription>By category</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={programCategoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {programCategoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value}%`} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Upcoming Programs</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <CardDescription>Next 30 days program schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {programs.filter(program => program.status === 'planned' || program.status === 'active')
                .slice(0, 3).map(program => (
                <div key={program.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{program.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5 me-1" /> 
                      <span>{program.trainees} trainees</span>
                      <span className="mx-2">•</span>
                      <span>Starts: {program.startDate}</span>
                    </div>
                  </div>
                  <Badge variant={program.status === 'active' ? 'default' : 'outline'}>
                    {program.status === 'active' ? 'Active' : 'Planned'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full">Manage Programs</Button>
          </CardFooter>
        </Card>
        
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Upcoming Assessments</CardTitle>
              <Button variant="outline" size="sm">View All</Button>
            </div>
            <CardDescription>Assessment schedule</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assessments.map(assessment => (
                <div key={assessment.id} className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{assessment.title}</h4>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="h-3.5 w-3.5 me-1" /> 
                      <span>{assessment.candidates} candidates</span>
                      <span className="mx-2">•</span>
                      <span>{assessment.date}</span>
                      {assessment.duration && (
                        <>
                          <span className="mx-2">•</span>
                          <span>{assessment.duration} min</span>
                        </>
                      )}
                    </div>
                  </div>
                  <Badge 
                    className={
                      assessment.type === 'certification' 
                        ? 'bg-blue-500/10 text-blue-500' 
                        : assessment.type === 'skills' 
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-purple-500/10 text-purple-500'
                    }
                  >
                    {assessment.type}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="ghost" size="sm" className="w-full">Manage Assessments</Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Performance Metrics</CardTitle>
          <CardDescription>Key indicators of program effectiveness</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Trainee Satisfaction</span>
              <span className="text-sm text-muted-foreground">92%</span>
            </div>
            <Progress value={92} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Course Completion Rate</span>
              <span className="text-sm text-muted-foreground">87%</span>
            </div>
            <Progress value={87} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Job Placement Rate</span>
              <span className="text-sm text-muted-foreground">78%</span>
            </div>
            <Progress value={78} className="h-2" />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Certification Success Rate</span>
              <span className="text-sm text-muted-foreground">94%</span>
            </div>
            <Progress value={94} className="h-2" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OverviewTab;
