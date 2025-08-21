
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProjectUploadMusicProps {
  albumId: string;
  onUploadComplete?: () => void;
}

const ProjectUploadMusic: React.FC<ProjectUploadMusicProps> = ({ albumId, onUploadComplete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [title, setTitle] = useState('');
  const [musicFile, setMusicFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !musicFile) return;

    setIsUploading(true);
    try {
      // Upload music file
      const musicFileName = `${user.id}/${Date.now()}-${musicFile.name}`;
      const { data: musicUpload, error: musicError } = await supabase.storage
        .from('music-files')
        .upload(musicFileName, musicFile);

      if (musicError) throw musicError;

      const musicUrl = `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/music-files/${musicFileName}`;

      // Create track entry
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: user.id,
          album_id: albumId,
          title: title,
          file_url: musicUrl,
        });

      if (trackError) throw trackError;

      toast({
        title: "Success!",
        description: "Music uploaded successfully.",
      });

      // Reset form
      setTitle('');
      setMusicFile(null);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Error",
        description: "Failed to upload music. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Upload Music to Project
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="trackTitle">Track Title</Label>
            <Input
              id="trackTitle"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div>
            <Label htmlFor="musicFile">Music File</Label>
            <Input
              id="musicFile"
              type="file"
              accept="audio/*"
              onChange={(e) => setMusicFile(e.target.files?.[0] || null)}
              required
            />
          </div>

          <Button type="submit" disabled={isUploading || !title || !musicFile} className="w-full" style={{ color: '#C87343' }}>
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Music'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ProjectUploadMusic;
