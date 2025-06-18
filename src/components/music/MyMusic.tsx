
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Music, Album, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecureMediaPlayer from '@/components/media/SecureMediaPlayer';

interface Track {
  id: string;
  title: string;
  file_url: string;
  album_id: string | null;
  created_at: string;
  albums?: {
    title: string;
  } | null;
}

const MyMusic: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (user) {
      fetchTracks();
    }
  }, [user]);

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select(`
          *,
          albums (
            title
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
      toast({
        title: "Error",
        description: "Failed to load your music.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTrackSelect = (track: Track) => {
    setSelectedTrack(track);
  };

  const handleTrackEnd = () => {
    if (selectedTrack) {
      const currentIndex = tracks.findIndex(t => t.id === selectedTrack.id);
      const nextIndex = currentIndex + 1;
      if (nextIndex < tracks.length) {
        setSelectedTrack(tracks[nextIndex]);
      } else {
        setSelectedTrack(null);
      }
    }
  };

  const handleEdit = (track: Track) => {
    setEditingTrack(track);
    setNewTitle(track.title);
  };

  const handleSaveEdit = async () => {
    if (!editingTrack || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('tracks')
        .update({ title: newTitle.trim() })
        .eq('id', editingTrack.id);

      if (error) throw error;

      setTracks(tracks.map(t => 
        t.id === editingTrack.id ? { ...t, title: newTitle.trim() } : t
      ));

      if (selectedTrack && selectedTrack.id === editingTrack.id) {
        setSelectedTrack({ ...selectedTrack, title: newTitle.trim() });
      }

      setEditingTrack(null);
      setNewTitle('');

      toast({
        title: "Success",
        description: "Track title updated successfully.",
      });
    } catch (error) {
      console.error('Error updating track:', error);
      toast({
        title: "Error",
        description: "Failed to update track title.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingTrack(null);
    setNewTitle('');
  };

  const handleDelete = async (track: Track) => {
    if (!confirm(`Are you sure you want to delete "${track.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('tracks')
        .delete()
        .eq('id', track.id);

      if (error) throw error;

      setTracks(tracks.filter(t => t.id !== track.id));

      if (selectedTrack && selectedTrack.id === track.id) {
        setSelectedTrack(null);
      }

      toast({
        title: "Success",
        description: "Track deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting track:', error);
      toast({
        title: "Error",
        description: "Failed to delete track.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading your music...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            My Music ({tracks.length} tracks)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {tracks.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No music uploaded yet. Start by uploading your first track!
            </p>
          ) : (
            <div className="space-y-3">
              {tracks.map((track) => (
                <div
                  key={track.id}
                  className={`flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors ${
                    selectedTrack?.id === track.id ? 'bg-primary/10 border-primary' : ''
                  }`}
                >
                  <div 
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleTrackSelect(track)}
                  >
                    <div className="flex-1">
                      {editingTrack && editingTrack.id === track.id ? (
                        <div className="space-y-2">
                          <Input
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit();
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-sm"
                          />
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveEdit();
                              }}
                            >
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCancelEdit();
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="font-medium">{track.title}</p>
                          {track.albums && (
                            <p className="text-sm text-muted-foreground flex items-center gap-1">
                              <Album className="h-3 w-3" />
                              {track.albums.title}
                            </p>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                      {new Date(track.created_at).toLocaleDateString()}
                    </p>
                    {selectedTrack?.id === track.id && (
                      <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
                    )}
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEdit(track);
                        }}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(track);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedTrack && (
        <SecureMediaPlayer 
          media={{
            ...selectedTrack,
            type: 'audio'
          }}
          onMediaEnd={handleTrackEnd}
        />
      )}
    </div>
  );
};

export default MyMusic;
