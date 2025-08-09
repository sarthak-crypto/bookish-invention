import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, SkipBack, SkipForward, Volume2, ExternalLink, ShoppingCart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
  file_url: string;
  duration: number | null;
  album_id: string;
}

interface Album {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  user_id: string;
}

interface Profile {
  client_name: string | null;
}

interface SocialLink {
  id: string;
  platform: string;
  url: string;
  display_text: string;
  display_order: number;
}

const EndUserPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [audio] = useState(new Audio());

  useEffect(() => {
    if (cardId) {
      fetchAlbumData();
    }
  }, [cardId]);

  useEffect(() => {
    const handleTimeUpdate = () => setCurrentTime(audio.currentTime);
    const handleDurationChange = () => setDuration(audio.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      playNext();
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audio]);

  const fetchAlbumData = async () => {
    try {
      // First, find the RFID card
      const { data: rfidCard, error: rfidError } = await supabase
        .from('rfid_cards')
        .select('album_id')
        .eq('card_id', cardId)
        .eq('is_active', true)
        .single();

      if (rfidError || !rfidCard) {
        toast({
          title: "Error",
          description: "Invalid or inactive card",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Fetch album details
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', rfidCard.album_id)
        .single();

      if (albumError || !albumData) {
        toast({
          title: "Error",
          description: "Album not found",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setAlbum(albumData);

      // Fetch profile separately
      try {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('client_name')
          .eq('id', albumData.user_id)
          .single();

        if (profileError) {
          console.error('Profile fetch error:', profileError);
          setProfile({ client_name: 'Unknown Client' });
        } else {
          setProfile(profileData);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setProfile({ client_name: 'Unknown Client' });
      }

      // Fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', rfidCard.album_id)
        .order('created_at');

      if (tracksError) {
        console.error('Tracks fetch error:', tracksError);
      } else {
        setTracks(tracksData || []);
        if (tracksData && tracksData.length > 0) {
          setCurrentTrack(tracksData[0]);
        }
      }

      // Fetch social links
      const { data: socialData, error: socialError } = await supabase
        .from('social_media_links')
        .select('*')
        .eq('user_id', albumData.user_id)
        .eq('is_active', true)
        .order('display_order');

      if (socialError) {
        console.error('Social links fetch error:', socialError);
      } else {
        setSocialLinks(socialData || []);
      }

      // Create end user session
      await supabase.from('end_user_sessions').insert({
        card_id: cardId!,
        album_id: rfidCard.album_id,
        ip_address: null, // Will be handled by backend if needed
        user_agent: navigator.userAgent,
        location: null
      });

      // Track NFC tap analytics
      await supabase.from('analytics_events').insert({
        event_type: 'nfc_tap',
        metadata: { 
          card_id: cardId, 
          album_id: rfidCard.album_id 
        },
        user_id: null
      });

    } catch (error) {
      console.error('Error fetching album data:', error);
      toast({
        title: "Error",
        description: "Failed to load album data",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const playTrack = (track: Track) => {
    if (currentTrack?.id === track.id && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      if (currentTrack?.id !== track.id) {
        setCurrentTrack(track);
        audio.src = track.file_url;
      }
      audio.play();
      setIsPlaying(true);

      // Track play event
      supabase.from('analytics_events').insert({
        event_type: 'track_play',
        metadata: { 
          track_id: track.id, 
          album_id: track.album_id,
          card_id: cardId 
        },
        user_id: null
      });
    }
  };

  const playNext = () => {
    if (currentTrack && tracks.length > 0) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % tracks.length;
      playTrack(tracks[nextIndex]);
    }
  };

  const playPrevious = () => {
    if (currentTrack && tracks.length > 0) {
      const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
      const prevIndex = currentIndex === 0 ? tracks.length - 1 : currentIndex - 1;
      playTrack(tracks[prevIndex]);
    }
  };

  const togglePlayPause = () => {
    if (currentTrack) {
      playTrack(currentTrack);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const progressBar = e.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickPosition = (e.clientX - rect.left) / rect.width;
    const newTime = clickPosition * duration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">Loading your music experience...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Album not found</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Album Header */}
        <div className="text-center mb-8">
          <div className="w-64 h-64 mx-auto mb-6 rounded-2xl overflow-hidden shadow-2xl">
            <img
              src={album.artwork_url || '/placeholder.svg'}
              alt={album.title}
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            {album.title}
          </h1>
          <p className="text-xl text-purple-200 mb-4">
            by {profile?.client_name || 'Unknown Client'}
          </p>
          {album.description && (
            <p className="text-gray-300 max-w-2xl mx-auto">
              {album.description}
            </p>
          )}
        </div>

        {/* Music Player */}
        {currentTrack && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                    <Volume2 className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">{currentTrack.title}</h3>
                    <p className="text-gray-300 text-sm">{profile?.client_name}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={playPrevious}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={togglePlayPause}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={playNext}
                    className="text-white hover:bg-white/20"
                  >
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div
                  className="w-full h-2 bg-gray-600 rounded-full cursor-pointer"
                  onClick={handleSeek}
                >
                  <div
                    className="h-2 bg-purple-500 rounded-full transition-all duration-100"
                    style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                  />
                </div>
                <div className="flex justify-between text-sm text-gray-300">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Track List */}
        <Card className="bg-white/10 backdrop-blur-lg border-white/20 mb-8">
          <CardContent className="p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Tracks</h2>
            <div className="space-y-2">
              {tracks.map((track, index) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                    currentTrack?.id === track.id
                      ? 'bg-purple-600/30'
                      : 'hover:bg-white/10'
                  }`}
                  onClick={() => playTrack(track)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-gray-400 w-6 text-center">
                      {index + 1}
                    </span>
                    <div>
                      <p className="text-white font-medium">{track.title}</p>
                      <p className="text-gray-300 text-sm">{profile?.client_name}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {track.duration && (
                      <span className="text-gray-400 text-sm">
                        {formatTime(track.duration)}
                      </span>
                    )}
                    {currentTrack?.id === track.id && isPlaying ? (
                      <Pause className="h-5 w-5 text-purple-400" />
                    ) : (
                      <Play className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Social Links */}
        {socialLinks.length > 0 && (
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold text-white mb-4">Connect</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {socialLinks.map((link) => (
                  <Button
                    key={link.id}
                    variant="outline"
                    asChild
                    className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                  >
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      <span>{link.display_text}</span>
                    </a>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EndUserPage;
