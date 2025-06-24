
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Album, Upload, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CreateAlbum: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [createdApiEndpoint, setCreatedApiEndpoint] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "API endpoint copied to clipboard",
    });
  };

  const openInBrowser = (url: string) => {
    window.open(url, '_blank');
  };

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
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          title: formData.title,
          description: formData.description,
          artwork_url: artworkUrl,
        })
        .select()
        .single();

      if (albumError) throw albumError;

      // Automatically create API key for the album
      const { data: apiKeyData, error: apiKeyError } = await supabase
        .from('album_api_keys')
        .insert({
          album_id: albumData.id,
        })
        .select()
        .single();

      if (apiKeyError) {
        console.error('Error creating API key:', apiKeyError);
        // Don't throw error here - album creation should succeed even if API key fails
      } else {
        // Set the API endpoint URL for display
        const apiEndpoint = `https://pmrqueeoojexmuuyefba.supabase.co/functions/v1/album-api/${apiKeyData.api_key}`;
        setCreatedApiEndpoint(apiEndpoint);
      }

      toast({
        title: "Success!",
        description: "Album created successfully with API access enabled.",
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
    <div className="space-y-4">
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

      {createdApiEndpoint && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Album API Endpoint
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Your album API endpoint is ready! You can paste this URL directly in your browser to view and play the album:
            </p>
            
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <code className="flex-1 text-sm font-mono break-all">
                {createdApiEndpoint}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(createdApiEndpoint)}
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openInBrowser(createdApiEndpoint)}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              This endpoint will return all tracks and videos associated with this album in JSON format, which can be used by external applications or viewed directly in the browser.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CreateAlbum;
