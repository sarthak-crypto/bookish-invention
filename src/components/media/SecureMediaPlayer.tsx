
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX, Maximize, Music, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMediaAnalytics } from '@/hooks/useMediaAnalytics';

interface MediaFile {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url?: string;
  type: 'audio' | 'video';
  albums?: {
    title: string;
  } | null;
}

interface SecureMediaPlayerProps {
  media: MediaFile;
  onMediaEnd?: () => void;
}

const SecureMediaPlayer: React.FC<SecureMediaPlayerProps> = ({ media, onMediaEnd }) => {
  const { toast } = useToast();
  const { trackMediaPlay } = useMediaAnalytics();
  const mediaRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

  useEffect(() => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    // Enhanced security measures
    mediaElement.crossOrigin = 'anonymous';
    mediaElement.preload = 'metadata';
    
    // Disable picture-in-picture for videos
    if (media.type === 'video') {
      const video = mediaElement as HTMLVideoElement;
      video.disablePictureInPicture = true;
      video.setAttribute('controlsList', 'nodownload nofullscreen noremoteplayback');
    }
    
    // Disable right-click context menu
    mediaElement.oncontextmenu = (e) => e.preventDefault();
    
    // Disable text selection on the container
    if (containerRef.current) {
      containerRef.current.style.userSelect = 'none';
      containerRef.current.style.webkitUserSelect = 'none';
    }
    
    const updateTime = () => setCurrentTime(mediaElement.currentTime);
    const updateDuration = () => setDuration(mediaElement.duration);
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onMediaEnd?.();
    };

    const handleError = () => {
      toast({
        title: "Playback Error",
        description: `Unable to play this ${media.type}. Please try again.`,
        variant: "destructive",
      });
      setIsPlaying(false);
    };

    // Track play after 3 seconds of playback
    const handleTimeUpdate = () => {
      updateTime();
      if (!hasTrackedPlay && mediaElement.currentTime > 3) {
        trackMediaPlay({
          media_id: media.id,
          media_type: media.type
        });
        setHasTrackedPlay(true);
      }
    };

    mediaElement.addEventListener('timeupdate', handleTimeUpdate);
    mediaElement.addEventListener('loadedmetadata', updateDuration);
    mediaElement.addEventListener('ended', handleEnded);
    mediaElement.addEventListener('error', handleError);

    return () => {
      mediaElement.removeEventListener('timeupdate', handleTimeUpdate);
      mediaElement.removeEventListener('loadedmetadata', updateDuration);
      mediaElement.removeEventListener('ended', handleEnded);
      mediaElement.removeEventListener('error', handleError);
    };
  }, [media.file_url, media.type, media.id, onMediaEnd, toast, trackMediaPlay, hasTrackedPlay]);

  // Enhanced security: Disable various keyboard shortcuts and developer tools access
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable save shortcuts
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
      // Disable developer tools
      if (e.key === 'F12') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'I') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.shiftKey && e.key === 'J') {
        e.preventDefault();
      }
      if (e.ctrlKey && e.key === 'u') {
        e.preventDefault();
      }
      // Disable print
      if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  // Hide controls on mouse inactivity for video
  useEffect(() => {
    if (media.type !== 'video') return;
    
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
  }, [isPlaying, media.type]);

  const togglePlay = async () => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;

    try {
      if (isPlaying) {
        mediaElement.pause();
        setIsPlaying(false);
        setShowControls(true);
      } else {
        await mediaElement.play();
        setIsPlaying(true);
      }
    } catch (error) {
      toast({
        title: "Playback Error",
        description: `Unable to play this ${media.type}.`,
        variant: "destructive",
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;
    
    const newTime = parseFloat(e.target.value);
    mediaElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;
    
    const newVolume = parseFloat(e.target.value);
    mediaElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const mediaElement = mediaRef.current;
    if (!mediaElement) return;
    
    if (isMuted) {
      mediaElement.volume = volume;
      setIsMuted(false);
    } else {
      mediaElement.volume = 0;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (media.type !== 'video') return;
    
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
          className={`relative bg-black group select-none ${
            media.type === 'video' ? 'aspect-video' : 'aspect-square max-w-md mx-auto'
          }`}
          onDoubleClick={media.type === 'video' ? toggleFullscreen : undefined}
          style={{
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          {media.type === 'video' ? (
            <video
              ref={mediaRef as React.RefObject<HTMLVideoElement>}
              src={media.file_url}
              poster={media.thumbnail_url}
              className="w-full h-full object-contain"
              onClick={togglePlay}
              style={{ pointerEvents: 'auto' }}
            />
          ) : (
            <audio
              ref={mediaRef as React.RefObject<HTMLAudioElement>}
              src={media.file_url}
              style={{ display: 'none' }}
            />
          )}

          {/* Security overlay to prevent interaction */}
          <div 
            className="absolute inset-0 z-10 pointer-events-none"
            onContextMenu={(e) => e.preventDefault()}
            onDragStart={(e) => e.preventDefault()}
            style={{
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          />

          <div
            className={`absolute inset-0 z-20 transition-opacity duration-300 ${
              (showControls || !isPlaying || media.type === 'audio') ? 'opacity-100' : 'opacity-0'
            }`}
          >
            {/* Title bar */}
            <div className={`absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-4 ${
              media.type === 'audio' ? 'relative bg-gradient-to-b from-gray-800 to-gray-700' : ''
            }`}>
              <div className="flex items-center gap-2">
                {media.type === 'audio' ? (
                  <Music className="h-5 w-5 text-white" />
                ) : (
                  <Video className="h-5 w-5 text-white" />
                )}
                <h3 className="text-white font-semibold">{media.title}</h3>
              </div>
              {media.albums && (
                <p className="text-white/80 text-sm">{media.albums.title}</p>
              )}
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
            <div className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 space-y-2 ${
              media.type === 'audio' ? 'relative bg-gradient-to-t from-gray-700 to-gray-800' : ''
            }`}>
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

                {media.type === 'video' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFullscreen}
                    className="text-white hover:bg-white/20"
                  >
                    <Maximize className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureMediaPlayer;
