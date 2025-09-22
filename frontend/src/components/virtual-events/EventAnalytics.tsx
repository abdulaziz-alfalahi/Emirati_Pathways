
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Activity, Users, TrendingUp, FileText } from 'lucide-react';
import EngagementDashboard from './EngagementDashboard';
import BoothHeatmap from './BoothHeatmap';
import RealTimeAnalytics from './RealTimeAnalytics';
import PostEventDashboard from './PostEventDashboard';

interface EventAnalyticsProps {
  eventId: string;
}

const EventAnalytics: React.FC<EventAnalyticsProps> = ({ eventId }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into attendee engagement and event performance
          </p>
        </div>
      </div>

      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="realtime" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Real-Time
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Booth Heatmap
          </TabsTrigger>
          <TabsTrigger value="followup" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Post-Event
          </TabsTrigger>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Overview
          </TabsTrigger>
        </TabsList>

        <TabsContent value="realtime">
          <RealTimeAnalytics eventId={eventId} />
        </TabsContent>

        <TabsContent value="engagement">
          <EngagementDashboard eventId={eventId} />
        </TabsContent>

        <TabsContent value="heatmap">
          <BoothHeatmap eventId={eventId} />
        </TabsContent>

        <TabsContent value="followup">
          <PostEventDashboard eventId={eventId} />
        </TabsContent>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Summary</CardTitle>
                <CardDescription>Overall event performance metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Registrations</span>
                    <span className="text-lg font-bold">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Active Attendees</span>
                    <span className="text-lg font-bold">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Average Session Duration</span>
                    <span className="text-lg font-bold">--</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Total Interactions</span>
                    <span className="text-lg font-bold">--</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Popular Features</CardTitle>
                <CardDescription>Most used event features</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Virtual Booths</span>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Networking</span>
                    <span className="text-sm font-medium">72%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Q&A Sessions</span>
                    <span className="text-sm font-medium">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm">Breakout Rooms</span>
                    <span className="text-sm font-medium">45%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventAnalytics;
