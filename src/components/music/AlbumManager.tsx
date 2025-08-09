import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Album, Music, Plus, ArrowLeft, Trash2 } from 'lucide-react';
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
  const [deleting, setDeleting] = useState<string | null>(null);

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

  const deleteAlbum = async (albumId: string) => {
    if (!confirm('Are you sure you want to delete this album? This will also delete all associated tracks and cannot be undone.')) {
      return;
    }

    setDeleting(albumId);
    try {
      const { error } = await supabase
        .from('albums')
        .delete()
        .eq('id', albumId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Album deleted successfully.",
      });

      // Refresh albums list
      fetchAlbums();
      
      // If we were viewing this album, go back to grid
      if (selectedAlbum === albumId) {
        setSelectedAlbum('');
        setAlbumTracks([]);
      }
    } catch (error) {
      console.error('Error deleting album:', error);
      toast({
        title: "Error",
        description: "Failed to delete album.",
        variant: "destructive",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleAlbumSelect = (albumId: string) => {
    setSelectedAlbum(albumId);
  };

  const handleBackToGrid = () => {
    setSelectedAlbum('');
    setAlbumTracks([]);
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

  if (!selectedAlbum) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Album className="h-5 w-5" />
            Select Album to Manage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {albums.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No albums created yet. Create your first album to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {albums.map((album) => (
                <Card 
                  key={album.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/50"
                  onClick={() => handleAlbumSelect(album.id)}
                >
                  <CardContent className="p-4">
                    <div className="aspect-square mb-4 rounded-lg overflow-hidden bg-muted flex items-center justify-center">
                      {album.artwork_url ? (
                        <img 
                          src={album.artwork_url} 
                          alt={album.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Album className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg truncate">{album.title}</h3>
                      {album.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {album.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Created {new Date(album.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  const currentAlbum = albums.find(album => album.id === selectedAlbum);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Album className="h-5 w-5" />
            Managing: {currentAlbum?.title}
          </CardTitle>
          <Button variant="outline" onClick={handleBackToGrid} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Albums
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
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

          <div className="pt-6 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete this album and all associated tracks. This action cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                onClick={() => deleteAlbum(selectedAlbum)}
                disabled={deleting === selectedAlbum}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                {deleting === selectedAlbum ? 'Deleting...' : 'Delete Album'}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AlbumManager;
