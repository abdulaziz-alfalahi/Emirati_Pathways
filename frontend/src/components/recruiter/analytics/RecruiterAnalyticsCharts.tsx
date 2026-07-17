import React from 'react';
import { BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

// Trend / time-to-hire-by-department / source-distribution series are not provided
// by any backend endpoint yet. Rather than display fabricated charts as this
// recruiter's data, render an honest empty state until real series are wired in.
export const RecruiterAnalyticsCharts: React.FC = () => {
    return (
        <Card className="shadow-sm mb-6">
            <CardHeader>
                <CardTitle>Recruitment Trends</CardTitle>
                <CardDescription>Applications, time-to-hire and source breakdown over time</CardDescription>
            </CardHeader>
            <CardContent className="h-[300px] flex flex-col items-center justify-center text-center">
                <BarChart3 className="h-8 w-8 text-slate-300 mb-3" />
                <p className="text-sm font-medium text-slate-500">No analytics data yet</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Trend charts will appear here once enough recruitment activity has been recorded.
                </p>
            </CardContent>
        </Card>
    );
};
