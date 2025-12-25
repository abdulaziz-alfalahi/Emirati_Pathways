
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThumbsUp, ThumbsDown, Eye, EyeOff, Users, Sliders } from 'lucide-react';
import CandidateMatching from '../CandidateMatching';

interface VacancySourcingProps {
    job: any; // Using any for now to avoid strict type issues with older interfaces
}

export const VacancySourcing: React.FC<VacancySourcingProps> = ({ job }) => {
    const [blindHiringMode, setBlindHiringMode] = useState(false);
    const [collabVoting, setCollabVoting] = useState(false);

    // Wrapper related logic

    return (
        <div className="space-y-6">
            {/* 1. Sourcing Toolbar (Strategic Enhancements) */}
            <Card className="bg-slate-50 border-slate-200">
                <CardContent className="py-4 flex flex-wrap gap-6 items-center justify-between">

                    <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Sliders className="h-4 w-4" />
                        <span className="font-medium">Sourcing Mode:</span>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Blind Hiring Toggle */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="blind-hiring"
                                checked={blindHiringMode}
                                onCheckedChange={setBlindHiringMode}
                            />
                            <Label htmlFor="blind-hiring" className="flex items-center gap-2 cursor-pointer">
                                {blindHiringMode ? <EyeOff className="h-4 w-4 text-purple-600" /> : <Eye className="h-4 w-4 text-gray-500" />}
                                <span>Blind Hiring</span>
                                {blindHiringMode && <Badge variant="secondary" className="ml-1 text-xs bg-purple-100 text-purple-700">Active</Badge>}
                            </Label>
                        </div>

                        {/* Collaborative Voting Toggle */}
                        <div className="flex items-center space-x-2">
                            <Switch
                                id="collab-voting"
                                checked={collabVoting}
                                onCheckedChange={setCollabVoting}
                            />
                            <Label htmlFor="collab-voting" className="flex items-center gap-2 cursor-pointer">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>Collaborative Voting</span>
                            </Label>
                        </div>
                    </div>

                </CardContent>
            </Card>

            {/* 2. Main Matching Component */}
            <div className={blindHiringMode ? "blind-mode-active" : ""}>
                {/* We pass the job object to CandidateMatching */}
                {/* If CandidateMatching supports blind mode prop, pass it. If not, CSS blur/masking can be used */}
                <CandidateMatching
                    selectedJob={job}
                    onBack={() => { }} // Back button is handled by outer dashboard, but component might need a dummy
                // isBlindMode={blindHiringMode} // Assuming we add this prop later
                />
            </div>

        </div>
    );
};
