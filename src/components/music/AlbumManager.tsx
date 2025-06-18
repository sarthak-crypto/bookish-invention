
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Album, Music, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Album {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  file_url: string;
  created_at: string;
}

const AlbumManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbum, setSelectedAlbum] = useState<string>('');
  const [albumTracks, setAlbumTracks] = useState<Track[]>([]);
  const [availableTracks, setAvailableTracks] = useState<Track[]>([]);
  const [selectedTrack, setSelectedTrack] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (user) {
      fetchAlbums();
      fetchAvailableTracks();
    }
  }, [user]);

  useEffect(() => {
    if (selectedAlbum) {
      fetchAlbumTracks();
    }
  }, [selectedAlbum]);

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAlbumTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', selectedAlbum)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAlbumTracks(data || []);
    } catch (error) {
      console.error('Error fetching album tracks:', error);
    }
  };

  const fetchAvailableTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('*')
        .eq('user_id', user?.id)
        .is('album_id', null)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAvailableTracks(data || []);
    } catch (error) {
      console.error('Error fetching available tracks:', error);
    }
  };

  const addTrackToAlbum = async () => {
    if (!selectedTrack || !selectedAlbum) return;

    setAdding(true);
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ album_id: selectedAlbum })
        .eq('id', selectedTrack);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Track added to album successfully.",
      });

      // Refresh data
      fetchAlbumTracks();
      fetchAvailableTracks();
      setSelectedTrack('');
    } catch (error) {
      console.error('Error adding track to album:', error);
      toast({
        title: "Error",
        description: "Failed to add track to album.",
        variant: "destructive",
      });
    } finally {
      setAdding(false);
    }
  };

  const removeTrackFromAlbum = async (trackId: string) => {
    try {
      const { error } = await supabase
        .from('tracks')
        .update({ album_id: null })
        .eq('id', trackId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Track removed from album.",
      });

      fetchAlbumTracks();
      fetchAvailableTracks();
    } catch (error) {
      console.error('Error removing track from album:', error);
      toast({
        title: "Error",
        description: "Failed to remove track from album.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading albums...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Album className="h-5 w-5" />
          Manage Albums
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {albums.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No albums created yet. Create your first album to get started!
          </p>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Album</label>
              <Select value={selectedAlbum} onValueChange={setSelectedAlbum}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose an album to manage" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedAlbum && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-3">Album Tracks ({albumTracks.length})</h3>
                  {albumTracks.length === 0 ? (
                    <p className="text-muted-foreground">No tracks in this album yet.</p>
                  ) : (
                    <div className="space-y-2">
                      {albumTracks.map((track, index) => (
                        <div
                          key={track.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground">{index + 1}.</span>
                            <Music className="h-4 w-4" />
                            <span className="font-medium">{track.title}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => removeTrackFromAlbum(track.id)}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {availableTracks.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Add Track to Album</h3>
                    <div className="flex gap-2">
                      <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                        <SelectTrigger className="flex-1">
                          <SelectValue placeholder="Select a track to add" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableTracks.map((track) => (
                            <SelectItem key={track.id} value={track.id}>
                              {track.title}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={addTrackToAlbum}
                        disabled={!selectedTrack || adding}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {adding ? 'Adding...' : 'Add'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default AlbumManager;
