
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Album, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreateAlbum: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      let artworkUrl = null;

      // Upload artwork if provided
      if (artworkFile) {
        const artworkFileName = `${user.id}/${Date.now()}-${artworkFile.name}`;
        const { data: artworkUpload, error: artworkError } = await supabase.storage
          .from('artwork')
          .upload(artworkFileName, artworkFile);

        if (artworkError) throw artworkError;
        artworkUrl = `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/artwork/${artworkFileName}`;
      }

      // Create album
      const { error: albumError } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          artwork_url: artworkUrl,
        });

      if (albumError) throw albumError;

      toast({
        title: "Success!",
        description: "Album created successfully.",
      });

      // Reset form
      setFormData({ title: '', description: '' });
      setArtworkFile(null);
    } catch (error) {
      console.error('Album creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create album. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Album className="h-5 w-5" />
          Create Album
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="albumTitle">Album Title</Label>
            <Input
              id="albumTitle"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="albumDescription">Description</Label>
            <Textarea
              id="albumDescription"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="artworkFile">Album Artwork (Optional)</Label>
            <Input
              id="artworkFile"
              type="file"
              accept="image/*"
              onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
            />
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            <Upload className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Album'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateAlbum;
