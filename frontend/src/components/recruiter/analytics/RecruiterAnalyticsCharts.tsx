import React from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Mock Data
const applicationsData = [
    { name: 'Jan', applications: 65, interviews: 28 },
    { name: 'Feb', applications: 59, interviews: 32 },
    { name: 'Mar', applications: 80, interviews: 41 },
    { name: 'Apr', applications: 81, interviews: 37 },
    { name: 'May', applications: 56, interviews: 25 },
    { name: 'Jun', applications: 95, interviews: 52 },
    { name: 'Jul', applications: 120, interviews: 60 },
];

const timeToHireData = [
    { name: 'Engineering', days: 45 },
    { name: 'Sales', days: 28 },
    { name: 'Marketing', days: 32 },
    { name: 'Product', days: 50 },
    { name: 'HR', days: 25 },
];

const sourceData = [
    { name: 'LinkedIn', value: 450 },
    { name: 'Referrals', value: 300 },
    { name: 'Job Boards', value: 200 },
    { name: 'Career Page', value: 150 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

export const RecruiterAnalyticsCharts: React.FC = () => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Applications Trend */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Applications & Interviews Trend</CardTitle>
                    <CardDescription>Monthly volume of new applications vs interviews scheduled</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                            data={applicationsData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                                itemStyle={{ color: '#1e293b' }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="applications" stroke="#0f766e" strokeWidth={2} activeDot={{ r: 8 }} name="Applications" />
                            <Line type="monotone" dataKey="interviews" stroke="#f59e0b" strokeWidth={2} name="Interviews" />
                        </LineChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Time to Hire by Department */}
            <Card className="shadow-sm">
                <CardHeader>
                    <CardTitle>Avg. Time to Hire by Department</CardTitle>
                    <CardDescription>Average days from application to offer acceptance</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={timeToHireData}
                            margin={{
                                top: 5,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip
                                cursor={{ fill: '#f1f5f9' }}
                                contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                            />
                            <Legend />
                            <Bar dataKey="days" fill="#0f766e" radius={[4, 4, 0, 0]} name="Days" />
                        </BarChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>

            {/* Source Distribution */}
            <Card className="shadow-sm lg:col-span-2">
                <CardHeader>
                    <CardTitle>Candidate Source Distribution</CardTitle>
                    <CardDescription>Where your successful hires are coming from</CardDescription>
                </CardHeader>
                <CardContent className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={sourceData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                outerRadius={100}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {sourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </CardContent>
            </Card>
        </div>
    );
};
