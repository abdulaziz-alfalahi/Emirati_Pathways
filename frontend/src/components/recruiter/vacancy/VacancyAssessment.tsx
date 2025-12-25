
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
    Video,
    Calendar as CalendarIcon,
    Clock,
    MoreVertical,
    Bot,
    BrainCircuit,
    CheckCircle2,
    XCircle,
    Link,
    Users
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface VacancyAssessmentProps {
    job: any;
}

export const VacancyAssessment: React.FC<VacancyAssessmentProps> = ({ job }) => {
    const { toast } = useToast();
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<string>("");

    // Mock Interviews Data (Replace with API fetch filtered by job.id)
    const interviews = [
        {
            id: "1",
            candidate: "Khalid Al Mazrouei",
            time: "Today, 2:00 PM",
            status: "upcoming",
            round: "Technical Round",
            interviewer: "Omar Recruiter"
        },
        {
            id: "2",
            candidate: "Fatima Al Ali",
            time: "Tomorrow, 10:00 AM",
            status: "scheduled",
            round: "Culture Fit",
            interviewer: "Sarah HR"
        }
    ];

    const handleSchedule = () => {
        setScheduleOpen(false);
        toast({
            title: "Interview Scheduled",
            description: `Invitation sent to ${selectedCandidate} for ${date ? format(date, "PPP") : "selected date"}.`
        });
    };

    return (
        <div className="space-y-6">

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main List */}
                <div className="md:col-span-2 space-y-6">

                    {/* Header / Actions */}
                    <div className="flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
                        <div>
                            <h3 className="text-lg font-semibold">Scheduled Interviews</h3>
                            <p className="text-sm text-gray-500">2 Upcoming • 5 Completed</p>
                        </div>
                        <Dialog open={scheduleOpen} onOpenChange={setScheduleOpen}>
                            <DialogTrigger asChild>
                                <Button className="bg-indigo-600 hover:bg-indigo-700">
                                    <CalendarIcon className="h-4 w-4 mr-2" />
                                    Smart Schedule
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[500px]">
                                <DialogHeader>
                                    <DialogTitle>Smart Schedule Interview</DialogTitle>
                                    <DialogDescription>
                                        AI will suggest optimal times based on candidate and interviewer availability.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <Label>Candidate</Label>
                                        <Select onValueChange={setSelectedCandidate}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select candidate from shortlist" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Khalid Al Mazrouei">Khalid Al Mazrouei (95% Match)</SelectItem>
                                                <SelectItem value="Sara Ahmed">Sara Ahmed (88% Match)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label>Date</Label>
                                        <div className="border rounded-md p-2">
                                            <Calendar
                                                mode="single"
                                                selected={date}
                                                onSelect={setDate}
                                                className="rounded-md border shadow-none border-none"
                                            />
                                        </div>
                                    </div>

                                    <div className="bg-indigo-50 p-3 rounded-lg flex items-start gap-3">
                                        <Bot className="h-5 w-5 text-indigo-600 mt-1" />
                                        <div>
                                            <p className="text-sm font-medium text-indigo-900">AI Recommendation</p>
                                            <p className="text-xs text-indigo-700">Best times for Khalid: {date ? format(date, "EEE") : "Day"} between 10 AM - 2 PM.</p>
                                        </div>
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setScheduleOpen(false)}>Cancel</Button>
                                    <Button onClick={handleSchedule}>Send Invitation</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* List */}
                    {interviews.map((interview) => (
                        <Card key={interview.id} className="hover:border-indigo-300 transition-colors cursor-pointer group">
                            <CardContent className="p-0">
                                <div className="flex items-center p-4">

                                    {/* Time Box */}
                                    <div className="flex-none w-20 text-center border-r pr-4 mr-4">
                                        <span className="block text-xs font-bold text-indigo-600 uppercase tracking-wider">{interview.status}</span>
                                        <span className="block text-sm font-medium text-gray-900 mt-1">{interview.time.split(',')[0]}</span>
                                        <span className="block text-lg font-bold text-gray-800">{interview.time.split(',')[1]}</span>
                                    </div>

                                    {/* Details */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="text-base font-semibold text-gray-900 truncate">{interview.candidate}</h4>
                                            <Badge variant="secondary" className="text-xs font-normal bg-indigo-50 text-indigo-700 border-indigo-100">
                                                {interview.round}
                                            </Badge>
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span className="flex items-center gap-1"><Video className="h-3 w-3" /> Zoom Meeting</span>
                                            <span className="flex items-center gap-1"><Users className="h-3 w-3" /> w/ {interview.interviewer}</span>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Button size="sm" className="hidden group-hover:flex bg-green-600 hover:bg-green-700">
                                            Join Now
                                        </Button>
                                        <Button variant="ghost" size="icon">
                                            <MoreVertical className="h-4 w-4 text-gray-400" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                </div>

                {/* Sidebar: AI Co-Pilot */}
                <div className="space-y-6">
                    <Card className="bg-gradient-to-b from-indigo-50 to-white border-indigo-100">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-indigo-700">
                                <BrainCircuit className="h-5 w-5" />
                                Live Interview Co-Pilot
                            </CardTitle>
                            <CardDescription>
                                AI assistance during calls.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-lg border shadow-sm">
                                <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                    <Bot className="h-4 w-4 text-green-600" />
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium block">Real-time Analysis</span>
                                    <span className="text-gray-500 text-xs">Active</span>
                                </div>
                                <Switch id="ai-active" checked={true} />
                            </div>

                            <div className="space-y-2">
                                <Label className="text-xs text-gray-500 uppercase font-bold tracking-wide">Features Enabled</Label>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Bias Detection</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Emotional Sentiment</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    <span>Technical Fact-Check</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

        </div>
    );
};
