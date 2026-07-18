import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import InterviewAnalytics from '@/components/recruiter/interviews/InterviewAnalytics';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const InterviewAnalyticsPage = () => {
    const { interviewId } = useParams<{ interviewId: string }>();
    const navigate = useNavigate();

    const handleBack = () => {
        navigate('/recruiter/interviews');
    };

    if (!interviewId) {
        return <div>Invalid Interview ID</div>;
    }

    return (
        <div className="min-h-screen bg-background p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4 mb-6">
                    <Button variant="ghost" onClick={handleBack}>
                        <ArrowLeft className="me-2 h-4 w-4" /> Back to Interviews
                    </Button>
                    <h1 className="text-2xl font-bold">Interview Analytics</h1>
                </div>

                <InterviewAnalytics interviewId={interviewId} />
            </div>
        </div>
    );
};

export default InterviewAnalyticsPage;
