
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Album {
  id: string;
  title: string;
}

const CreateFanCard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [formData, setFormData] = useState({
    albumId: '',
    quantity: '1',
    description: '',
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  useEffect(() => {
    if (user) {
      fetchAlbums();
    }
  }, [user]);

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title')
        .eq('user_id', user?.id);

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artworkFile) return;

    setIsCreating(true);
    try {
      // Upload fan card artwork
      const artworkFileName = `${user.id}/fancard-${Date.now()}-${artworkFile.name}`;
      const { data: artworkUpload, error: artworkError } = await supabase.storage
        .from('artwork')
        .upload(artworkFileName, artworkFile);

      if (artworkError) throw artworkError;

      const artworkUrl = `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/artwork/${artworkFileName}`;

      // Create fan card
      const { error: fanCardError } = await supabase
        .from('fan_cards')
        .insert({
          user_id: user.id,
          album_id: formData.albumId,
          artwork_url: artworkUrl,
          quantity: parseInt(formData.quantity),
          description: formData.description,
        });

      if (fanCardError) throw fanCardError;

      toast({
        title: "Success!",
        description: "Fan card created successfully.",
      });

      // Reset form
      setFormData({ albumId: '', quantity: '1', description: '' });
      setArtworkFile(null);
    } catch (error) {
      console.error('Fan card creation error:', error);
      toast({
        title: "Error",
        description: "Failed to create fan card. Please try again.",
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
          <CreditCard className="h-5 w-5" />
          Create Fan Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        {albums.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">
              You need to create at least one album before creating fan cards.
            </p>
            <Button variant="outline" onClick={fetchAlbums}>Refresh Albums</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="albumSelect">Select Album</Label>
              <Select 
                value={formData.albumId} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, albumId: value }))}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select an album" />
                </SelectTrigger>
                <SelectContent>
                  {albums.map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
                required
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
              <Label htmlFor="artworkFile">Fan Card Artwork</Label>
              <Input
                id="artworkFile"
                type="file"
                accept="image/*"
                onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
                required
              />
            </div>

            <Button type="submit" disabled={isCreating || !formData.albumId || !artworkFile} className="w-full">
              <Upload className="h-4 w-4 mr-2" />
              {isCreating ? 'Creating...' : 'Create Fan Card'}
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
};

export default CreateFanCard;
