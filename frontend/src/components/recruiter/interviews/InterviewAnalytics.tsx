import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from 'recharts';
import { BrainCircuit, MessageSquare, ThumbsUp, AlertCircle, Clock, CheckCircle } from 'lucide-react';

interface AnalyticsProps {
    interviewId: string;
}

const InterviewAnalytics: React.FC<AnalyticsProps> = ({ interviewId }) => {
    // Mock data - in a real app, fetch based on interviewId
    const summaryData = {
        overallScore: 88,
        sentiment: 'Positive',
        keywords: ['Leadership', 'React', 'System Design', 'Scalability', 'Teamwork'],
        duration: '45:20',
        speakingRatio: '65% Candidate / 35% Interviewer'
    };

    const sentimentData = [
        { time: '00:00', score: 60 },
        { time: '05:00', score: 75 },
        { time: '10:00', score: 85 },
        { time: '15:00', score: 80 },
        { time: '20:00', score: 90 },
        { time: '25:00', score: 85 },
        { time: '30:00', score: 70 },
        { time: '35:00', score: 88 },
        { time: '40:00', score: 92 },
        { time: '45:00', score: 95 },
    ];

    const skillsData = [
        { subject: 'Technical', A: 90, fullMark: 100 },
        { subject: 'Communication', A: 85, fullMark: 100 },
        { subject: 'Problem Solving', A: 88, fullMark: 100 },
        { subject: 'Culture Fit', A: 92, fullMark: 100 },
        { subject: 'Leadership', A: 80, fullMark: 100 },
    ];

    const topicData = [
        { name: 'Intro', score: 85 },
        { name: 'Experience', score: 90 },
        { name: 'Technical Qs', score: 82 },
        { name: 'System Design', score: 78 },
        { name: 'Behavioral', score: 95 },
        { name: 'Closing', score: 90 },
    ];

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Score</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryData.overallScore}/100</div>
                        <p className="text-xs text-muted-foreground">Top 10% of candidates</p>
                        <Progress value={summaryData.overallScore} className="mt-2" />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sentiment</CardTitle>
                        <ThumbsUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryData.sentiment}</div>
                        <p className="text-xs text-muted-foreground">Consistently positive tone</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Duration</CardTitle>
                        <Clock className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{summaryData.duration}</div>
                        <p className="text-xs text-muted-foreground">{summaryData.speakingRatio}</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Key Topics</CardTitle>
                        <BrainCircuit className="h-4 w-4 text-purple-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {summaryData.keywords.slice(0, 3).map((k, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">{k}</Badge>
                            ))}
                            {summaryData.keywords.length > 3 && (
                                <Badge variant="outline" className="text-xs">+{summaryData.keywords.length - 3}</Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="transcript">Transcript & Sentiment</TabsTrigger>
                    <TabsTrigger value="skills">Skills Assessment</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Topic Performance</CardTitle>
                                <CardDescription>Score breakdown by interview section</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={topicData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis domain={[0, 100]} />
                                        <Tooltip />
                                        <Bar dataKey="score" fill="#0f766e" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                        <Card className="col-span-1">
                            <CardHeader>
                                <CardTitle>Skills Radar</CardTitle>
                                <CardDescription>Competency visualization</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={skillsData}>
                                        <PolarGrid />
                                        <PolarAngleAxis dataKey="subject" />
                                        <PolarRadiusAxis angle={30} domain={[0, 100]} />
                                        <Radar name="Candidate" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="transcript" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Sentiment Analysis Timeline</CardTitle>
                            <CardDescription>Emotional tone throughout the interview</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={sentimentData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="time" />
                                    <YAxis domain={[0, 100]} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={2} />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Key Highlights</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-3 items-start p-3 bg-green-50 rounded-lg border border-green-100">
                                    <ThumbsUp className="h-5 w-5 text-green-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-green-900">Strong Leadership Examples</h4>
                                        <p className="text-sm text-green-700">Candidate provided specific examples of conflict resolution and team motivation at 15:30.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-blue-900">Clear Technical Explanation</h4>
                                        <p className="text-sm text-blue-700">Excellent breakdown of microservices architecture concepts during the system design question.</p>
                                    </div>
                                </div>
                                <div className="flex gap-3 items-start p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    <div>
                                        <h4 className="font-semibold text-yellow-900">Follow-up Recommended</h4>
                                        <p className="text-sm text-yellow-700">Probe deeper into specific database optimization experience in the next round.</p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="skills">
                    <Card>
                        <CardHeader>
                            <CardTitle>Detailed Skills Assessment</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {skillsData.map((skill, i) => (
                                    <div key={i} className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span className="font-medium">{skill.subject}</span>
                                            <span className="text-muted-foreground">{skill.A}/100</span>
                                        </div>
                                        <Progress value={skill.A} className="h-2" />
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
};

export default InterviewAnalytics;
