
import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Music, User, ExternalLink, Calendar, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Client {
  id: string;
  client_name: string;
}

interface Album {
  id: string;
  title: string;
  description: string;
  artwork_url: string;
  created_at: string;
  track_count: number;
}

interface Bio {
  header_1: string;
  header_2: string;
  content_1: string;
  content_2: string;
}

interface Track {
  id: string;
  title: string;
  file_url: string;
  duration: number;
}

const PublicClientPage: React.FC = () => {
  const { artistId } = useParams<{ artistId: string }>();
  const { toast } = useToast();
  
  const [client, setClient] = useState<Client | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [bio, setBio] = useState<Bio | null>(null);
  const [selectedAlbum, setSelectedAlbum] = useState<Album | null>(null);
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (artistId) {
      fetchClientData();
    }
  }, [artistId]);

  const fetchClientData = async () => {
    try {
      setLoading(true);

      // Fetch client profile
      const { data: clientData, error: clientError } = await supabase
        .from('profiles')
        .select('id, client_name')
        .eq('id', artistId)
        .single();

      if (clientError) throw clientError;
      setClient(clientData);

      // Fetch client albums with track count
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select(`
          id,
          title,
          description,
          artwork_url,
          created_at,
          tracks(count)
        `)
        .eq('user_id', artistId)
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;

      const formattedAlbums = albumsData?.map(album => ({
        ...album,
        track_count: album.tracks?.[0]?.count || 0
      })) || [];

      setAlbums(formattedAlbums);

      // Fetch client bio
      const { data: bioData, error: bioError } = await supabase
        .from('user_bios')
        .select('header_1, header_2, content_1, content_2')
        .eq('user_id', artistId)
        .single();

      if (bioError && bioError.code !== 'PGRST116') throw bioError;
      setBio(bioData);

    } catch (error) {
      console.error('Error fetching client data:', error);
      toast({
        title: "Error",
        description: "Failed to load client information.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumTracks = async (albumId: string) => {
    try {
      const { data: tracks, error } = await supabase
        .from('tracks')
        .select('id, title, file_url, duration')
        .eq('album_id', albumId)
        .order('created_at');

      if (error) throw error;
      setAlbumTracks(tracks || []);
    } catch (error) {
      console.error('Error fetching album tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load album tracks.",
        variant: "destructive",
      });
    }
  };

  const handleAlbumSelect = (album: Album) => {
    setSelectedAlbum(album);
    fetchAlbumTracks(album.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading client profile...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Client Not Found</h1>
            <p className="text-muted-foreground mb-4">The client you're looking for doesn't exist.</p>
            <Link to="/">
              <Button>Return Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile-friendly header */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground-dark mb-2">
              {client.client_name}
            </h1>
            <p className="text-lg text-muted-foreground">Client Profile</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Albums Section */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Music className="h-5 w-5" />
                  Albums ({albums.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {albums.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No albums available yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {albums.map((album) => (
                      <Card 
                        key={album.id} 
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedAlbum?.id === album.id ? 'ring-2 ring-primary' : ''
                        }`}
                        onClick={() => handleAlbumSelect(album)}
                      >
                        <CardContent className="p-4">
                          {album.artwork_url && (
                            <img
                              src={album.artwork_url}
                              alt={album.title}
                              className="w-full h-32 sm:h-40 object-cover rounded-md mb-3"
                            />
                          )}
                          <h3 className="font-semibold text-lg mb-2 line-clamp-2">{album.title}</h3>
                          {album.description && (
                            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                              {album.description}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                            <Badge variant="secondary" className="text-xs">
                              {album.track_count} tracks
                            </Badge>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(album.created_at)}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected Album Tracks */}
            {selectedAlbum && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Play className="h-5 w-5" />
                    {selectedAlbum.title} - Tracks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {albumTracks.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">No tracks in this album.</p>
                  ) : (
                    <div className="space-y-2">
                      {albumTracks.map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-sm text-muted-foreground w-6 text-center">
                              {index + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{track.title}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {track.duration && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDuration(track.duration)}
                              </div>
                            )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(track.file_url, '_blank')}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Bio Section */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  About {client.client_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {bio ? (
                  <div className="space-y-4">
                    {bio.header_1 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-2">{bio.header_1}</h4>
                        {bio.content_1 && (
                          <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                            {bio.content_1}
                          </p>
                        )}
                      </div>
                    )}
                    
                    {bio.header_2 && (
                      <div>
                        <h4 className="font-semibold text-lg mb-2">{bio.header_2}</h4>
                        {bio.content_2 && (
                          <p className="text-muted-foreground whitespace-pre-wrap text-sm leading-relaxed">
                            {bio.content_2}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No bio information available.
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Client Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Client Stats</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Albums</span>
                    <span className="font-semibold">{albums.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total Tracks</span>
                    <span className="font-semibold">
                      {albums.reduce((total, album) => total + album.track_count, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Mobile-friendly footer */}
      <footer className="bg-muted/30 border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-sm text-muted-foreground">
            Powered by Client Verse Echo
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PublicClientPage;
