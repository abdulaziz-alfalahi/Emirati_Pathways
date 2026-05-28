import React from 'react';
import {
  LiveKitRoom,
  VideoConference,
  RoomAudioRenderer,
} from '@livekit/components-react';
import '@livekit/components-styles';

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
    livekitUrl,
    token
}) => {
    if (!livekitUrl || !token) {
        return (
            <div className="h-full w-full min-h-[500px] flex flex-col items-center justify-center bg-slate-900 rounded-lg text-slate-400">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
                <p>Connecting to Video Server...</p>
            </div>
        );
    }

    return (
        <LiveKitRoom
            serverUrl={livekitUrl}
            token={token}
            connect={true}
            video={!isObserver}
            audio={!isObserver}
            onDisconnected={onEndCall}
            data-lk-theme="default"
            style={{ height: '100%', minHeight: '500px', borderRadius: '0.5rem', overflow: 'hidden' }}
        >
            <VideoConference />
            <RoomAudioRenderer />
        </LiveKitRoom>
    );
};
