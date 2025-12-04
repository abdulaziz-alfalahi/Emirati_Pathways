import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { UserPlus, Star, Briefcase, Loader2 } from 'lucide-react';
import { restClient } from '@/utils/api';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Mentor {
    id: string;
    name: string;
    industry: string;
    expertise: string[];
    company: string;
    job_title: string;
    image_url: string;
}

interface MentorRecommendation {
    mentor: Mentor;
    match_score: number;
    match_reasons: string[];
    skill_match_score: number;
}

interface MentorRecommendationsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    candidateName: string;
    candidateId: string;
    candidateData: any;
    missingSkills: string[];
}

const MentorRecommendationsDialog: React.FC<MentorRecommendationsDialogProps> = ({
    isOpen,
    onClose,
    candidateName,
    candidateId,
    candidateData,
    missingSkills,
}) => {
    const [recommendations, setRecommendations] = useState<MentorRecommendation[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchRecommendations();
        }
    }, [isOpen]);

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const response = await restClient.post('/api/recruiter/mentorship/recommend', {
                candidate_id: candidateId,
                candidate_data: candidateData,
                missing_skills: missingSkills,
            });
            if (response.data.success) {
                setRecommendations(response.data.recommendations);
            }
        } catch (error) {
            console.error('Failed to fetch mentor recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Recommended Mentors for {candidateName}</DialogTitle>
                    <DialogDescription>
                        AI-matched mentors to help bridge skill gaps and guide career growth.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex flex-wrap gap-2 items-center">
                        <span className="text-sm text-muted-foreground">Focus Areas:</span>
                        {missingSkills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-blue-600 border-blue-200 bg-blue-50">
                                {skill}
                            </Badge>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                        </div>
                    ) : recommendations.length > 0 ? (
                        <div className="grid gap-4">
                            {recommendations.map((rec) => (
                                <Card key={rec.mentor.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                                    <CardContent className="pt-6">
                                        <div className="flex flex-col md:flex-row gap-4 justify-between">
                                            <div className="flex gap-4">
                                                <Avatar className="h-16 w-16 border-2 border-white shadow-sm">
                                                    <AvatarImage src={rec.mentor.image_url} />
                                                    <AvatarFallback className="bg-blue-100 text-blue-700 text-lg">
                                                        {rec.mentor.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                                                    </AvatarFallback>
                                                </Avatar>

                                                <div>
                                                    <h3 className="font-bold text-lg">{rec.mentor.name}</h3>
                                                    <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                        <Briefcase className="h-3 w-3" />
                                                        {rec.mentor.job_title} at {rec.mentor.company}
                                                    </div>
                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                        {rec.mentor.expertise.slice(0, 3).map((exp, i) => (
                                                            <Badge key={i} variant="secondary" className="text-xs">
                                                                {exp}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end justify-between min-w-[120px]">
                                                <div className="text-center">
                                                    <div className="text-2xl font-bold text-blue-600">{rec.match_score}%</div>
                                                    <div className="text-xs text-muted-foreground">Match Score</div>
                                                </div>

                                                <Button size="sm" className="w-full mt-2">
                                                    <UserPlus className="h-4 w-4 mr-2" />
                                                    Assign Mentor
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                                            <div className="flex items-center gap-1 text-green-600">
                                                <Star className="h-3 w-3 fill-current" />
                                                {rec.match_reasons[0]}
                                            </div>
                                            {rec.match_reasons[1] && (
                                                <div className="flex items-center gap-1 text-blue-600">
                                                    <Star className="h-3 w-3 fill-current" />
                                                    {rec.match_reasons[1]}
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            <UserPlus className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No specific mentor matches found at this time.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default MentorRecommendationsDialog;
