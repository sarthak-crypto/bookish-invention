
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Video, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SecureMediaPlayer from '@/components/media/SecureMediaPlayer';

interface VideoFile {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url?: string;
  created_at: string;
  associated_track_id?: string | null;
}

const MyVideos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoFile | null>(null);
  const [newTitle, setNewTitle] = useState('');

  useEffect(() => {
    if (user) {
      fetchVideos();
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error) {
      console.error('Error fetching videos:', error);
      toast({
        title: "Error",
        description: "Failed to load your videos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoSelect = (video: VideoFile) => {
    setSelectedVideo(video);
  };

  const handleVideoEnd = () => {
    if (selectedVideo) {
      const currentIndex = videos.findIndex(v => v.id === selectedVideo.id);
      const nextIndex = currentIndex + 1;
      if (nextIndex < videos.length) {
        setSelectedVideo(videos[nextIndex]);
      } else {
        setSelectedVideo(null);
      }
    }
  };

  const handleEdit = (video: VideoFile) => {
    setEditingVideo(video);
    setNewTitle(video.title);
  };

  const handleSaveEdit = async () => {
    if (!editingVideo || !newTitle.trim()) return;

    try {
      const { error } = await supabase
        .from('videos')
        .update({ title: newTitle.trim() })
        .eq('id', editingVideo.id);

      if (error) throw error;

      setVideos(videos.map(v => 
        v.id === editingVideo.id ? { ...v, title: newTitle.trim() } : v
      ));

      if (selectedVideo && selectedVideo.id === editingVideo.id) {
        setSelectedVideo({ ...selectedVideo, title: newTitle.trim() });
      }

      setEditingVideo(null);
      setNewTitle('');

      toast({
        title: "Success",
        description: "Video title updated successfully.",
      });
    } catch (error) {
      console.error('Error updating video:', error);
      toast({
        title: "Error",
        description: "Failed to update video title.",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingVideo(null);
    setNewTitle('');
  };

  const handleDelete = async (video: VideoFile) => {
    if (!confirm(`Are you sure you want to delete "${video.title}"?`)) return;

    try {
      const { error } = await supabase
        .from('videos')
        .delete()
        .eq('id', video.id);

      if (error) throw error;

      setVideos(videos.filter(v => v.id !== video.id));

      if (selectedVideo && selectedVideo.id === video.id) {
        setSelectedVideo(null);
      }

      toast({
        title: "Success",
        description: "Video deleted successfully.",
      });
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: "Error",
        description: "Failed to delete video.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading your videos...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            My Videos ({videos.length} videos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {videos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No videos uploaded yet. Upload your first video to get started!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className={`border rounded-lg overflow-hidden hover:shadow-md transition-all ${
                    selectedVideo?.id === video.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div 
                    className="aspect-video bg-muted flex items-center justify-center cursor-pointer"
                    onClick={() => handleVideoSelect(video)}
                  >
                    {video.thumbnail_url ? (
                      <img 
                        src={video.thumbnail_url} 
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Video className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <div className="p-3">
                    {editingVideo && editingVideo.id === video.id ? (
                      <div className="space-y-2">
                        <Input
                          value={newTitle}
                          onChange={(e) => setNewTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveEdit();
                            if (e.key === 'Escape') handleCancelEdit();
                          }}
                          className="text-sm"
                        />
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            onClick={handleSaveEdit}
                            className="flex-1"
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={handleCancelEdit}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="font-medium truncate">{video.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(video.created_at).toLocaleDateString()}
                        </p>
                        <div className="flex gap-1 mt-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(video)}
                            className="flex-1"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(video)}
                            className="flex-1"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVideo && (
        <SecureMediaPlayer 
          media={{
            ...selectedVideo,
            type: 'video'
          }}
          onMediaEnd={handleVideoEnd}
        />
      )}
    </div>
  );
};

export default MyVideos;
