import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import VideoInterviewRoom from '@/components/recruiter/interviews/VideoInterviewRoom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

const VideoInterviewPage = () => {
    const { sessionId } = useParams<{ sessionId: string }>();
    const navigate = useNavigate();

    const handleEndSession = () => {
        // Navigate back to interviews list
        navigate('/recruiter/interviews');
    };

    const handleBack = () => {
        navigate('/recruiter/interviews');
    };

    if (!sessionId) {
        return <div>Invalid Session ID</div>;
    }

    return (
        <div className="min-h-screen bg-slate-950 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                <div className="flex items-center gap-4 text-white mb-6">
                    <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10" onClick={handleBack}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Interviews
                    </Button>
                    <h1 className="text-2xl font-bold">Video Interview Session</h1>
                </div>

                <VideoInterviewRoom
                    sessionId={sessionId}
                    onEnd={handleEndSession}
                />
            </div>
        </div>
    );
};

export default VideoInterviewPage;
