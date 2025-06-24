
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UploadMusicDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

const UploadMusicDialog: React.FC<UploadMusicDialogProps> = ({ 
  open, 
  onOpenChange, 
  onUploadSuccess 
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    albumTitle: '',
    description: '',
  });
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

      // Create or get album
      let albumId = null;
      if (formData.albumTitle) {
        const { data: existingAlbum } = await supabase
          .from('albums')
          .select('id')
          .eq('user_id', user.id)
          .eq('title', formData.albumTitle)
          .single();

        if (existingAlbum) {
          albumId = existingAlbum.id;
        } else {
          const { data: newAlbum, error: albumError } = await supabase
            .from('albums')
            .insert({
              user_id: user.id,
              title: formData.albumTitle,
              description: formData.description,
            })
            .select()
            .single();

          if (albumError) throw albumError;
          albumId = newAlbum.id;
        }
      }

      // Create track record
      const { error: trackError } = await supabase
        .from('tracks')
        .insert({
          user_id: user.id,
          album_id: albumId,
          title: formData.title,
          file_url: `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/music-files/${musicFileName}`,
        });

      if (trackError) throw trackError;

      toast({
        title: "Success!",
        description: "Your music has been uploaded successfully.",
      });

      // Reset form and close dialog
      setFormData({ title: '', albumTitle: '', description: '' });
      setMusicFile(null);
      onOpenChange(false);
      onUploadSuccess();
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Upload Music
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Track Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="albumTitle">Album Title (Optional)</Label>
            <Input
              id="albumTitle"
              value={formData.albumTitle}
              onChange={(e) => setFormData(prev => ({ ...prev, albumTitle: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
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

          <Button type="submit" disabled={isUploading || !musicFile} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {isUploading ? 'Uploading...' : 'Upload Music'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadMusicDialog;
