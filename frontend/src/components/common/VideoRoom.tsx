
import React, { useState, useEffect, useRef } from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';
import { 
  Mic, 
  MicOff, 
  Video as VideoIcon, 
  VideoOff, 
  PhoneOff, 
  Monitor, 
  Wifi,
  User,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { useNotifications } from '@/components/notifications/NotificationSystem';

interface VideoRoomProps {
    sessionId: string;
    userId: string;
    userName: string;
    onEndCall: () => void;
    isRecruiter?: boolean;
    isObserver?: boolean;
    livekitUrl?: string;
    token?: string;
}

export const VideoRoom: React.FC<VideoRoomProps> = ({ 
    sessionId, 
    userId, 
    userName, 
    onEndCall, 
    isObserver = false,
    isRecruiter = false,
    livekitUrl,
    token
}) => {
    const { socket } = useNotifications();
    const [connectionFailed, setConnectionFailed] = useState(false);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
    const makingOfferRef = useRef(false);

    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOn, setIsCameraOn] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [simulatedSignal, setSimulatedSignal] = useState(5); // 5 bars

    // Detection logic for Mock/Simulation mode
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
    const isLocalhostUrl = livekitUrl?.includes('localhost') || livekitUrl?.includes('127.0.0.1');
    const shouldMock = connectionFailed || !livekitUrl || !token || (isHttps && livekitUrl.startsWith('ws://')) || isLocalhostUrl;

    const videoRef = useRef<HTMLVideoElement>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    // Ref keeps the P2P effect in sync with localStream without being a dependency
    const localStreamRef = useRef<MediaStream | null>(null);
    localStreamRef.current = localStream;

    // Auto-fallback to direct call if LiveKit takes > 10 seconds to connect
    useEffect(() => {
        if (livekitUrl && token && !connectionFailed) {
            const timer = setTimeout(() => {
                console.warn("LiveKit connection timed out after 10s. Falling back to Direct Connection.");
                setConnectionFailed(true);
                toast.info("Switching to backup Direct Connection mode...");
            }, 10000);
            return () => clearTimeout(timer);
        }
    }, [livekitUrl, token, connectionFailed]);

    // Setup Local Camera Stream
    useEffect(() => {
        if (shouldMock && isCameraOn && !isObserver) {
            let activeStream: MediaStream | null = null;
            navigator.mediaDevices.getUserMedia({ 
                video: { width: 640, height: 480, facingMode: 'user' }, 
                audio: true 
            })
            .then(stream => {
                activeStream = stream;
                setLocalStream(stream);
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                }
            })
            .catch(err => {
                console.warn("Simulated VideoRoom: Camera/Mic access denied or unavailable:", err);
            });

            return () => {
                if (activeStream) {
                    activeStream.getTracks().forEach(track => track.stop());
                }
            };
        } else {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
                setLocalStream(null);
            }
        }
    }, [shouldMock, isCameraOn, isObserver]);

    // Handle Local Audio track mute toggle
    useEffect(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !isMuted;
            });
        }
    }, [isMuted, localStream]);

    // Setup Direct WebRTC Peer-to-Peer connection when falling back.
    // IMPORTANT: localStream is accessed via ref to avoid effect re-runs that
    // would destroy the peer connection when the camera stream initializes.
    useEffect(() => {
        if (!shouldMock || !socket) return;

        const roomName = `interview_session_${sessionId}`;
        // Use isRecruiter as a stable "polite" flag to resolve offer glare.
        // The recruiter is "impolite" (always sends offers); the guest is "polite".
        const isPolite = !isRecruiter;
        console.log(`[P2P Video] Joining Socket.io signaling room: ${roomName} (polite=${isPolite})`);

        const createPeerConnection = () => {
            console.log(`[P2P Video] Creating RTCPeerConnection`);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
            }

            const pc = new RTCPeerConnection({
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' }
                ]
            });

            // Add tracks from the current stream (may be null; tracks added dynamically below)
            const stream = localStreamRef.current;
            if (stream) {
                stream.getTracks().forEach(track => {
                    pc.addTrack(track, stream);
                });
            }

            pc.ontrack = (event) => {
                console.log('[P2P Video] Remote track received:', event.streams[0]);
                if (event.streams && event.streams[0]) {
                    setRemoteStream(event.streams[0]);
                }
            };

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    socket.emit('ice-candidate', {
                        room: roomName,
                        candidate: event.candidate
                    });
                }
            };

            pc.oniceconnectionstatechange = () => {
                console.log(`[P2P Video] ICE state: ${pc.iceConnectionState}`);
            };

            // "Perfect negotiation" — handle onnegotiationneeded for dynamic track adds
            pc.onnegotiationneeded = async () => {
                try {
                    makingOfferRef.current = true;
                    const offer = await pc.createOffer();
                    if (pc.signalingState !== 'stable') return;
                    await pc.setLocalDescription(offer);
                    socket.emit('offer', { room: roomName, offer: pc.localDescription });
                } catch (err) {
                    console.error('[P2P Video] negotiationneeded error:', err);
                } finally {
                    makingOfferRef.current = false;
                }
            };

            peerConnectionRef.current = pc;
            return pc;
        };

        // Create the peer connection immediately (before tracks may be available)
        createPeerConnection();

        const handlePeerJoined = async () => {
            console.log('[P2P Video] Peer joined signaling room. Initiating offer.');
            const pc = peerConnectionRef.current;
            if (!pc) return;
            try {
                makingOfferRef.current = true;
                const offer = await pc.createOffer();
                if (pc.signalingState !== 'stable') return;
                await pc.setLocalDescription(offer);
                socket.emit('offer', { room: roomName, offer: pc.localDescription });
            } catch (err) {
                console.error('[P2P Video] Failed to create or send offer:', err);
            } finally {
                makingOfferRef.current = false;
            }
        };

        const handleOffer = async (data: any) => {
            console.log('[P2P Video] Offer received from peer.');
            const pc = peerConnectionRef.current;
            if (!pc) return;

            // Perfect negotiation: polite peer rolls back if there's a collision
            const offerCollision = makingOfferRef.current || pc.signalingState !== 'stable';
            if (offerCollision && !isPolite) {
                console.log('[P2P Video] Ignoring offer (impolite peer, collision)');
                return;
            }

            try {
                if (offerCollision) {
                    // Polite peer rolls back its own offer
                    await Promise.all([
                        pc.setLocalDescription({ type: 'rollback' }),
                        pc.setRemoteDescription(new RTCSessionDescription(data.offer))
                    ]);
                } else {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.offer));
                }
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                socket.emit('answer', { room: roomName, answer: pc.localDescription });
            } catch (err) {
                console.error('[P2P Video] Failed to process offer or create answer:', err);
            }
        };

        const handleAnswer = async (data: any) => {
            console.log('[P2P Video] Answer received from peer.');
            const pc = peerConnectionRef.current;
            if (!pc) return;
            try {
                if (pc.signalingState === 'have-local-offer') {
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                } else {
                    console.warn('[P2P Video] Ignoring answer in state:', pc.signalingState);
                }
            } catch (err) {
                console.error('[P2P Video] Failed to set remote description:', err);
            }
        };

        const handleIceCandidate = async (data: any) => {
            const pc = peerConnectionRef.current;
            if (pc && data.candidate) {
                try {
                    await pc.addIceCandidate(new RTCIceCandidate(data.candidate));
                } catch (err) {
                    // ICE candidates arriving before remote description is set — safe to ignore
                    if (!pc.remoteDescription) return;
                    console.error('[P2P Video] Failed to add remote ICE candidate:', err);
                }
            }
        };

        socket.on('peer-joined', handlePeerJoined);
        socket.on('offer', handleOffer);
        socket.on('answer', handleAnswer);
        socket.on('ice-candidate', handleIceCandidate);

        // Join the signaling room (triggers 'peer-joined' for anyone already in it)
        socket.emit('join', { room: roomName });

        return () => {
            console.log('[P2P Video] Cleaning up signaling listeners and connection');
            socket.emit('leave', { room: roomName });
            socket.off('peer-joined', handlePeerJoined);
            socket.off('offer', handleOffer);
            socket.off('answer', handleAnswer);
            socket.off('ice-candidate', handleIceCandidate);
            if (peerConnectionRef.current) {
                peerConnectionRef.current.close();
                peerConnectionRef.current = null;
            }
            setRemoteStream(null);
        };
    }, [shouldMock, socket, sessionId, isRecruiter]);

    // Dynamically add/replace tracks on the existing peer connection when localStream changes.
    // This handles the case where the camera initializes after the peer connection is created.
    useEffect(() => {
        const pc = peerConnectionRef.current;
        if (!pc || !localStream) return;

        const senders = pc.getSenders();
        localStream.getTracks().forEach(track => {
            const existingSender = senders.find(s => s.track?.kind === track.kind);
            if (existingSender) {
                // Replace existing track (e.g. camera toggle)
                existingSender.replaceTrack(track).catch(err =>
                    console.warn('[P2P Video] replaceTrack failed:', err)
                );
            } else {
                // First-time add — triggers onnegotiationneeded for renegotiation
                pc.addTrack(track, localStream);
            }
        });
    }, [localStream]);

    // Periodically update signal quality indicator
    useEffect(() => {
        const interval = setInterval(() => {
            setSimulatedSignal(prev => {
                const change = Math.floor(Math.random() * 3) - 1; // -1, 0, or 1
                const next = prev + change;
                return Math.max(3, Math.min(5, next));
            });
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    // If we have a valid, secure connection and shouldn't mock, use LiveKitRoom
    if (!shouldMock && livekitUrl && token) {
        return (
            <div className="h-full w-full min-h-[500px] flex flex-col relative">
                {/* Connection Status & Manual Fallback Button */}
                <div className="absolute top-4 right-4 z-10">
                    <button 
                        onClick={() => {
                            console.log("User manually initiated Direct Connection fallback.");
                            setConnectionFailed(true);
                            toast.info("Switching to backup Direct Connection...");
                        }}
                        className="px-3 py-1.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-lg border border-slate-700 text-xs font-semibold shadow-lg transition-all"
                    >
                        Switch to Direct Call (P2P)
                    </button>
                </div>
                <LiveKitRoom
                    serverUrl={livekitUrl}
                    token={token}
                    connect={true}
                    video={!isObserver}
                    audio={!isObserver}
                    onDisconnected={onEndCall}
                    onError={(err) => {
                        console.error("LiveKit connection error:", err);
                        setConnectionFailed(true);
                        toast.error("LiveKit connection failed. Switching to Direct Call.");
                    }}
                    data-lk-theme="default"
                    style={{ height: '100%', minHeight: '500px', borderRadius: '0.5rem', overflow: 'hidden' }}
                >
                    <VideoConference />
                    <RoomAudioRenderer />
                </LiveKitRoom>
            </div>
        );
    }

    // Determine roles and labels
    const remoteRoleLabel = isRecruiter ? "Candidate" : "Interviewer / Recruiter";
    const remoteName = isRecruiter ? "Emirati Candidate" : "HR Specialist";

    return (
        <div className="h-full w-full min-h-[550px] flex flex-col bg-slate-950 text-white rounded-xl overflow-hidden shadow-2xl relative border border-slate-850">
            {/* Header Status Bar */}
            <div className="absolute top-4 left-4 right-4 flex items-center justify-between z-10 pointer-events-none">
                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs font-medium">
                    <span className={`h-2 w-2 rounded-full ${remoteStream ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`}></span>
                    <span className="text-slate-300">
                        {remoteStream ? 'Direct Call (P2P Active)' : connectionFailed ? 'Direct Call (Connecting...)' : 'Simulated Interview Session'}
                    </span>
                </div>

                <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-800 text-xs text-slate-300">
                    <Wifi className="h-3 w-3 text-emerald-400" />
                    <span>Connection: Strong ({simulatedSignal}/5)</span>
                </div>
            </div>

            {/* Video Grids */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 p-4 pt-16">
                {/* Left/Top: Remote Participant */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-850 flex flex-col items-center justify-center min-h-[220px]">
                    {remoteStream ? (
                        <video 
                            ref={(el) => {
                                if (el) el.srcObject = remoteStream;
                            }}
                            autoPlay 
                            playsInline 
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        /* Remote Simulated Avatar & Active Speaker wave */
                        <div className="flex flex-col items-center gap-4">
                            <div className="h-24 w-24 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-3xl font-bold text-white shadow-lg shadow-teal-500/20 ring-4 ring-slate-800 animate-pulse">
                                {remoteName.charAt(0)}
                            </div>
                            <div className="text-center">
                                <h4 className="font-bold text-lg text-slate-200">{remoteName}</h4>
                                <p className="text-xs text-teal-400 font-medium tracking-wide mt-1">{remoteRoleLabel}</p>
                            </div>
                            
                            {/* Audio Wave Simulator */}
                            <div className="flex items-center gap-1 h-6">
                                {[1, 2, 3, 4, 5, 4, 3, 2, 1].map((h, i) => (
                                    <div 
                                        key={i} 
                                        className="w-1 bg-teal-400/80 rounded-full transition-all duration-300"
                                        style={{ 
                                            height: `${h * (Math.random() * 3 + 2)}px`,
                                            animation: `pulse 1.2s infinite ease-in-out`,
                                            animationDelay: `${i * 0.1}s`
                                        }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Participant Tag */}
                    <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold flex items-center gap-2">
                        <User className="h-3 w-3 text-teal-400" />
                        <span>{remoteStream ? remoteName : `${remoteName} (Connecting...)`}</span>
                    </div>
                </div>

                {/* Right/Bottom: Local User Camera */}
                <div className="relative rounded-xl overflow-hidden bg-slate-900 border border-slate-855 flex flex-col items-center justify-center min-h-[220px]">
                    {isCameraOn && localStream ? (
                        <video 
                            ref={videoRef}
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover transform -scale-x-100"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-3">
                            <div className="h-20 w-20 rounded-full bg-slate-800 flex items-center justify-center text-2xl font-bold text-slate-400 border border-slate-700">
                                {userName.charAt(0)}
                            </div>
                            <div className="text-center">
                                <h4 className="font-semibold text-slate-300">{userName} (You)</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{isObserver ? 'Observer' : 'Camera Off'}</p>
                            </div>
                        </div>
                    )}

                    {/* Participant Tag */}
                    <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-semibold flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                        </span>
                        <span>{userName} (You)</span>
                    </div>
                </div>
            </div>

            {/* Bottom Controls Bar */}
            <div className="bg-slate-900 border-t border-slate-800 px-6 py-4 flex items-center justify-between">
                {/* Left controls: mic & camera */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            setIsMuted(!isMuted);
                            toast.success(isMuted ? "Microphone active" : "Microphone muted");
                        }}
                        className={`p-3 rounded-full border transition-all ${
                            isMuted 
                                ? 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30' 
                                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                        }`}
                        title={isMuted ? "Unmute Mic" : "Mute Mic"}
                    >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                    </button>

                    {!isObserver && (
                        <button 
                            onClick={() => {
                                setIsCameraOn(!isCameraOn);
                                toast.success(isCameraOn ? "Camera disabled" : "Camera enabled");
                            }}
                            className={`p-3 rounded-full border transition-all ${
                                !isCameraOn 
                                    ? 'bg-rose-500/20 border-rose-500 text-rose-400 hover:bg-rose-500/30' 
                                    : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-750'
                            }`}
                            title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                        >
                            {isCameraOn ? <VideoIcon className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                        </button>
                    )}
                </div>

                {/* Center controls: Screen Share & AI info */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => {
                            setIsScreenSharing(!isScreenSharing);
                            toast.success(isScreenSharing ? "Stopped screen sharing" : "Simulating screen sharing...");
                        }}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border text-sm font-semibold transition-all ${
                            isScreenSharing 
                                ? 'bg-sky-500/20 border-sky-500 text-sky-400 hover:bg-sky-500/30' 
                                : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
                        }`}
                    >
                        <Monitor className="h-4 w-4" />
                        <span>{isScreenSharing ? "Sharing" : "Share Screen"}</span>
                    </button>
                    
                    <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/10 border border-teal-500/20 text-xs text-teal-400 font-medium">
                        <Sparkles className="h-3.5 w-3.5 animate-spin" style={{ animationDuration: '4s' }} />
                        <span>AI Transcribe Active</span>
                    </div>
                </div>

                {/* Right controls: End Session */}
                <div>
                    <button 
                        onClick={() => {
                            toast.info("Ending call...");
                            onEndCall();
                        }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition-all shadow-lg shadow-rose-600/25 active:scale-95"
                    >
                        <PhoneOff className="h-4 w-4" />
                        <span>End Call</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
