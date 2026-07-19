
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Video, Calendar, Clock, Loader2, User, AlertCircle } from 'lucide-react';
import { restClient } from '@/utils/api';
import { getPrefixedDisplayName } from '@/utils/nameUtils';
import { VideoRoom } from '@/components/common/VideoRoom';
import { toast } from 'sonner';

export default function GuestLobby() {
    const { token } = useParams<{ token: string }>();
    const navigate = useNavigate();
    const [session, setSession] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [hasJoined, setHasJoined] = useState(false);
    const [guestName, setGuestName] = useState("");
    const [guestNameInput, setGuestNameInput] = useState("");

    useEffect(() => {
        if (!token) return;

        const fetchSession = async () => {
            try {
                const res = await restClient.get(`/api/interviews/guest/${token}`);
                if (res.data.success) {
                    setSession(res.data.data);
                } else {
                    setError("Invalid or expired invitation");
                }
            } catch (err) {
                setError("Failed to load interview details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSession();
        // TODO: Polling?
    }, [token]);

    const handleJoin = () => {
        if (!guestNameInput.trim()) {
            toast.error("Please enter your name");
            return;
        }
        setGuestName(guestNameInput);
        setHasJoined(true);
    };

    if (isLoading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
        </div>
    );

    if (error || !session) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <Card className="w-full max-w-md">
                <CardContent className="flex flex-col items-center p-8 text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Invitation Error</h3>
                    <p className="text-slate-600">{error || "Interview not found"}</p>
                    <Button variant="outline" className="mt-6" onClick={() => navigate('/')}>
                        Go to Homepage
                    </Button>
                </CardContent>
            </Card>
        </div>
    );

    // Active Call View
    if (hasJoined) {
        return (
            <div className="h-screen w-screen bg-slate-950">
                <VideoRoom
                    sessionId={session.id}
                    userId={`guest-${token}`} // Pseudo-ID for guest
                    userName={`${guestName} (Guest)`}
                    onEndCall={() => window.location.reload()}
                />
            </div>
        );
    }

    // Lobby View
    return (
        <div className="min-h-screen bg-gradient-to-br from-teal-50 to-slate-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="text-center">
                    <h1 className="text-3xl font-dubai-bold text-slate-900">Emirati Pathways</h1>
                    <p className="text-slate-600 mt-2">Video Interview Portal</p>
                </div>

                <Card className="border-t-4 border-t-teal-600 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto h-12 w-12 bg-teal-100 rounded-full flex items-center justify-center mb-4 text-teal-600">
                            <Video className="h-6 w-6" />
                        </div>
                        <CardTitle className="text-xl">
                            {session.title || "Interview Session"}
                        </CardTitle>
                        <CardDescription>
                            Hosted by {getPrefixedDisplayName(session, 'recruiter_', 'Recruiter')}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-6">
                        <div className="bg-slate-50 p-4 rounded-lg space-y-3 text-sm">
                            <div className="flex items-center justify-between text-slate-700">
                                <span className="flex items-center"><Calendar className="h-4 w-4 me-2" /> Date</span>
                                <span className="font-medium">{new Date(session.scheduled_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                                <span className="flex items-center"><Clock className="h-4 w-4 me-2" /> Time</span>
                                <span className="font-medium">{new Date(session.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                            <div className="flex items-center justify-between text-slate-700">
                                <span className="flex items-center"><User className="h-4 w-4 me-2" /> For</span>
                                <span className="font-medium">{getPrefixedDisplayName(session, 'candidate_', 'Invited Guest')}</span>
                            </div>
                        </div>

                        {session.status === 'cancelled' ? (
                            <div className="p-4 bg-red-50 text-red-700 rounded-lg text-center text-sm font-medium">
                                This interview has been cancelled.
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-slate-700">Enter your name to join</label>
                                    <input
                                        className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500"
                                        placeholder="Your Name"
                                        value={guestNameInput}
                                        onChange={(e) => setGuestNameInput(e.target.value)}
                                    />
                                </div>
                                <Button
                                    className="w-full bg-teal-600 hover:bg-teal-700 h-11 text-lg"
                                    onClick={handleJoin}
                                >
                                    Join Interview
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-slate-400">
                    System Check: Camera and Microphone permissions will be requested upon joining.
                </p>
            </div>
        </div>
    );
}
