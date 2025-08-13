
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Save, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FanCard {
  id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  status: string;
  album_id: string;
  albums?: {
    title: string;
    artist_name: string | null;
    description: string | null;
    profiles?: {
      client_name: string | null;
    } | null;
  } | null;
}

interface EditFanCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fanCard: FanCard;
  onCardUpdated: () => void;
}

const EditFanCardDialog: React.FC<EditFanCardDialogProps> = ({
  open,
  onOpenChange,
  fanCard,
  onCardUpdated
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    description: fanCard.description || '',
    quantity: fanCard.quantity.toString(),
    artistName: fanCard.albums?.artist_name || fanCard.albums?.profiles?.client_name || '',
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsUpdating(true);
    try {
      let artworkUrl = fanCard.artwork_url;

      // Upload new artwork if provided
      if (artworkFile) {
        const artworkFileName = `${user.id}/fancard-${Date.now()}-${artworkFile.name}`;
        const { data: artworkUpload, error: artworkError } = await supabase.storage
          .from('artwork')
          .upload(artworkFileName, artworkFile);

        if (artworkError) throw artworkError;
        artworkUrl = `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/artwork/${artworkFileName}`;
      }

      // Update fan card
      const { error: fanCardError } = await supabase
        .from('fan_cards')
        .update({
          artwork_url: artworkUrl,
          quantity: parseInt(formData.quantity),
          description: formData.description,
        })
        .eq('id', fanCard.id)
        .eq('user_id', user.id);

      if (fanCardError) throw fanCardError;

      // Update album artist name if changed
      if (formData.artistName !== (fanCard.albums?.artist_name || fanCard.albums?.profiles?.client_name)) {
        const { error: albumError } = await supabase
          .from('albums')
          .update({
            artist_name: formData.artistName,
          })
          .eq('id', fanCard.album_id)
          .eq('user_id', user.id);

        if (albumError) {
          console.error('Error updating album artist name:', albumError);
          // Don't throw here as the fan card update was successful
        }
      }

      toast({
        title: "Success!",
        description: "Fan card updated successfully.",
      });

      onCardUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error('Fan card update error:', error);
      toast({
        title: "Error",
        description: "Failed to update fan card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Fan Card</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="artistName">Artist Name</Label>
            <Input
              id="artistName"
              value={formData.artistName}
              onChange={(e) => setFormData(prev => ({ ...prev, artistName: e.target.value }))}
              placeholder="Enter artist name"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Number of Cards</Label>
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
              placeholder="Enter card description"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="artworkFile">Card Artwork</Label>
            <Input
              id="artworkFile"
              type="file"
              accept="image/*"
              onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Leave empty to keep current artwork
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Updating...' : 'Update Card'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFanCardDialog;
