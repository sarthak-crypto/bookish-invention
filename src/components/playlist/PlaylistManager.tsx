import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Music, Video, Plus, Trash2, Play, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecureMediaPlayer from '@/components/media/SecureMediaPlayer';

interface PlaylistItem {
  id: string;
  title: string;
  type: 'audio' | 'video';
  file_url: string;
  playlist_order: number;
}

interface Playlist {
  id: string;
  name: string;
  type: 'audio' | 'video';
  created_at: string;
  items: PlaylistItem[];
}

interface Track {
  id: string;
  title: string;
  file_url: string;
}

interface VideoFile {
  id: string;
  title: string;
  file_url: string;
}

const PlaylistManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [currentMedia, setCurrentMedia] = useState<PlaylistItem | null>(null);
  
  // Create playlist dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [newPlaylistType, setNewPlaylistType] = useState<'audio' | 'video'>('audio');
  
  // Add to playlist dialog
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  useEffect(() => {
    if (user) {
      fetchPlaylists();
      fetchTracks();
      fetchVideos();
    }
  }, [user]);

  const fetchPlaylists = async () => {
    try {
      const { data: playlistData, error: playlistError } = await supabase
        .from('playlists')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (playlistError) throw playlistError;

      // Fetch playlist items separately
      const formattedPlaylists: Playlist[] = [];
      
      for (const playlist of playlistData || []) {
        const { data: itemsData, error: itemsError } = await supabase
          .from('playlist_items')
          .select('id, media_id, playlist_order')
          .eq('playlist_id', playlist.id)
          .order('playlist_order');

        if (itemsError) throw itemsError;

        const items: PlaylistItem[] = [];
        
        for (const item of itemsData || []) {
          let mediaData = null;
          
          if (playlist.type === 'audio') {
            const { data: trackData } = await supabase
              .from('tracks')
              .select('id, title, file_url')
              .eq('id', item.media_id)
              .single();
            mediaData = trackData;
          } else {
            const { data: videoData } = await supabase
              .from('videos')
              .select('id, title, file_url')
              .eq('id', item.media_id)
              .single();
            mediaData = videoData;
          }

          if (mediaData) {
            items.push({
              id: item.id,
              title: mediaData.title,
              type: playlist.type as 'audio' | 'video',
              file_url: mediaData.file_url,
              playlist_order: item.playlist_order
            });
          }
        }

        formattedPlaylists.push({
          id: playlist.id,
          name: playlist.name,
          type: playlist.type as 'audio' | 'video',
          created_at: playlist.created_at,
          items: items.sort((a, b) => a.playlist_order - b.playlist_order)
        });
      }

      setPlaylists(formattedPlaylists);
    } catch (error) {
      console.error('Error fetching playlists:', error);
      toast({
        title: "Error",
        description: "Failed to load playlists.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title, file_url')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('id, title, file_url')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim() || !user) return;

    try {
      const { data, error } = await supabase
        .from('playlists')
        .insert({
          user_id: user.id,
          name: newPlaylistName.trim(),
          type: newPlaylistType
        })
        .select()
        .single();

      if (error) throw error;

      const newPlaylist: Playlist = {
        id: data.id,
        name: data.name,
        type: data.type as 'audio' | 'video',
        created_at: data.created_at,
        items: []
      };

      setPlaylists([newPlaylist, ...playlists]);
      setNewPlaylistName('');
      setCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "Playlist created successfully!",
      });
    } catch (error) {
      console.error('Error creating playlist:', error);
      toast({
        title: "Error",
        description: "Failed to create playlist.",
        variant: "destructive",
      });
    }
  };

  const handleAddToPlaylist = async () => {
    if (!selectedPlaylist || selectedItems.length === 0) return;

    try {
      const maxOrder = Math.max(...selectedPlaylist.items.map(item => item.playlist_order), 0);
      
      const itemsToAdd = selectedItems.map((mediaId, index) => ({
        playlist_id: selectedPlaylist.id,
        media_id: mediaId,
        playlist_order: maxOrder + index + 1
      }));

      const { error } = await supabase
        .from('playlist_items')
        .insert(itemsToAdd);

      if (error) throw error;

      setSelectedItems([]);
      setAddDialogOpen(false);
      fetchPlaylists();

      toast({
        title: "Success",
        description: "Items added to playlist successfully!",
      });
    } catch (error) {
      console.error('Error adding to playlist:', error);
      toast({
        title: "Error",
        description: "Failed to add items to playlist.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveFromPlaylist = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from('playlist_items')
        .delete()
        .eq('id', itemId);

      if (error) throw error;

      fetchPlaylists();
      
      toast({
        title: "Success",
        description: "Item removed from playlist.",
      });
    } catch (error) {
      console.error('Error removing from playlist:', error);
      toast({
        title: "Error",
        description: "Failed to remove item from playlist.",
        variant: "destructive",
      });
    }
  };

  const handleDeletePlaylist = async (playlistId: string) => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;

    try {
      const { error } = await supabase
        .from('playlists')
        .delete()
        .eq('id', playlistId);

      if (error) throw error;

      setPlaylists(playlists.filter(p => p.id !== playlistId));
      if (selectedPlaylist?.id === playlistId) {
        setSelectedPlaylist(null);
      }

      toast({
        title: "Success",
        description: "Playlist deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast({
        title: "Error",
        description: "Failed to delete playlist.",
        variant: "destructive",
      });
    }
  };

  const handlePlayItem = (item: PlaylistItem) => {
    setCurrentMedia(item);
  };

  const handleMediaEnd = () => {
    if (currentMedia && selectedPlaylist) {
      const currentIndex = selectedPlaylist.items.findIndex(item => item.id === currentMedia.id);
      const nextIndex = currentIndex + 1;
      if (nextIndex < selectedPlaylist.items.length) {
        setCurrentMedia(selectedPlaylist.items[nextIndex]);
      } else {
        setCurrentMedia(null);
      }
    }
  };

  const availableMedia = selectedPlaylist?.type === 'audio' ? tracks : videos;

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading playlists...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Music className="h-5 w-5" />
              Playlist Manager
            </CardTitle>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Playlist
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Playlists List */}
            <div>
              <h3 className="font-semibold mb-4">Your Playlists ({playlists.length})</h3>
              {playlists.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No playlists created yet. Create your first playlist!
                </p>
              ) : (
                <div className="space-y-2">
                  {playlists.map((playlist) => (
                    <div
                      key={playlist.id}
                      className={`p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors ${
                        selectedPlaylist?.id === playlist.id ? 'bg-primary/10 border-primary' : ''
                      }`}
                      onClick={() => setSelectedPlaylist(playlist)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {playlist.type === 'audio' ? (
                            <Music className="h-4 w-4" />
                          ) : (
                            <Video className="h-4 w-4" />
                          )}
                          <div>
                            <p className="font-medium">{playlist.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {playlist.items.length} items • {playlist.type}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePlaylist(playlist.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Playlist Content */}
            <div>
              {selectedPlaylist ? (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">{selectedPlaylist.name}</h3>
                    <Button
                      size="sm"
                      onClick={() => setAddDialogOpen(true)}
                      disabled={availableMedia.length === 0}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add Items
                    </Button>
                  </div>
                  
                  {selectedPlaylist.items.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      This playlist is empty. Add some items to get started!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedPlaylist.items.map((item, index) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-2 border rounded hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground w-6">
                              {index + 1}
                            </span>
                            <div>
                              <p className="font-medium text-sm">{item.title}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePlayItem(item)}
                            >
                              <Play className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveFromPlaylist(item.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Select a playlist to view its contents
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Media Player */}
      {currentMedia && (
        <SecureMediaPlayer 
          media={currentMedia}
          onMediaEnd={handleMediaEnd}
        />
      )}

      {/* Create Playlist Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="playlist-name">Playlist Name</Label>
              <Input
                id="playlist-name"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="Enter playlist name"
              />
            </div>
            <div>
              <Label htmlFor="playlist-type">Playlist Type</Label>
              <Select value={newPlaylistType} onValueChange={(value: 'audio' | 'video') => setNewPlaylistType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="audio">Audio Playlist</SelectItem>
                  <SelectItem value="video">Video Playlist</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreatePlaylist} disabled={!newPlaylistName.trim()} className="w-full">
              Create Playlist
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add to Playlist Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Items to {selectedPlaylist?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="max-h-60 overflow-y-auto space-y-2">
              {availableMedia.map((media) => (
                <label key={media.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedItems.includes(media.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedItems([...selectedItems, media.id]);
                      } else {
                        setSelectedItems(selectedItems.filter(id => id !== media.id));
                      }
                    }}
                  />
                  <span className="text-sm">{media.title}</span>
                </label>
              ))}
            </div>
            <Button 
              onClick={handleAddToPlaylist} 
              disabled={selectedItems.length === 0}
              className="w-full"
            >
              Add {selectedItems.length} Item{selectedItems.length !== 1 ? 's' : ''}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PlaylistManager;