
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { IntegrationLogEntry } from '@/services/credentialVerification/utils/logger/types';

interface VerificationMetricsChartProps {
  data: IntegrationLogEntry[];
}

export const VerificationMetricsChart: React.FC<VerificationMetricsChartProps> = ({ data }) => {
  // Process data for hourly success/failure rates
  const processHourlyData = () => {
    const hourlyData = new Map();
    
    data.forEach(log => {
      const hour = new Date(log.timestamp).getHours();
      const key = `${hour}:00`;
      
      if (!hourlyData.has(key)) {
        hourlyData.set(key, { time: key, success: 0, failure: 0, total: 0 });
      }
      
      const entry = hourlyData.get(key);
      entry.total++;
      
      if (log.level === 'error') {
        entry.failure++;
      } else if (log.level === 'info' && log.message.includes('verification completed successfully')) {
        entry.success++;
      }
    });
    
    return Array.from(hourlyData.values()).sort((a, b) => 
      parseInt(a.time) - parseInt(b.time)
    );
  };

  // Process data for service performance
  const processServiceData = () => {
    const serviceData = new Map();
    
    data.forEach(log => {
      if (!serviceData.has(log.service)) {
        serviceData.set(log.service, { service: log.service, requests: 0, errors: 0, avgDuration: 0 });
      }
      
      const entry = serviceData.get(log.service);
      entry.requests++;
      
      if (log.level === 'error') {
        entry.errors++;
      }
      
      if (log.duration) {
        entry.avgDuration = ((entry.avgDuration * (entry.requests - 1)) + log.duration) / entry.requests;
      }
    });
    
    return Array.from(serviceData.values());
  };

  const hourlyData = processHourlyData();
  const serviceData = processServiceData();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Hourly Success/Failure Rate */}
      <Card>
        <CardHeader>
          <CardTitle>Hourly Verification Trends</CardTitle>
          <CardDescription>Success and failure rates over the last 24 hours</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="success" 
                stroke="#22c55e" 
                strokeWidth={2}
                name="Successful"
              />
              <Line 
                type="monotone" 
                dataKey="failure" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="Failed"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Service Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Service Performance</CardTitle>
          <CardDescription>Request volume and error rates by service</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="requests" fill="#3b82f6" name="Total Requests" />
              <Bar dataKey="errors" fill="#ef4444" name="Errors" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Response Time Distribution */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Response Time Analysis</CardTitle>
          <CardDescription>Average response times by service</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={serviceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="service" />
              <YAxis label={{ value: 'Response Time (ms)', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value) => [`${Math.round(value as number)}ms`, 'Avg Response Time']} />
              <Bar dataKey="avgDuration" fill="#8b5cf6" name="Avg Response Time" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};
