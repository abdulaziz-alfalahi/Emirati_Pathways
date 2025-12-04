import React, { useEffect, useState } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Zap } from 'lucide-react';

interface JobPostStrengthMeterProps {
    title: string;
    description: string;
    skills: string;
    salaryMin: number;
    salaryMax: number;
    location: string;
}

export const JobPostStrengthMeter: React.FC<JobPostStrengthMeterProps> = ({
    title,
    description,
    skills,
    salaryMin,
    salaryMax,
    location,
}) => {
    const [score, setScore] = useState(0);
    const [tips, setTips] = useState<string[]>([]);

    useEffect(() => {
        calculateStrength();
    }, [title, description, skills, salaryMin, salaryMax, location]);

    const calculateStrength = () => {
        let newScore = 0;
        const newTips: string[] = [];

        // Title check
        if (title.length > 5) newScore += 10;
        else newTips.push("Add a clear job title");

        // Location check
        if (location.length > 2) newScore += 10;
        else newTips.push("Specify a location");

        // Salary check
        if (salaryMin > 0 && salaryMax > salaryMin) newScore += 15;
        else newTips.push("Define a valid salary range");

        // Description length check
        if (description.length > 50) newScore += 10;
        if (description.length > 200) newScore += 15;
        else if (description.length <= 50) newTips.push("Expand the job description (>200 chars)");

        // Skills check
        const skillsCount = skills.split(',').filter(s => s.trim().length > 0).length;
        if (skillsCount >= 3) newScore += 20;
        else newTips.push("Add at least 3 key skills");
        if (skillsCount >= 5) newScore += 10;

        // Cap score at 100
        if (newScore > 100) newScore = 100;

        // Bonus for "perfect" score
        if (newScore === 90) {
            // If everything is good but maybe description is just short of amazing, give a nudge
            if (description.length < 500) newTips.push("Consider adding more details to the description for a perfect score");
            else newScore = 100;
        }

        setScore(newScore);
        setTips(newTips);
    };

    const getColor = () => {
        if (score < 40) return "bg-red-500";
        if (score < 70) return "bg-yellow-500";
        return "bg-green-500";
    };

    const getLabel = () => {
        if (score < 40) return "Weak";
        if (score < 70) return "Good";
        return "Strong";
    };

    return (
        <Card className="shadow-sm border-slate-200">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-slate-700 flex items-center gap-2">
                    <Zap className={`h-4 w-4 ${score >= 70 ? 'text-green-500' : 'text-yellow-500'}`} />
                    Job Post Strength
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-between mb-2">
                    <span className={`text-2xl font-bold ${score >= 70 ? 'text-green-600' : score >= 40 ? 'text-yellow-600' : 'text-red-600'}`}>
                        {score}%
                    </span>
                    <span className="text-sm font-medium text-slate-500">{getLabel()}</span>
                </div>
                <Progress value={score} className={`h-2 mb-4 ${getColor()}`} />

                <div className="space-y-2">
                    {tips.length > 0 ? (
                        tips.slice(0, 3).map((tip, index) => (
                            <div key={index} className="flex items-start gap-2 text-xs text-slate-600">
                                <AlertCircle className="h-3 w-3 text-orange-400 mt-0.5 flex-shrink-0" />
                                <span>{tip}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex items-center gap-2 text-xs text-green-600 font-medium">
                            <CheckCircle className="h-3 w-3" />
                            <span>Great job! This post looks strong.</span>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};
