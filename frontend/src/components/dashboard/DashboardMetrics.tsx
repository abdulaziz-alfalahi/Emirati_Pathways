
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { name: 'Jan', users: 25 },
  { name: 'Feb', users: 36 },
  { name: 'Mar', users: 40 },
  { name: 'Apr', users: 48 },
  { name: 'May', users: 55 },
  { name: 'Jun', users: 68 },
  { name: 'Jul', users: 75 },
  { name: 'Aug', users: 83 },
  { name: 'Sep', users: 92 },
  { name: 'Oct', users: 98 },
  { name: 'Nov', users: 102 },
  { name: 'Dec', users: 110 },
];

const DashboardMetrics: React.FC = () => {
  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Platform Growth</CardTitle>
          <CardDescription>User registrations over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="users" fill="#3BACB6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>Users by role</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Students</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-teal h-2.5 rounded-full" style={{ width: '45%' }}></div>
                </div>
                <span className="text-sm font-medium">45%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Parents</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-teal h-2.5 rounded-full" style={{ width: '25%' }}></div>
                </div>
                <span className="text-sm font-medium">25%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Institutions</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-teal h-2.5 rounded-full" style={{ width: '15%' }}></div>
                </div>
                <span className="text-sm font-medium">15%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Recruiters</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-teal h-2.5 rounded-full" style={{ width: '10%' }}></div>
                </div>
                <span className="text-sm font-medium">10%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Others</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-teal h-2.5 rounded-full" style={{ width: '5%' }}></div>
                </div>
                <span className="text-sm font-medium">5%</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Platform Usage</CardTitle>
            <CardDescription>Most active features</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Career Exploration</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-navy h-2.5 rounded-full" style={{ width: '68%' }}></div>
                </div>
                <span className="text-sm font-medium">68%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Resume Builder</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-navy h-2.5 rounded-full" style={{ width: '52%' }}></div>
                </div>
                <span className="text-sm font-medium">52%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Job Matching</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-navy h-2.5 rounded-full" style={{ width: '47%' }}></div>
                </div>
                <span className="text-sm font-medium">47%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Training Services</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-navy h-2.5 rounded-full" style={{ width: '35%' }}></div>
                </div>
                <span className="text-sm font-medium">35%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Mentorship</span>
                <div className="w-1/2 bg-gray-200 rounded-full h-2.5">
                  <div className="bg-emirati-navy h-2.5 rounded-full" style={{ width: '28%' }}></div>
                </div>
                <span className="text-sm font-medium">28%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DashboardMetrics;
