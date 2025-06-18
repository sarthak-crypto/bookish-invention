import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Video {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url?: string;
}

interface SecureVideoPlayerProps {
  video: Video;
  onVideoEnd?: () => void;
}

const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({ video, onVideoEnd }) => {
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Security measures
    video.crossOrigin = 'anonymous';
    video.preload = 'metadata';
    video.disablePictureInPicture = true;
    
    // Set security attributes
    video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
    
    // Disable right-click context menu
    video.oncontextmenu = (e) => e.preventDefault();
    
    const updateTime = () => setCurrentTime(video.currentTime);
    const updateDuration = () => setDuration(video.duration);
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onVideoEnd?.();
    };

    const handleError = () => {
      toast({
        title: "Playback Error",
        description: "Unable to play this video. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(false);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [video.file_url, onVideoEnd, toast]);

  // Hide controls on mouse inactivity
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMouseMove = () => {
      setShowControls(true);
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (isPlaying) setShowControls(false);
      }, 3000);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('mousemove', handleMouseMove);
      container.addEventListener('mouseleave', () => {
        if (isPlaying) setShowControls(false);
      });
    }

    return () => {
      if (container) {
        container.removeEventListener('mousemove', handleMouseMove);
      }
      clearTimeout(timeoutId);
    };
  }, [isPlaying]);

  // Security: Disable keyboard shortcuts that could be used to download
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
      // Disable F12 (Developer Tools)
      if (e.key === 'F12') {
        e.preventDefault();
      }
      // Disable Ctrl+Shift+I (Developer Tools)
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (isPlaying) {
        video.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        await video.play();
        setIsPlaying(true);
      }
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Unable to play this video.",
        variant: "destructive",
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newTime = parseFloat(e.target.value);
    video.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    
    const newVolume = parseFloat(e.target.value);
    video.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    
    if (isMuted) {
      video.volume = volume;
      setIsMuted(false);
    } else {
      video.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!isFullscreen) {
      if (container.requestFullscreen) {
        container.requestFullscreen();
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
    setIsFullscreen(!isFullscreen);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative bg-black aspect-video group"
          onDoubleClick={toggleFullscreen}
        >
          <video
            ref={videoRef}
            src={video.file_url}
            poster={video.thumbnail_url}
            className="w-full h-full object-contain"
            onClick={togglePlay}
          />

          {/* Custom overlay to prevent right-click */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
          />

          {/* Controls overlay */}
          <div
            className={`absolute inset-0 z-20 transition-opacity duration-300 ${
              showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Top bar with title */}
            <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4">
              <h3 className="text-white font-semibold">{video.title}</h3>
            </div>

            {/* Play button overlay */}
            {!isPlaying && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={togglePlay}
                  className="h-16 w-16 rounded-full bg-black/50 hover:bg-black/70 text-white"
                >
                  <Play className="h-8 w-8" />
                </Button>
              </div>
            )}

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 space-y-2">
              {/* Progress bar */}
              <div className="flex items-center space-x-2">
                <span className="text-white text-sm min-w-12">
                  {formatTime(currentTime)}
                </span>
                <input
                  type="range"
                  min="0"
                  max={duration || 0}
                  value={currentTime}
                  onChange={handleSeek}
                  className="flex-1 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-white text-sm min-w-12">
                  {formatTime(duration)}
                </span>
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={togglePlay}
                    className="text-white hover:bg-white/20"
                  >
                    {isPlaying ? (
                      <Pause className="h-5 w-5" />
                    ) : (
                      <Play className="h-5 w-5" />
                    )}
                  </Button>

                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={toggleMute}
                      className="text-white hover:bg-white/20"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={handleVolumeChange}
                      className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureVideoPlayer;
