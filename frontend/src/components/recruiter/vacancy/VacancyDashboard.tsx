import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    FileText,
    Users,
    Video,
    CheckCircle,
    ArrowLeft,
    Briefcase,
    TrendingUp,
    Settings
} from 'lucide-react';
import { VacancySetup } from './VacancySetup';
import { VacancySourcing } from './VacancySourcing';
import { VacancyAssessment } from './VacancyAssessment';
import { VacancyDecision } from './VacancyDecision';

interface VacancyDashboardProps {
    job: any;
    onBack: () => void;
}

export const VacancyDashboard: React.FC<VacancyDashboardProps> = ({ job, onBack }) => {
    console.log("VacancyDashboard received job:", job); // DEBUG: Check keys
    const [activeTab, setActiveTab] = useState("setup");
    const jdId = job?.id || job?.jd_id;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="icon" onClick={onBack}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h2 className="text-2xl font-bold flex items-center">
                            {job?.title || 'Untitled Vacancy'}
                            <Badge variant="outline" className="ms-3 border-blue-200 text-blue-700 bg-blue-50">
                                {job?.status || 'Active'}
                            </Badge>
                        </h2>
                        <p className="text-gray-500 text-sm">Vacancy ID: {jdId}</p>
                    </div>
                </div>
            </div>

            {/* Main Lifecycle Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4 lg:w-[600px] mb-8">
                    <TabsTrigger value="setup" className="flex items-center gap-2">
                        <FileText className="h-4 w-4" /> Setup
                    </TabsTrigger>
                    <TabsTrigger value="sourcing" className="flex items-center gap-2">
                        <Users className="h-4 w-4" /> Sourcing
                    </TabsTrigger>
                    <TabsTrigger value="assessment" className="flex items-center gap-2">
                        <Video className="h-4 w-4" /> Assessment
                    </TabsTrigger>
                    <TabsTrigger value="decision" className="flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" /> Decision
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6">
                    {activeTab === 'setup' && <VacancySetup jdId={jdId} initialData={job} />}
                    {activeTab === 'sourcing' && <VacancySourcing job={job} />}
                    {activeTab === 'assessment' && <VacancyAssessment job={job} />}
                    {activeTab === 'decision' && <VacancyDecision job={job} />}
                </div>
            </Tabs>
        </div>
    );
};
