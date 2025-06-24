
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Video, Edit, Trash2, Upload } from 'lucide-react';
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

interface Track {
  id: string;
  title: string;
}

const MyVideos: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videos, setVideos] = useState<VideoFile[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [editingVideo, setEditingVideo] = useState<VideoFile | null>(null);
  const [newTitle, setNewTitle] = useState('');
  
  // Upload dialog state
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('none');

  useEffect(() => {
    if (user) {
      fetchVideos();
      fetchTracks();
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

  const fetchTracks = async () => {
    try {
      const { data, error } = await supabase
        .from('tracks')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setTracks(data || []);
    } catch (error) {
      console.error('Error fetching tracks:', error);
    }
  };

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoFile || !uploadTitle || !user) return;

    setUploading(true);
    try {
      // Upload video file
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { data: videoData, error: videoError } = await supabase.storage
        .from('video-files')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      let thumbnailUrl = null;
      if (thumbnailFile) {
        // Upload thumbnail
        const thumbnailFileName = `${user.id}/thumbnails/${Date.now()}_${thumbnailFile.name}`;
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('video-files')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailError) throw thumbnailError;

        const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
          .from('video-files')
          .getPublicUrl(thumbnailData.path);
        
        thumbnailUrl = thumbnailPublicUrl;
      }

      // Get video file URL
      const { data: { publicUrl } } = supabase.storage
        .from('video-files')
        .getPublicUrl(videoData.path);

      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title: uploadTitle,
          file_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          associated_track_id: selectedTrackId === 'none' ? null : selectedTrackId
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      // Reset form and close dialog
      setVideoFile(null);
      setThumbnailFile(null);
      setUploadTitle('');
      setSelectedTrackId('none');
      setUploadDialogOpen(false);
      
      // Refresh videos list
      fetchVideos();

    } catch (error) {
      console.error('Error uploading video:', error);
      toast({
        title: "Error",
        description: "Failed to upload video. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              My Videos ({videos.length} videos)
            </CardTitle>
            <Button onClick={() => setUploadDialogOpen(true)}>
              <Upload className="h-4 w-4 mr-2" />
              Upload Video
            </Button>
          </div>
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

      {/* Upload Video Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Upload Video
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleVideoUpload} className="space-y-4">
            <div>
              <Label htmlFor="upload-title">Video Title</Label>
              <Input
                id="upload-title"
                type="text"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="Enter video title"
                required
              />
            </div>

            <div>
              <Label htmlFor="video-file">Video File</Label>
              <Input
                id="video-file"
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <div>
              <Label htmlFor="thumbnail-file">Thumbnail (Optional)</Label>
              <Input
                id="thumbnail-file"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              />
            </div>

            <div>
              <Label htmlFor="track-select">Associate with Song (Optional)</Label>
              <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a song to associate" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No association</SelectItem>
                  {tracks.map((track) => (
                    <SelectItem key={track.id} value={track.id}>
                      {track.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" disabled={uploading || !videoFile || !uploadTitle} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? 'Uploading...' : 'Upload Video'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MyVideos;
