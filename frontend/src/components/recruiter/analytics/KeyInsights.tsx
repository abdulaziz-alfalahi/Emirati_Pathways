import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, TrendingDown, TrendingUp, AlertCircle } from 'lucide-react';

export const KeyInsights: React.FC = () => {
    return (
        <Card className="shadow-sm border-teal-100 bg-gradient-to-br from-white to-teal-50/30">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-teal-800">
                        <Sparkles className="h-5 w-5 text-teal-600" />
                        AI Key Insights
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-1 bg-teal-100 text-teal-700 rounded-full">
                        Generated just now
                    </span>
                </div>
                <CardDescription>
                    Smart summary of your recruitment performance trends
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-50 shadow-sm">
                        <div className="mt-1 bg-green-100 p-1.5 rounded-full">
                            <TrendingDown className="h-4 w-4 text-green-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-800">Time to Hire Improved</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                Average time to hire has decreased by <span className="font-bold text-green-600">12%</span> this month compared to last quarter, driven by faster feedback in the Engineering department.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-50 shadow-sm">
                        <div className="mt-1 bg-blue-100 p-1.5 rounded-full">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-800">Application Volume Surge</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                You received <span className="font-bold text-blue-600">25% more applications</span> for "Senior Python Developer" after updating the job description benefits section.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 p-3 bg-white rounded-lg border border-teal-50 shadow-sm">
                        <div className="mt-1 bg-amber-100 p-1.5 rounded-full">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-slate-800">Pipeline Bottleneck Detected</h4>
                            <p className="text-sm text-slate-600 mt-1">
                                Candidates are spending an average of <span className="font-bold text-amber-600">8 days</span> in the "Technical Interview" stage. Consider adding more interview slots.
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
