
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    CheckCircle,
    XCircle,
    Clock,
    FileSignature,
    Send,
    UserCheck
} from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { recruiterService, Candidate } from "@/services/recruiterService";
import { getDisplayName } from '@/utils/nameUtils';

interface VacancyDecisionProps {
    job: any;
}

export const VacancyDecision: React.FC<VacancyDecisionProps> = ({ job }) => {
    const { toast } = useToast();
    const [offerOpen, setOfferOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchCandidates = async () => {
            if (job?.id) {
                const data = await recruiterService.getPipelineCandidates(job.id);
                setCandidates(data);
            }
        };
        fetchCandidates();
    }, [job?.id]);

    const handleSendOffer = async () => {
        try {
            await recruiterService.sendOffer({
                candidateId: selectedCandidate?.id,
                jobId: job?.id,
                // Add other offer details from form here
            });
            setOfferOpen(false);
            toast({
                title: "Offer Sent Successfully",
                description: `Employment offer sent to ${selectedCandidate?.name}. Waiting for candidate acceptance.`
            });
        } catch (error) {
            toast({
                title: "Error Sending Offer",
                description: "There was a problem sending the offer. Please try again.",
                variant: "destructive"
            });
        }
    };

    const startOffer = (candidate: any) => {
        setSelectedCandidate(candidate);
        setOfferOpen(true);
    };

    return (
        <div className="space-y-6">

            {/* Summary Cards */}
            <div className="grid grid-cols-4 gap-4">
                <Card className="bg-blue-50 border-blue-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-blue-600 font-semibold uppercase">Pending Approval</p>
                            <p className="text-2xl font-bold text-blue-900">1</p>
                        </div>
                        <Clock className="h-8 w-8 text-blue-200" />
                    </CardContent>
                </Card>
                <Card className="bg-green-50 border-green-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-green-600 font-semibold uppercase">Approved</p>
                            <p className="text-2xl font-bold text-green-900">1</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-green-200" />
                    </CardContent>
                </Card>
                <Card className="bg-purple-50 border-purple-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-purple-600 font-semibold uppercase">Offers Sent</p>
                            <p className="text-2xl font-bold text-purple-900">0</p>
                        </div>
                        <Send className="h-8 w-8 text-purple-200" />
                    </CardContent>
                </Card>
                <Card className="bg-teal-50 border-teal-100">
                    <CardContent className="p-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs text-teal-600 font-semibold uppercase">Hired</p>
                            <p className="text-2xl font-bold text-teal-900">0</p>
                        </div>
                        <UserCheck className="h-8 w-8 text-teal-200" />
                    </CardContent>
                </Card>
            </div>

            {/* Pipeline List */}
            <Card>
                <CardHeader>
                    <CardTitle>Decision Pipeline</CardTitle>
                    <CardDescription>Manage approvals and offers for shortlisted candidates.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {candidates.map((candidate) => (
                            <div key={candidate.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">

                                {/* Candidate Info */}
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-12 w-12 border-2 border-white shadow-sm">
                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold">{candidate.first_name?.charAt(0) || candidate.name?.charAt(0) || '?'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h4 className="font-semibold text-gray-900">{getDisplayName(candidate)}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Badge variant={candidate.match > 90 ? "default" : "secondary"} className="text-xs">
                                                {candidate.match}% Match
                                            </Badge>
                                            <span>• Exp: {candidate.salary_expectation}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-6">

                                    {/* Status Indicator */}
                                    <div className="text-right">
                                        <div className="flex items-center justify-end gap-2 mb-1">
                                            {candidate.status === 'approved' && <CheckCircle className="h-4 w-4 text-green-600" />}
                                            {candidate.status === 'recommended' && <Clock className="h-4 w-4 text-amber-500" />}
                                            <span className="text-sm font-medium capitalize text-gray-700">
                                                {candidate.status.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-400 italic">"{candidate.hr_feedback}"</p>
                                    </div>

                                    {/* Action Button */}
                                    {candidate.status === 'approved' ? (
                                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => startOffer(candidate)}>
                                            <FileSignature className="h-4 w-4 mr-2" />
                                            Draft Offer
                                        </Button>
                                    ) : (
                                        <Button variant="outline" disabled className="opacity-50">
                                            <Clock className="h-4 w-4 mr-2" />
                                            Awaiting Approval
                                        </Button>
                                    )}

                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Offer Builder Dialog */}
            <Dialog open={offerOpen} onOpenChange={setOfferOpen}>
                <DialogContent className="max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Draft Employment Offer</DialogTitle>
                        <DialogDescription>
                            Create an official offer for {selectedCandidate?.name}. This will be sent to HR for final sign-off before reaching the candidate.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-2 gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Position Title</Label>
                            <Input defaultValue={job?.title} />
                        </div>
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Input type="date" />
                        </div>
                        <div className="space-y-2">
                            <Label>Annual Base Salary (AED)</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-gray-500">AED</span>
                                <Input className="pl-12" placeholder="300,000" />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Employment Type</Label>
                            <Input defaultValue="Full-time Permanent" />
                        </div>
                        <div className="col-span-2 space-y-2">
                            <Label>Benefits Package</Label>
                            <Textarea placeholder="• Health Insurance (Family)&#10;• Annual Air Ticket&#10;• Education Allowance" className="h-24" />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOfferOpen(false)}>Save Draft</Button>
                        <Button onClick={handleSendOffer} className="bg-green-600 hover:bg-green-700">
                            <Send className="h-4 w-4 mr-2" />
                            Send for Approval
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
};

