
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Pause, Volume2, Video } from 'lucide-react';

interface MediaPlayerProps {
  type: 'video' | 'audio';
  src: string;
  title?: string;
  thumbnail?: string;
  duration?: string;
  className?: string;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({ 
  type, 
  src, 
  title, 
  thumbnail, 
  duration, 
  className = '' 
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);

  const handlePlay = () => {
    setIsPlaying(!isPlaying);
    if (type === 'video' && !showPlayer) {
      setShowPlayer(true);
    }
  };

  if (type === 'video') {
    return (
      <div className={`relative ${className}`}>
        {!showPlayer ? (
          <div className="relative cursor-pointer" onClick={() => setShowPlayer(true)}>
            <img 
              src={thumbnail || '/placeholder.svg?height=300&width=400'} 
              alt={title || 'Video thumbnail'}
              className="w-full h-48 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <Button size="lg" variant="secondary" className="bg-white/90 hover:bg-white">
                <Play className="h-6 w-6 me-2" />
                Play Video
                {duration && <span className="ms-2 text-sm">({duration})</span>}
              </Button>
            </div>
            <div className="absolute top-2 end-2">
              <div className="bg-black/70 text-white px-2 py-1 rounded text-xs flex items-center">
                <Video className="h-3 w-3 me-1" />
                Video Testimonial
              </div>
            </div>
          </div>
        ) : (
          <video 
            controls 
            className="w-full h-48 rounded-lg"
            autoPlay={isPlaying}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            <source src={src} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
        {title && (
          <p className="mt-2 text-sm font-medium">{title}</p>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-muted/50 rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handlePlay}
            className="h-8 w-8 p-0"
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <div>
            <p className="text-sm font-medium">{title || 'Audio Clip'}</p>
            {duration && <p className="text-xs text-muted-foreground">{duration}</p>}
          </div>
        </div>
        <Volume2 className="h-4 w-4 text-muted-foreground" />
      </div>
      {isPlaying && (
        <audio 
          controls 
          className="w-full mt-3"
          autoPlay
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
        >
          <source src={src} type="audio/mpeg" />
          <source src={src} type="audio/wav" />
          Your browser does not support the audio tag.
        </audio>
      )}
    </div>
  );
};

export default MediaPlayer;
