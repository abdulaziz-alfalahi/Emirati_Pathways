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
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react';
import { restClient } from '@/utils/api';

interface TrainingProgram {
    id: string;
    curriculum_name: string;
    subject: string;
    grade_level: number;
    description: string;
    matched_skill: string;
}

interface TrainingRecommendationsDialogProps {
    isOpen: boolean;
    onClose: () => void;
    candidateName: string;
    missingSkills: string[];
}

const TrainingRecommendationsDialog: React.FC<TrainingRecommendationsDialogProps> = ({
    isOpen,
    onClose,
    candidateName,
    missingSkills,
}) => {
    const [recommendations, setRecommendations] = useState<TrainingProgram[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (isOpen && missingSkills.length > 0) {
            fetchRecommendations();
        }
    }, [isOpen, missingSkills]);

    const fetchRecommendations = async () => {
        setIsLoading(true);
        try {
            const response = await restClient.post('/api/recruiter/training/recommend', {
                missing_skills: missingSkills,
            });
            if (response.data.success) {
                setRecommendations(response.data.recommendations);
            }
        } catch (error) {
            console.error('Failed to fetch training recommendations:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Training Recommendations for {candidateName}</DialogTitle>
                    <DialogDescription>
                        Recommended programs to bridge skill gaps.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="flex flex-wrap gap-2">
                        <span className="text-sm text-muted-foreground self-center">Identified Gaps:</span>
                        {missingSkills.map((skill, i) => (
                            <Badge key={i} variant="outline" className="text-red-600 border-red-200 bg-red-50">
                                {skill}
                            </Badge>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                        </div>
                    ) : recommendations.length > 0 ? (
                        <div className="grid gap-4">
                            {recommendations.map((program) => (
                                <Card key={program.id} className="border-s-4 border-s-teal-500">
                                    <CardHeader className="pb-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <Badge variant="secondary" className="mb-2">
                                                    Matches: {program.matched_skill}
                                                </Badge>
                                                <CardTitle className="text-lg">{program.curriculum_name}</CardTitle>
                                            </div>
                                            <Button variant="ghost" size="sm">
                                                <ExternalLink className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground mb-3">{program.description}</p>
                                        <div className="flex gap-4 text-xs text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <BookOpen className="h-3 w-3" />
                                                {program.subject}
                                            </div>
                                            <div>Grade Level: {program.grade_level}</div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 text-muted-foreground bg-slate-50 rounded-lg border border-dashed">
                            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-20" />
                            <p>No specific training programs found for these skills.</p>
                            <p className="text-xs mt-1">Try adjusting the skill keywords or browsing the full catalog.</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default TrainingRecommendationsDialog;
