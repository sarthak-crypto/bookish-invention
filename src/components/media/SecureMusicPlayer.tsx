
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  file_url: string;
  album_id?: string | null;
  albums?: {
    title: string;
  } | null;
}

interface SecureMusicPlayerProps {
  track: Track;
  onTrackEnd?: () => void;
}

const SecureMusicPlayer: React.FC<SecureMusicPlayerProps> = ({ track, onTrackEnd }) => {
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    // Security measures
    audio.crossOrigin = 'anonymous';
    audio.preload = 'metadata';
    
    // Disable right-click context menu
    audio.oncontextmenu = (e) => e.preventDefault();
    
    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onTrackEnd?.();
    };

    const handleError = () => {
      toast({
        title: "Playback Error",
        description: "Unable to play this track. Please try again.",
        variant: "destructive",
      });
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [track.file_url, onTrackEnd, toast]);

  // Security: Disable keyboard shortcuts that could be used to download
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && (e.key === 's' || e.key === 'S')) {
        e.preventDefault();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      toast({
        title: "Playback Error",
        description: "Unable to play this track.",
        variant: "destructive",
      });
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newTime = parseFloat(e.target.value);
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const newVolume = parseFloat(e.target.value);
    audio.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    
    if (isMuted) {
      audio.volume = volume;
      setIsMuted(false);
    } else {
      audio.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <h3 className="font-semibold text-lg">{track.title}</h3>
            {track.albums && (
              <p className="text-sm text-muted-foreground">{track.albums.title}</p>
            )}
          </div>

          <audio
            ref={audioRef}
            src={track.file_url}
            style={{ display: 'none' }}
            controlsList="nodownload nofullscreen noremoteplayback"
          />

          <div className="flex items-center justify-center space-x-4">
            <Button
              variant="ghost"
              size="lg"
              onClick={togglePlay}
              className="h-12 w-12 rounded-full"
            >
              {isPlaying ? (
                <Pause className="h-6 w-6" />
              ) : (
                <Play className="h-6 w-6" />
              )}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground min-w-12">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <span className="text-sm text-muted-foreground min-w-12">
                {formatTime(duration)}
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleMute}
                className="p-1"
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
                className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SecureMusicPlayer;
