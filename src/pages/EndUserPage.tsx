
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, Music, User, Calendar, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import EndUserMediaPlayer from '@/components/enduser/EndUserMediaPlayer';

interface AlbumData {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  user_id: string;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  file_url: string;
  duration: number | null;
}

interface Video {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  duration: number | null;
}

interface Profile {
  artist_name: string | null;
}

const EndUserPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [cardId, setCardId] = useState(searchParams.get('card') || '');
  const [isLoading, setIsLoading] = useState(false);
  const [albumData, setAlbumData] = useState<AlbumData | null>(null);
  const [artistData, setArtistData] = useState<Profile | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isCardAccessGranted, setIsCardAccessGranted] = useState(false);
  const [hasCustomLandingPage, setHasCustomLandingPage] = useState(false);

  // Auto-load if card ID is in URL
  useEffect(() => {
    if (searchParams.get('card')) {
      handleCardAccess();
    }
  }, [searchParams]);

  const trackSession = async (cardId: string, albumId: string) => {
    try {
      // Get user's IP and user agent for analytics
      const userAgent = navigator.userAgent;
      
      await supabase
        .from('end_user_sessions')
        .insert({
          card_id: cardId,
          album_id: albumId,
          user_agent: userAgent,
          ip_address: null, // Will be handled by server
          location: null // Could be enhanced with geolocation
        });
      
      // Update last accessed time for the RFID card
      await supabase
        .from('rfid_cards')
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('card_id', cardId);
        
    } catch (error) {
      console.error('Error tracking session:', error);
    }
  };

  const checkCustomLandingPage = async (albumId: string) => {
    try {
      const { data, error } = await supabase
        .from('album_landing_pages')
        .select('id')
        .eq('album_id', albumId)
        .eq('is_published', true)
        .maybeSingle();

      if (data && !error) {
        setHasCustomLandingPage(true);
        // Redirect to custom landing page
        window.location.href = `/album-preview/${albumId}`;
      }
    } catch (error) {
      // No custom landing page found, continue with default
      console.log('No custom landing page found, using default');
    }
  };

  const handleCardAccess = async () => {
    if (!cardId.trim()) {
      toast({
        title: "Card ID Required",
        description: "Please enter your RFID card ID to access the album.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Look up the RFID card and get associated album
      const { data: rfidCard, error: rfidError } = await supabase
        .from('rfid_cards')
        .select('id, card_id, album_id, is_active')
        .eq('card_id', cardId.trim())
        .eq('is_active', true)
        .single();

      if (rfidError || !rfidCard) {
        toast({
          title: "Invalid Card",
          description: "The RFID card ID you entered is not valid or has been deactivated.",
          variant: "destructive",
        });
        return;
      }

      // Check if there's a custom landing page for this album
      await checkCustomLandingPage(rfidCard.album_id);

      // Get the album data
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .select('id, title, description, artwork_url, user_id, created_at')
        .eq('id', rfidCard.album_id)
        .single();

      if (albumError || !album) {
        toast({
          title: "Album Not Found",
          description: "The album associated with this card could not be found.",
          variant: "destructive",
        });
        return;
      }

      setAlbumData(album);

      // Get artist profile information
      const { data: profile } = await supabase
        .from('profiles')
        .select('artist_name')
        .eq('id', album.user_id)
        .single();
      
      setArtistData(profile);

      // Fetch tracks for the album
      const { data: albumTracks, error: tracksError } = await supabase
        .from('tracks')
        .select('id, title, file_url, duration')
        .eq('album_id', album.id)
        .order('title');

      if (tracksError) {
        console.error('Error fetching tracks:', tracksError);
      } else {
        setTracks(albumTracks || []);
      }

      // Fetch videos from the same artist
      const { data: artistVideos, error: videosError } = await supabase
        .from('videos')
        .select('id, title, file_url, thumbnail_url, duration')
        .eq('user_id', album.user_id)
        .order('title');

      if (videosError) {
        console.error('Error fetching videos:', videosError);
      } else {
        setVideos(artistVideos || []);
      }

      // Track this access session
      await trackSession(cardId.trim(), album.id);

      setIsCardAccessGranted(true);
      toast({
        title: "Access Granted!",
        description: `Welcome to ${album.title}`,
      });

    } catch (error) {
      console.error('Error accessing album:', error);
      toast({
        title: "Error",
        description: "Failed to access album. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrackEnd = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  if (!isCardAccessGranted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <CreditCard className="h-8 w-8 text-blue-600" />
            </div>
            <CardTitle className="text-2xl">Album Access</CardTitle>
            <p className="text-muted-foreground">
              Tap your RFID card or enter your card ID to access your exclusive album
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="cardId">RFID Card ID</Label>
              <Input
                id="cardId"
                placeholder="Enter your card ID"
                value={cardId}
                onChange={(e) => setCardId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCardAccess()}
              />
            </div>
            <Button 
              onClick={handleCardAccess} 
              disabled={isLoading || !cardId.trim()}
              className="w-full"
            >
              {isLoading ? 'Accessing...' : 'Access Album'}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!albumData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Album Not Found</h2>
          <p className="text-muted-foreground">Unable to load album data.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Album Header */}
        <div className="mb-8">
          <Card className="overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/3">
                {albumData.artwork_url ? (
                  <img 
                    src={albumData.artwork_url} 
                    alt={albumData.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-64 md:h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                    <Music className="h-16 w-16 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="md:w-2/3 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl font-bold mb-2">{albumData.title}</h1>
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <User className="h-4 w-4" />
                      <span>{artistData?.artist_name || 'Unknown Artist'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>{new Date(albumData.created_at).getFullYear()}</span>
                    </div>
                  </div>
                </div>
                {albumData.description && (
                  <p className="text-muted-foreground mb-4">{albumData.description}</p>
                )}
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{tracks.length} tracks</span>
                  {videos.length > 0 && <span>{videos.length} videos</span>}
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Media Player */}
        <div className="mb-8">
          <EndUserMediaPlayer 
            tracks={tracks}
            videos={videos}
            currentTrackIndex={currentTrackIndex}
            onTrackChange={setCurrentTrackIndex}
            onTrackEnd={handleTrackEnd}
            albumTitle={albumData.title}
            artistName={artistData?.artist_name || 'Unknown Artist'}
          />
        </div>

        {/* Footer */}
        <div className="text-center text-muted-foreground">
          <p className="text-sm">
            Powered by secure RFID technology • Exclusive album access
          </p>
        </div>
      </div>
    </div>
  );
};

export default EndUserPage;
