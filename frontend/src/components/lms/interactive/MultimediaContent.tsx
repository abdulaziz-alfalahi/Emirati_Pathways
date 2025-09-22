
import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw, FileText, Image } from 'lucide-react';

interface MultimediaItem {
  id: string;
  type: 'video' | 'audio' | 'image' | 'pdf' | 'interactive-diagram';
  title: string;
  description?: string;
  url: string;
  duration?: number; // for video/audio in seconds
  transcription?: string;
  annotations?: Array<{
    time: number;
    text: string;
    type: 'note' | 'quiz' | 'resource';
  }>;
}

interface MultimediaContentProps {
  items: MultimediaItem[];
  onProgress?: (itemId: string, progress: number) => void;
  onComplete?: (itemId: string) => void;
}

export const MultimediaContent: React.FC<MultimediaContentProps> = ({
  items,
  onProgress,
  onComplete
}) => {
  const [activeItem, setActiveItem] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [showTranscription, setShowTranscription] = useState(false);
  const [currentAnnotations, setCurrentAnnotations] = useState<any[]>([]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const currentItem = items[activeItem];

  const handlePlayPause = () => {
    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      if (isPlaying) {
        media.pause();
      } else {
        media.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current;
    if (media && media.duration) {
      const currentProgress = (media.currentTime / media.duration) * 100;
      setProgress(currentProgress);
      onProgress?.(currentItem.id, currentProgress);

      // Check for annotations
      if (currentItem.annotations) {
        const activeAnnotations = currentItem.annotations.filter(
          annotation => Math.abs(annotation.time - media.currentTime) < 1
        );
        setCurrentAnnotations(activeAnnotations);
      }

      // Mark as complete when 90% watched
      if (currentProgress >= 90) {
        onComplete?.(currentItem.id);
      }
    }
  };

  const handleLoadedMetadata = () => {
    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      // Don't try to set duration as it's read-only
      // The browser will set it automatically when metadata loads
      console.log('Media duration loaded:', media.duration);
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setVolume(newVolume);
    const media = currentItem.type === 'video' ? videoRef.current : audioRef.current;
    if (media) {
      media.volume = newVolume;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderMediaPlayer = () => {
    switch (currentItem.type) {
      case 'video':
        return (
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              src={currentItem.url}
              className="w-full h-auto"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            {/* Video Controls Overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePlayPause}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                
                <div className="flex-1">
                  <Progress value={progress} className="h-2" />
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)}
                    className="text-white hover:bg-white/20"
                  >
                    {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {videoRef.current?.duration && (
                <div className="text-white text-sm mt-2">
                  {formatTime((progress / 100) * videoRef.current.duration)} / {formatTime(videoRef.current.duration)}
                </div>
              )}
            </div>
            
            {/* Annotations Overlay */}
            {currentAnnotations.length > 0 && (
              <div className="absolute top-4 right-4 space-y-2">
                {currentAnnotations.map((annotation, index) => (
                  <div key={index} className="bg-blue-600 text-white p-2 rounded-lg text-sm max-w-xs">
                    {annotation.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case 'audio':
        return (
          <div className="bg-gray-100 rounded-lg p-6">
            <audio
              ref={audioRef}
              src={currentItem.url}
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
            />
            
            <div className="flex items-center gap-4 mb-4">
              <Button onClick={handlePlayPause}>
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
              </Button>
              
              <div className="flex-1">
                <Progress value={progress} className="h-3" />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleVolumeChange(volume === 0 ? 1 : 0)}
              >
                {volume === 0 ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
            </div>
            
            {audioRef.current?.duration && (
              <div className="text-sm text-muted-foreground text-center">
                {formatTime((progress / 100) * audioRef.current.duration)} / {formatTime(audioRef.current.duration)}
              </div>
            )}
          </div>
        );

      case 'image':
        return (
          <div className="bg-gray-100 rounded-lg p-4">
            <img
              src={currentItem.url}
              alt={currentItem.title}
              className="w-full h-auto max-h-96 object-contain mx-auto rounded"
            />
          </div>
        );

      case 'pdf':
        return (
          <div className="bg-gray-100 rounded-lg p-4 text-center">
            <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
            <p className="text-muted-foreground mb-4">PDF Document</p>
            <Button onClick={() => window.open(currentItem.url, '_blank')}>
              Open PDF
            </Button>
          </div>
        );

      default:
        return (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Unsupported media type</p>
          </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{currentItem.title}</CardTitle>
        {currentItem.description && (
          <CardDescription>{currentItem.description}</CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Media Player */}
        {renderMediaPlayer()}
        
        {/* Tabs for additional content */}
        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content</TabsTrigger>
            {currentItem.transcription && (
              <TabsTrigger value="transcription">Transcription</TabsTrigger>
            )}
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>
          
          <TabsContent value="content" className="space-y-4">
            {/* Media navigation */}
            {items.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {items.map((item, index) => (
                  <Button
                    key={item.id}
                    variant={index === activeItem ? "default" : "outline"}
                    size="sm"
                    onClick={() => setActiveItem(index)}
                    className="flex-shrink-0"
                  >
                    {item.type === 'video' && <Play className="h-3 w-3 mr-1" />}
                    {item.type === 'audio' && <Volume2 className="h-3 w-3 mr-1" />}
                    {item.type === 'image' && <Image className="h-3 w-3 mr-1" />}
                    {item.type === 'pdf' && <FileText className="h-3 w-3 mr-1" />}
                    {item.title}
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>
          
          {currentItem.transcription && (
            <TabsContent value="transcription">
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Transcription</h4>
                <p className="text-sm leading-relaxed">{currentItem.transcription}</p>
              </div>
            </TabsContent>
          )}
          
          <TabsContent value="notes">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Your Notes</h4>
              <p className="text-sm text-muted-foreground">
                Note-taking feature coming soon...
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
