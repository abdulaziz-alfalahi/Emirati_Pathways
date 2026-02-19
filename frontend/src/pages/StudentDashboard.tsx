import React, { useState, useEffect } from 'react';
import HybridGovernmentNav from "@/components/layout/HybridGovernmentNavFixed";
import UserMenu from "@/components/layout/UserMenu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GraduationCap, Award, BookOpen, User, Calendar, ExternalLink } from "lucide-react";

import { restClient } from '@/utils/api';

// Mock API Call
const fetchStudentData = async () => {
    try {
        const response = await restClient.get('/api/student/dashboard/stats');
        return response.data; // restClient returns AxiosResponse, but our wrap interceptor might be different. 
        // Wait, looking at api.ts, restClient is raw axios instance.
        // It does NOT automatically unwrap data unless wrapped.
        // But the previous code expected `await res.json()`.
        // The endpoint returns { success: true, data: { ... } }
        // So response.data will be the JSON body.
    } catch (e) {
        console.error(e);
        // Return Mock
        return {
            success: true,
            data: {
                applications_submitted: 0,
                upcoming_interviews: 0,
            }
        };
    }
};

const fetchPrograms = async (type: string) => {
    try {
        const response = await restClient.get(`/api/student/programs?type=${type}`);
        return response.data.data;
    } catch (e) {
        return [];
    }
}

export const StudentDashboard = () => {
    const [activeTab, setActiveTab] = useState("scholarships");
    const [stats, setStats] = useState<any>(null);
    const [programs, setPrograms] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            const s = await fetchStudentData();
            // Optional chaning to be safe
            setStats(s?.data || {});
            const p = await fetchPrograms(activeTab === 'scholarships' ? 'scholarship' : 'camp');
            setPrograms(p || []);
            setLoading(false);
        };
        load();
    }, [activeTab]);

    return (
        <div className="min-h-screen bg-background">
            <HybridGovernmentNav showAuthButtons={false} currentPage="dashboard" userRole="student" />

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
                {/* Welcome Section */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Welcome, Future Leader! 🇦🇪</h1>
                        <p className="text-muted-foreground mt-2">Your journey to excellence starts here.</p>
                    </div>
                    <UserMenu />
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Applications Active</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.applications_submitted || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Scholarships & Programs</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Upcoming Programs</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats?.saved_programs || 0}</div>
                            <p className="text-xs text-muted-foreground mt-1">Events you're interested in</p>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-teal-500 to-emerald-600 text-white border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-semibold text-lg">Student Profile</h3>
                                <GraduationCap className="h-6 w-6 opacity-80" />
                            </div>
                            <p className="text-teal-50 text-sm mb-4">Complete your academic profile to unlock more opportunities.</p>
                            <Button variant="secondary" size="sm" className="w-full text-teal-700 font-semibold" onClick={() => window.location.href = '/profile'}>
                                Update Profile
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
                        <TabsTrigger value="scholarships">Scholarships</TabsTrigger>
                        <TabsTrigger value="camps">Knowledge Camps</TabsTrigger>
                        <TabsTrigger value="university">University</TabsTrigger>
                    </TabsList>

                    <TabsContent value="scholarships" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {programs.map((p: any) => (
                                <Card key={p.id} className="bg-card hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="outline" className="mb-2">{p.type}</Badge>
                                                <CardTitle className="text-xl">{p.title}</CardTitle>
                                                <CardDescription>{p.provider}</CardDescription>
                                            </div>
                                            <Badge className="bg-teal-100 text-teal-800 hover:bg-teal-200">{p.amount}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-4">
                                            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> Deadline: {p.deadline}</span>
                                            <span className="flex items-center"><Award className="h-4 w-4 mr-1" /> Min GPA: {p.min_gpa}</span>
                                        </div>
                                        <Button className="w-full">Apply Now</Button>
                                    </CardContent>
                                </Card>
                            ))}
                            {programs.length === 0 && !loading && (
                                <p className="text-center text-gray-500 col-span-2 py-8">No scholarships found matching your profile.</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="camps" className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {programs.map((p: any) => (
                                <Card key={p.id} className="bg-card hover:shadow-md transition-shadow">
                                    <CardHeader>
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2">{p.age_group} Years</Badge>
                                                <CardTitle className="text-xl">{p.title}</CardTitle>
                                                <CardDescription>{p.organizer}</CardDescription>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center text-sm text-gray-500 gap-4 mb-4">
                                            <span className="flex items-center"><Calendar className="h-4 w-4 mr-1" /> {p.date}</span>
                                        </div>
                                        <p className="text-sm text-gray-600 mb-4 flex items-center"><ExternalLink className="h-3 w-3 mr-1" /> {p.location}</p>
                                        <Button variant="outline" className="w-full">View Details</Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </TabsContent>

                    <TabsContent value="university" className="mt-6">
                        <Card>
                            <CardContent className="py-12 text-center text-gray-500">
                                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <h3 className="text-lg font-medium mb-1">University Programs Coming Soon</h3>
                                <p>We are partnering with top universities to bring you exclusive programs.</p>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
};

export default StudentDashboard;
