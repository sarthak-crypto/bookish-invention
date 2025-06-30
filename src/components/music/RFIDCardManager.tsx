
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Eye, EyeOff, Copy, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RFIDCard {
  id: string;
  card_id: string;
  album_id: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
  album_title?: string;
}

interface Album {
  id: string;
  title: string;
}

const RFIDCardManager: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rfidCards, setRfidCards] = useState<RFIDCard[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newCard, setNewCard] = useState({
    card_id: '',
    album_id: '',
  });

  useEffect(() => {
    if (user) {
      fetchRFIDCards();
      fetchAlbums();
    }
  }, [user]);

  const fetchRFIDCards = async () => {
    try {
      // First get RFID cards for the user's albums
      const { data: userAlbums, error: albumsError } = await supabase
        .from('albums')
        .select('id')
        .eq('user_id', user?.id);

      if (albumsError) throw albumsError;

      if (!userAlbums || userAlbums.length === 0) {
        setRfidCards([]);
        setIsLoading(false);
        return;
      }

      const albumIds = userAlbums.map(album => album.id);

      // Get RFID cards for these albums
      const { data: cards, error: cardsError } = await supabase
        .from('rfid_cards')
        .select('*')
        .in('album_id', albumIds)
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Get album titles for each card
      const cardsWithAlbums = await Promise.all(
        (cards || []).map(async (card) => {
          const { data: album } = await supabase
            .from('albums')
            .select('title')
            .eq('id', card.album_id)
            .single();
          
          return {
            ...card,
            album_title: album?.title || 'Unknown Album'
          };
        })
      );

      setRfidCards(cardsWithAlbums);
    } catch (error) {
      console.error('Error fetching RFID cards:', error);
      toast({
        title: "Error",
        description: "Failed to load RFID cards.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAlbums = async () => {
    try {
      const { data, error } = await supabase
        .from('albums')
        .select('id, title')
        .eq('user_id', user?.id)
        .order('title');

      if (error) throw error;
      setAlbums(data || []);
    } catch (error) {
      console.error('Error fetching albums:', error);
    }
  };

  const generateCardId = () => {
    const randomId = Math.random().toString(36).substring(2, 15) + 
                    Math.random().toString(36).substring(2, 15);
    setNewCard(prev => ({ ...prev, card_id: randomId.toUpperCase() }));
  };

  const handleCreateCard = async () => {
    if (!newCard.card_id.trim() || !newCard.album_id) {
      toast({
        title: "Validation Error",
        description: "Please provide both card ID and select an album.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from('rfid_cards')
        .insert({
          card_id: newCard.card_id.trim(),
          album_id: newCard.album_id,
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "RFID card created successfully.",
      });

      setNewCard({ card_id: '', album_id: '' });
      fetchRFIDCards();
    } catch (error: any) {
      console.error('Error creating RFID card:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create RFID card.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const toggleCardStatus = async (cardId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('rfid_cards')
        .update({ is_active: !currentStatus })
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: `Card ${!currentStatus ? 'activated' : 'deactivated'} successfully.`,
      });

      fetchRFIDCards();
    } catch (error) {
      console.error('Error updating card status:', error);
      toast({
        title: "Error",
        description: "Failed to update card status.",
        variant: "destructive",
      });
    }
  };

  const copyCardId = (cardId: string) => {
    navigator.clipboard.writeText(cardId);
    toast({
      title: "Copied!",
      description: "Card ID copied to clipboard.",
    });
  };

  const openEndUserPage = (cardId: string) => {
    const url = `${window.location.origin}/listen?card=${cardId}`;
    window.open(url, '_blank');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading RFID cards...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create New Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create RFID Card
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="albumSelect">Select Album</Label>
            <select
              id="albumSelect"
              value={newCard.album_id}
              onChange={(e) => setNewCard(prev => ({ ...prev, album_id: e.target.value }))}
              className="w-full p-2 border rounded-md"
            >
              <option value="">Choose an album...</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cardId">Card ID</Label>
            <div className="flex gap-2">
              <Input
                id="cardId"
                value={newCard.card_id}
                onChange={(e) => setNewCard(prev => ({ ...prev, card_id: e.target.value }))}
                placeholder="Enter card ID or generate one"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateCardId}
              >
                Generate
              </Button>
            </div>
          </div>

          <Button
            onClick={handleCreateCard}
            disabled={isCreating || !newCard.card_id.trim() || !newCard.album_id}
            className="w-full"
          >
            {isCreating ? 'Creating...' : 'Create RFID Card'}
          </Button>
        </CardContent>
      </Card>

      {/* RFID Cards List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Your RFID Cards ({rfidCards.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {rfidCards.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No RFID cards created yet</p>
              <p className="text-sm">Create your first card to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {rfidCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 border rounded-lg space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{card.album_title}</div>
                      <div className="text-sm text-muted-foreground">
                        Card ID: {card.card_id}
                      </div>
                    </div>
                    <Badge variant={card.is_active ? "default" : "secondary"}>
                      {card.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>Created: {new Date(card.created_at).toLocaleDateString()}</span>
                    {card.last_accessed_at && (
                      <span>• Last used: {new Date(card.last_accessed_at).toLocaleDateString()}</span>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyCardId(card.card_id)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEndUserPage(card.card_id)}
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCardStatus(card.id, card.is_active)}
                    >
                      {card.is_active ? (
                        <>
                          <EyeOff className="h-4 w-4 mr-1" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <Eye className="h-4 w-4 mr-1" />
                          Activate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default RFIDCardManager;
