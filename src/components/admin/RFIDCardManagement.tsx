
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Eye, EyeOff, Copy, ExternalLink, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RFIDCard {
  id: string;
  card_id: string;
  album_id: string;
  is_active: boolean;
  created_at: string;
  last_accessed_at: string | null;
  album_title?: string;
  artist_name?: string;
}

interface Album {
  id: string;
  title: string;
  user_id: string;
  artist_name?: string;
}

const RFIDCardManagement: React.FC = () => {
  const { toast } = useToast();
  const [rfidCards, setRfidCards] = useState<RFIDCard[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newCard, setNewCard] = useState({
    card_id: '',
    album_id: '',
  });

  useEffect(() => {
    fetchRFIDCards();
    fetchAlbums();
  }, []);

  const fetchRFIDCards = async () => {
    try {
      // Get all RFID cards
      const { data: cards, error: cardsError } = await supabase
        .from('rfid_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (cardsError) throw cardsError;

      // Get album and artist info for each card
      const cardsWithDetails = await Promise.all(
        (cards || []).map(async (card) => {
          const { data: album } = await supabase
            .from('albums')
            .select('title, user_id')
            .eq('id', card.album_id)
            .single();

          let artistName = 'Unknown Artist';
          if (album?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('artist_name')
              .eq('id', album.user_id)
              .single();
            artistName = profile?.artist_name || 'Unknown Artist';
          }
          
          return {
            ...card,
            album_title: album?.title || 'Unknown Album',
            artist_name: artistName
          };
        })
      );

      setRfidCards(cardsWithDetails);
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
      const { data: albumData, error } = await supabase
        .from('albums')
        .select('id, title, user_id')
        .order('title');

      if (error) throw error;

      // Get artist names for albums
      const albumsWithArtists = await Promise.all(
        (albumData || []).map(async (album) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('artist_name')
            .eq('id', album.user_id)
            .single();
          
          return {
            ...album,
            artist_name: profile?.artist_name || 'Unknown Artist'
          };
        })
      );

      setAlbums(albumsWithArtists);
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

  const deleteCard = async (cardId: string) => {
    if (!window.confirm('Are you sure you want to delete this RFID card? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('rfid_cards')
        .delete()
        .eq('id', cardId);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "RFID card deleted successfully.",
      });

      fetchRFIDCards();
    } catch (error) {
      console.error('Error deleting RFID card:', error);
      toast({
        title: "Error",
        description: "Failed to delete RFID card.",
        variant: "destructive",
      });
    }
  };

  const filteredCards = rfidCards.filter(card =>
    card.card_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.album_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.artist_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading RFID cards...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create New Card */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create RFID Card
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="albumSelect" className="text-white">Select Album</Label>
            <select
              id="albumSelect"
              value={newCard.album_id}
              onChange={(e) => setNewCard(prev => ({ ...prev, album_id: e.target.value }))}
              className="w-full p-2 border rounded-md bg-white/10 border-white/20 text-white"
            >
              <option value="">Choose an album...</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id} className="text-black">
                  {album.title} - {album.artist_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="cardId" className="text-white">Card ID</Label>
            <div className="flex gap-2">
              <Input
                id="cardId"
                value={newCard.card_id}
                onChange={(e) => setNewCard(prev => ({ ...prev, card_id: e.target.value }))}
                placeholder="Enter card ID or generate one"
                className="bg-white/10 border-white/20 text-white placeholder:text-gray-400"
              />
              <Button
                type="button"
                variant="outline"
                onClick={generateCardId}
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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

      {/* Search and Cards List */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            RFID Cards Management ({filteredCards.length})
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cards, albums, or artists..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-gray-400"
            />
          </div>
        </CardHeader>
        <CardContent>
          {filteredCards.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No RFID cards found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCards.map((card) => (
                <div
                  key={card.id}
                  className="p-4 border rounded-lg space-y-3 bg-white/5 border-white/10"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-white">{card.album_title}</div>
                      <div className="text-sm text-gray-300">
                        Artist: {card.artist_name}
                      </div>
                      <div className="text-sm text-gray-400">
                        Card ID: {card.card_id}
                      </div>
                    </div>
                    <Badge variant={card.is_active ? "default" : "secondary"}>
                      {card.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-gray-400">
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
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy ID
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEndUserPage(card.card_id)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleCardStatus(card.id, card.is_active)}
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deleteCard(card.id)}
                    >
                      Delete
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

export default RFIDCardManagement;
