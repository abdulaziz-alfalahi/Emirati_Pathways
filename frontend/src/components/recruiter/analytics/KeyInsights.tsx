import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles } from 'lucide-react';

// AI-generated insights are not wired to a backend yet. Render an honest
// placeholder rather than fabricated trend/percentage claims presented as AI output.
export const KeyInsights: React.FC = () => {
    return (
        <Card className="shadow-sm border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-teal-800">
                    <Sparkles className="h-5 w-5 text-teal-600" />
                    AI Key Insights
                </CardTitle>
                <CardDescription>
                    Smart summary of your recruitment performance trends
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="py-8 text-center">
                    <Sparkles className="h-6 w-6 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500 font-medium">AI insights not available yet</p>
                    <p className="text-xs text-slate-400 mt-1">
                        Insights will appear here once enough recruitment activity has been recorded.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
};
