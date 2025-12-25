
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Circle } from 'lucide-react';
import { restClient } from '@/utils/api';

// Use relative URL so it goes through Vite Proxy (which forwards to Backend)
// This works for Localhost AND Ngrok/Remote
const SOCKET_URL = '/';
const SOCKET_OPTIONS = {
    transports: ['websocket', 'polling'], // Try WebSocket first? No, default is polling. Let's explicit allow both.
    reconnectionAttempts: 5,
};

interface VideoRoomProps {
    sessionId: string;
    userId: string;
    userName: string;
    onEndCall: () => void;
    isRecruiter?: boolean;
    isObserver?: boolean; // New prop for Admin/Observer
}

const ICE_SERVERS = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' }
    ]
};

export const VideoRoom: React.FC<VideoRoomProps> = ({ sessionId, userId, onEndCall, isObserver = false }) => {
    const [stream, setStream] = useState<MediaStream>();
    const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map());

    // Refs
    // ... (same refs)
    const socketRef = useRef<Socket>();
    const userVideo = useRef<HTMLVideoElement>(null);
    const pcsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
    const streamRef = useRef<MediaStream>();
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);

    // Controls
    const [audioEnabled, setAudioEnabled] = useState(!isObserver); // Start disabled if observer
    const [videoEnabled, setVideoEnabled] = useState(!isObserver);
    const [isRecording, setIsRecording] = useState(false);

    // Debug Helper
    const addDebug = (msg: string) => {
        console.log(`[VideoRoom] ${msg}`);
    };

    useEffect(() => {
        // Initialize Socket
        socketRef.current = io(SOCKET_URL, SOCKET_OPTIONS);
        addDebug(`Init Socket: ${SOCKET_URL} (Observer: ${isObserver})`);

        socketRef.current.on('connect', () => addDebug(`Socket Connected: ${socketRef.current?.id}`));
        socketRef.current.on('connect_error', (err) => addDebug(`Socket Error: ${err.message}`));

        const initMedia = async () => {
            let currentStream: MediaStream | undefined;

            if (!isObserver) {
                try {
                    currentStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    setStream(currentStream);
                    streamRef.current = currentStream;
                    if (userVideo.current) {
                        userVideo.current.srcObject = currentStream;
                    }
                } catch (err: any) {
                    addDebug(`Media Error: ${err.message}`);
                    console.error("Media Error:", err);
                }
            } else {
                addDebug("Observer Mode: Skipping local media.");
            }

            // Join Room
            addDebug(`Joining Room: ${sessionId}`);
            socketRef.current?.emit('join', { room: sessionId, userId });

            // Candidate Queue to handle race conditions
            const candidateQueues = new Map<string, RTCIceCandidate[]>();

            socketRef.current?.on('user-connected', async ({ sid }) => {
                addDebug(`User Connected: ${sid}`);

                if (pcsRef.current.has(sid)) {
                    addDebug(`Already have connection for ${sid}, ignoring user-connected.`);
                    return;
                }

                try {
                    const pc = createPeerConnection(sid, currentStream);
                    const offer = await pc.createOffer();
                    await pc.setLocalDescription(offer);
                    socketRef.current?.emit('signal', {
                        target: sid,
                        room: sessionId,
                        signal: { type: 'offer', sdp: offer }
                    });
                    addDebug(`Sent Offer to ${sid}`);
                } catch (err) {
                    console.error("Error creating offer:", err);
                }
            });

            // Signal Queue to prevent race conditions but guarantee processing
            const signalQueues = new Map<string, any[]>();
            const isProcessing = new Set<string>();

            const processSignalQueue = async (sender: string) => {
                if (isProcessing.has(sender)) return;

                const queue = signalQueues.get(sender);
                if (!queue || queue.length === 0) return;

                isProcessing.add(sender);

                try {
                    while (queue.length > 0) {
                        const signal = queue.shift(); // Process Next
                        addDebug(`Processing Signal ${signal.type} from ${sender.slice(0, 4)}`);

                        let pc = pcsRef.current.get(sender);

                        try {
                            if (signal.type === 'offer') {
                                if (!pc) {
                                    pc = createPeerConnection(sender, currentStream);
                                }

                                if (pc.signalingState !== 'stable') {
                                    addDebug("Glare detected. Rolling back.");
                                    await Promise.all([
                                        pc.setLocalDescription({ type: 'rollback' }),
                                        pc.setRemoteDescription(new RTCSessionDescription(signal.sdp))
                                    ]);
                                } else {
                                    await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));
                                }

                                // Process Internal Candidate Queue (from pre-remote-desc candidates)
                                // Note: This is separate from the Signal Queue we are building now.
                                // We keep the existing candidateQueue logic for internal "early candidates" 
                                // that might have been processed by the Signal Queue but couldn't be added to PC yet.
                                const iceQueue = candidateQueues.get(sender) || [];
                                if (iceQueue.length > 0) {
                                    addDebug(`Processing ${iceQueue.length} queued ICE candidates for ${sender}`);
                                    for (const candidate of iceQueue) {
                                        await pc.addIceCandidate(candidate);
                                    }
                                    candidateQueues.delete(sender);
                                }

                                const answer = await pc.createAnswer();
                                await pc.setLocalDescription(answer);
                                socketRef.current?.emit('signal', {
                                    target: sender,
                                    room: sessionId,
                                    signal: { type: 'answer', sdp: answer }
                                });
                                addDebug(`Sent Answer to ${sender.slice(0, 4)}`);
                            }

                            else if (signal.type === 'answer') {
                                if (pc && pc.signalingState === 'have-local-offer') {
                                    try {
                                        await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp));

                                        const iceQueue = candidateQueues.get(sender) || [];
                                        if (iceQueue.length > 0) {
                                            for (const candidate of iceQueue) {
                                                await pc.addIceCandidate(candidate);
                                            }
                                            candidateQueues.delete(sender);
                                        }
                                    } catch (e: any) {
                                        addDebug(`Failed to set remote answer: ${e.message}`);
                                    }
                                }
                            }

                            else if (signal.type === 'candidate') {
                                if (signal.candidate) {
                                    const iceCandidate = new RTCIceCandidate(signal.candidate);
                                    if (pc && pc.remoteDescription) { // Only add if remote desc is set
                                        await pc.addIceCandidate(iceCandidate);
                                    } else {
                                        // Still queue internally if remote desc is missing
                                        const iceQueue = candidateQueues.get(sender) || [];
                                        iceQueue.push(iceCandidate);
                                        candidateQueues.set(sender, iceQueue);
                                    }
                                }
                            }

                        } catch (err: any) {
                            addDebug(`Error processing signal ${signal.type}: ${err.message}`);
                        }
                    }
                } finally {
                    isProcessing.delete(sender);
                    // Check if more items arrived while processing (loop check handles shifts, but concurrency check)
                    // If queue is not empty, re-trigger? 
                    // The loop `while(queue.length > 0)` handles it. 
                    // But if we just deleted 'sender' from isProcessing, and a new 'on' event fires, it will call processSignalQueue.
                    // So we are good.
                }
            };

            socketRef.current?.on('signal', async (data) => {
                const { sender, signal } = data;

                // Add to Queue
                if (!signalQueues.has(sender)) {
                    signalQueues.set(sender, []);
                }
                signalQueues.get(sender)?.push(signal);

                // Trigger Processing
                processSignalQueue(sender);
            });
        };

        initMedia();
        // Return existing cleanup logic
        return () => {
            // ... existing cleanup code (will be kept by replace_file_content matching)
            // Actually, I need to verify I'm returning the right block.
            // The StartLine/EndLine logic of replace_file_content replaces the BLOCK.
            // I need to make sure I include the cleanup or valid end.

            socketRef.current?.disconnect();
            if (mediaRecorderRef.current && isRecording) {
                stopRecording();
            }
            streamRef.current?.getTracks().forEach(track => track.stop());
            pcsRef.current.forEach(pc => pc.close());
            pcsRef.current.clear();
        };
    }, [sessionId, userId, isObserver]);

    const createPeerConnection = (targetSid: string, stream?: MediaStream) => {
        const pc = new RTCPeerConnection(ICE_SERVERS);

        if (stream) {
            stream.getTracks().forEach(track => {
                pc.addTrack(track, stream);
            });
        } else {
            // Observer Mode: Recvonly transceivers
            pc.addTransceiver('video', { direction: 'recvonly' });
            pc.addTransceiver('audio', { direction: 'recvonly' });
        }

        pc.ontrack = (event) => {
            const remoteStream = event.streams[0];
            addDebug(`Remote Track Received: ${remoteStream.id} (Tracks: ${remoteStream.getTracks().length})`);
            setRemoteStreams(prev => {
                const newMap = new Map(prev);
                newMap.set(targetSid, remoteStream);
                return newMap;
            });
        };

        pc.onicecandidate = (event) => {
            if (event.candidate) {
                socketRef.current?.emit('signal', {
                    target: targetSid,
                    room: sessionId,
                    signal: { type: 'candidate', candidate: event.candidate }
                });
            }
        };

        pc.oniceconnectionstatechange = () => {
            addDebug(`ICE State Check: ${pc.iceConnectionState}`);
            if (pc.iceConnectionState === 'disconnected' || pc.iceConnectionState === 'closed') {
                setRemoteStreams(prev => {
                    const newMap = new Map(prev);
                    newMap.delete(targetSid);
                    return newMap;
                });
                pcsRef.current.delete(targetSid);
            }
        };

        pcsRef.current.set(targetSid, pc);
        return pc;
    };
    // End of createPeerConnection logic above



    // Recording Logic
    const startRecording = () => {
        if (!streamRef.current) return;

        const mediaRecorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        mediaRecorderRef.current = mediaRecorder;

        let chunkIndex = 0;

        mediaRecorder.ondataavailable = async (event) => {
            if (event.data.size > 0) {
                const formData = new FormData();
                formData.append('chunk', event.data);
                formData.append('index', chunkIndex.toString());
                formData.append('is_final', 'false');

                chunkIndex++;
                await restClient.post(`/api/interviews/sessions/${sessionId}/record/chunk`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
            }
        };

        mediaRecorder.start(2000);
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            const formData = new FormData();
            formData.append('chunk', new Blob([]));
            formData.append('index', '-1');
            formData.append('is_final', 'true');
            restClient.post(`/api/interviews/sessions/${sessionId}/record/chunk`, formData);
        }
    };

    const toggleAudio = () => {
        if (streamRef.current) {
            streamRef.current.getAudioTracks().forEach(track => track.enabled = !audioEnabled);
            setAudioEnabled(!audioEnabled);
        }
    }

    const toggleVideo = () => {
        if (streamRef.current) {
            streamRef.current.getVideoTracks().forEach(track => track.enabled = !videoEnabled);
            setVideoEnabled(!videoEnabled);
        }
    }

    return (
        <div className="flex flex-col h-full bg-slate-950 text-white p-4">
            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 relative">
                {remoteStreams.size === 0 && (
                    <div className="flex items-center justify-center h-full border border-slate-800 rounded-lg bg-slate-900 col-span-full">
                        <div className="text-center">
                            <div className="animate-pulse h-4 w-4 bg-teal-500 rounded-full mx-auto mb-4"></div>
                            <p className="text-slate-400">Waiting for others to join...</p>
                            <p className="text-xs text-slate-600 mt-2">Session ID: {sessionId}</p>
                        </div>
                    </div>
                )}

                {Array.from(remoteStreams.entries()).map(([sid, stream]) => (
                    <div key={sid} className="relative w-full h-full bg-black rounded-lg overflow-hidden border border-slate-700">
                        <VideoPlayer stream={stream} />
                        <div className="absolute bottom-4 left-4 bg-black/60 px-2 py-1 rounded text-sm">
                            Remote User ({sid.slice(0, 4)})
                        </div>
                    </div>
                ))}
            </div>

            <div className="h-20 flex items-center justify-center space-x-4 mt-4 bg-slate-900 rounded-xl p-2 relative">
                {!isObserver && (
                    <div className="absolute left-4 bottom-4 w-32 h-24 bg-black rounded-lg overflow-hidden border border-slate-700 shadow-lg">
                        <video ref={userVideo} muted autoPlay playsInline className="w-full h-full object-cover" />
                        <div className="absolute bottom-1 left-1 text-[10px] bg-black/50 px-1 rounded">You</div>
                    </div>
                )}

                {!isObserver && (
                    <>
                        <Button variant={audioEnabled ? "secondary" : "destructive"} size="icon" onClick={toggleAudio} className="rounded-full h-12 w-12">
                            {audioEnabled ? <Mic /> : <MicOff />}
                        </Button>

                        <Button variant={videoEnabled ? "secondary" : "destructive"} size="icon" onClick={toggleVideo} className="rounded-full h-12 w-12">
                            {videoEnabled ? <Video /> : <VideoOff />}
                        </Button>

                        <Button
                            variant={isRecording ? "destructive" : "outline"}
                            onClick={isRecording ? stopRecording : startRecording}
                            className="rounded-full"
                        >
                            <Circle className={`mr-2 h-4 w-4 ${isRecording ? 'fill-current animate-pulse' : ''}`} />
                            {isRecording ? "Recording..." : "Record"}
                        </Button>
                    </>
                )}

                {isObserver && (
                    <div className="text-sm text-slate-400 mr-4 font-mono border px-2 py-1 rounded border-slate-700">
                        👀 Observer Mode
                    </div>
                )}

                <Button variant="destructive" size="icon" onClick={onEndCall} className="rounded-full h-12 w-12 ml-8">
                    <PhoneOff />
                </Button>
            </div>
        </div>
    );
};

const VideoPlayer: React.FC<{ stream: MediaStream }> = ({ stream }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current) {
            console.log(`[VideoPlayer] Assigning stream ${stream.id} to video`, stream.getTracks());
            videoRef.current.srcObject = stream;
        }
    }, [stream]);
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
            onLoadedMetadata={() => console.log("[VideoPlayer] Metadata loaded")}
            onPlay={() => console.log("[VideoPlayer] Playing")}
        />
    );
};
