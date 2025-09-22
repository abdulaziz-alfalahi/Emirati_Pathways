
import React, { useState } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

// Mock data - Would be fetched from an API in a real implementation
const workforceData = {
  'sectors': [
    { name: 'Technology', current: 12500, projected: 18750, growth: 50 },
    { name: 'Healthcare', current: 9500, projected: 13300, growth: 40 },
    { name: 'Finance', current: 8800, projected: 11000, growth: 25 },
    { name: 'Education', current: 7200, projected: 8640, growth: 20 },
    { name: 'Manufacturing', current: 6500, projected: 7150, growth: 10 },
    { name: 'Retail', current: 5800, projected: 6380, growth: 10 },
  ],
  'roles': [
    { name: 'Software Engineer', current: 4500, projected: 7650, growth: 70 },
    { name: 'Data Scientist', current: 3200, projected: 6080, growth: 90 },
    { name: 'Healthcare Tech', current: 2800, projected: 4480, growth: 60 },
    { name: 'Project Manager', current: 3500, projected: 4550, growth: 30 },
    { name: 'Cybersecurity', current: 2200, projected: 3960, growth: 80 },
    { name: 'Teacher/Educator', current: 3800, projected: 4560, growth: 20 },
  ],
  'skills': [
    { name: 'AI/ML', current: 3200, projected: 6720, growth: 110 },
    { name: 'Cloud Computing', current: 4500, projected: 8550, growth: 90 },
    { name: 'Data Analysis', current: 5200, projected: 8320, growth: 60 },
    { name: 'Cybersecurity', current: 3800, projected: 6460, growth: 70 },
    { name: 'Digital Marketing', current: 4200, projected: 5460, growth: 30 },
    { name: 'Project Management', current: 5500, projected: 6600, growth: 20 },
  ],
};

// Color constants
const CURRENT_COLOR = '#8884d8';
const PROJECTED_COLOR = '#82ca9d';

const WorkforceAnalytics = () => {
  const [tab, setTab] = useState('sectors');
  const [sortBy, setSortBy] = useState('growth');
  const [viewType, setViewType] = useState('comparison');
  
  // Get appropriate data based on selected tab
  let data = [...workforceData[tab as keyof typeof workforceData]];
  
  // Sort data based on selected sort method
  if (sortBy === 'growth') {
    data = data.sort((a, b) => b.growth - a.growth);
  } else if (sortBy === 'current') {
    data = data.sort((a, b) => b.current - a.current);
  } else if (sortBy === 'projected') {
    data = data.sort((a, b) => b.projected - a.current);
  }
  
  // Limit to top items if needed
  data = data.slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <Tabs defaultValue={tab} value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="sectors">Industry Sectors</TabsTrigger>
            <TabsTrigger value="roles">Job Roles</TabsTrigger>
            <TabsTrigger value="skills">Key Skills</TabsTrigger>
          </TabsList>
        </Tabs>
        
        <div className="flex gap-2">
          <Select value={viewType} onValueChange={setViewType}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Chart Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comparison">Current vs Projected</SelectItem>
              <SelectItem value="growth">Growth Rate</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Sort By" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="growth">Highest Growth</SelectItem>
              <SelectItem value="current">Highest Current</SelectItem>
              <SelectItem value="projected">Highest Projected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          {viewType === 'comparison' ? (
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toLocaleString()} jobs`} />
              <Legend />
              <Bar 
                name="Current Demand" 
                dataKey="current" 
                fill={CURRENT_COLOR} 
                barSize={20}
              />
              <Bar 
                name="Projected Demand (2 years)" 
                dataKey="projected" 
                fill={PROJECTED_COLOR} 
                barSize={20} 
              />
            </BarChart>
          ) : (
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis unit="%" />
              <Tooltip formatter={(value) => `${value}%`} />
              <Bar 
                name="Growth Rate (2 Years)" 
                dataKey="growth" 
                fill="#ff7300" 
                barSize={30}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
        <h3 className="font-medium text-blue-800 mb-1">Market Insight</h3>
        <p className="text-sm text-blue-700">
          {tab === 'sectors' && 
            'Technology and Healthcare sectors show the strongest growth trajectory, with 50% and 40% projected increases in workforce demand over the next two years.'}
          {tab === 'roles' && 
            'Data Science roles are showing the highest growth rate at 90%, followed by Cybersecurity specialists at 80%, indicating a strong shift toward data-driven and secure digital operations.'}
          {tab === 'skills' && 
            'AI/Machine Learning skills lead with 110% projected growth, while traditional project management skills show more modest growth at 20%, highlighting the technological transformation across industries.'}
        </p>
      </div>
    </div>
  );
};

export default WorkforceAnalytics;
