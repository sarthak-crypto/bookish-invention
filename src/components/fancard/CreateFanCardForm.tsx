
import React, { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateFanCardFormProps {
  albumId: string;
  onCardCreated: () => void;
}

const CreateFanCardForm: React.FC<CreateFanCardFormProps> = ({ albumId, onCardCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    cardName: '',
    quantity: '500',
    description: '',
  });
  const [artworkFile, setArtworkFile] = useState<File | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !artworkFile) return;

    const quantity = parseInt(formData.quantity);
    if (quantity < 500) {
      toast({
        title: "Invalid Quantity",
        description: "Minimum order quantity is 500 cards.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      // Upload fan card artwork
      const artworkFileName = `${user.id}/fancard-${Date.now()}-${artworkFile.name}`;
      const { data: artworkUpload, error: artworkError } = await supabase.storage
        .from('artwork')
        .upload(artworkFileName, artworkFile);

      if (artworkError) throw artworkError;

      const artworkUrl = `https://pmrqueeoojexmuuyefba.supabase.co/storage/v1/object/public/artwork/${artworkFileName}`;

      // Create fan card with pending status and purchased=false
      const { error: fanCardError } = await supabase
        .from('fan_cards')
        .insert({
          user_id: user.id,
          album_id: albumId,
          artwork_url: artworkUrl,
          quantity: quantity,
          description: formData.description,
          status: 'pending',
          purchased: false,
        });

      if (fanCardError) throw fanCardError;

      toast({
        title: "Success!",
        description: "Fan card created successfully. An admin will review your request.",
      });

      // Reset form
      setFormData({ cardName: '', quantity: '500', description: '' });
      setArtworkFile(null);
      
      // Notify parent to refresh
      onCardCreated();

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
          <Plus className="h-5 w-5" />
          Create New Fan Card
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="cardName">Card Name</Label>
            <Input
              id="cardName"
              type="text"
              value={formData.cardName}
              onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
              placeholder="Enter card name"
              required
            />
          </div>

          <div>
            <Label htmlFor="quantity">Number of Cards (minimum 500)</Label>
            <Input
              id="quantity"
              type="number"
              min="500"
              value={formData.quantity}
              onChange={(e) => setFormData(prev => ({ ...prev, quantity: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Add any special instructions or notes"
            />
          </div>

          <div>
            <Label htmlFor="artworkFile">Card Artwork</Label>
            <Input
              id="artworkFile"
              type="file"
              accept="image/*"
              onChange={(e) => setArtworkFile(e.target.files?.[0] || null)}
              required
            />
            <p className="text-sm text-muted-foreground mt-1">
              Upload high-resolution artwork for your fan card
            </p>
          </div>

          <Button 
            type="submit" 
            disabled={isCreating || !formData.cardName || !artworkFile} 
            className="w-full"
          >
            <Upload className="h-4 w-4 mr-2" />
            {isCreating ? 'Creating...' : 'Create Fan Card'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateFanCardForm;
