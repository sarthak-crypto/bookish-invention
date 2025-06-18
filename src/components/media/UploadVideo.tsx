
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Track {
  id: string;
  title: string;
}

const UploadVideo: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('none');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchTracks();
    }
  }, [user]);

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
    if (!videoFile || !title || !user) return;

    setUploading(true);
    try {
      // Upload video file
      const videoFileName = `${user.id}/${Date.now()}_${videoFile.name}`;
      const { data: videoData, error: videoError } = await supabase.storage
        .from('videos')
        .upload(videoFileName, videoFile);

      if (videoError) throw videoError;

      let thumbnailUrl = null;
      if (thumbnailFile) {
        // Upload thumbnail
        const thumbnailFileName = `${user.id}/thumbnails/${Date.now()}_${thumbnailFile.name}`;
        const { data: thumbnailData, error: thumbnailError } = await supabase.storage
          .from('videos')
          .upload(thumbnailFileName, thumbnailFile);

        if (thumbnailError) throw thumbnailError;

        const { data: { publicUrl: thumbnailPublicUrl } } = supabase.storage
          .from('videos')
          .getPublicUrl(thumbnailData.path);
        
        thumbnailUrl = thumbnailPublicUrl;
      }

      // Get video file URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(videoData.path);

      // Save video metadata to database
      const { error: dbError } = await supabase
        .from('videos')
        .insert({
          user_id: user.id,
          title,
          file_url: publicUrl,
          thumbnail_url: thumbnailUrl,
          associated_track_id: selectedTrackId === 'none' ? null : selectedTrackId
        });

      if (dbError) throw dbError;

      toast({
        title: "Success",
        description: "Video uploaded successfully!",
      });

      // Reset form
      setVideoFile(null);
      setThumbnailFile(null);
      setTitle('');
      setSelectedTrackId('none');
      
      // Reset file inputs
      const videoInput = document.getElementById('video-file') as HTMLInputElement;
      const thumbnailInput = document.getElementById('thumbnail-file') as HTMLInputElement;
      if (videoInput) videoInput.value = '';
      if (thumbnailInput) thumbnailInput.value = '';

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Upload Video
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleVideoUpload} className="space-y-4">
          <div>
            <Label htmlFor="title">Video Title</Label>
            <Input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

          <Button type="submit" disabled={uploading || !videoFile || !title}>
            <Upload className="h-4 w-4 mr-2" />
            {uploading ? 'Uploading...' : 'Upload Video'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default UploadVideo;
