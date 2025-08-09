
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CreditCard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BuyMoreFanCardsDialog from './BuyMoreFanCardsDialog';

interface FanCard {
  id: string;
  album_id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  albums?: {
    title: string;
    user_id: string;
    profiles?: {
      client_name: string | null;
    } | null;
  } | null;
}

const OverviewFanCardsGrid: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<FanCard | null>(null);
  const [buyDialogOpen, setBuyDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchFanCards();
    }
  }, [user]);

  const fetchFanCards = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_cards')
        .select(`
          *,
          albums (
            title,
            user_id,
            profiles (
              client_name
            )
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setFanCards(data || []);
    } catch (error) {
      console.error('Error fetching fan cards:', error);
      toast({
        title: "Error",
        description: "Failed to load fan cards.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBuyMore = (card: FanCard) => {
    setSelectedCard(card);
    setBuyDialogOpen(true);
  };

  const handleOrderComplete = () => {
    fetchFanCards(); // Refresh the list
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading your fan cards...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            My Fan Cards
          </CardTitle>
        </CardHeader>
        <CardContent>
          {fanCards.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No fan cards created yet. Create your first fan card to engage with your fans!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {fanCards.map((card) => (
                <div key={card.id} className="border rounded-lg overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  <img
                    src={card.artwork_url}
                    alt={`Fan card for ${card.albums?.title}`}
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <p className="font-medium text-lg mb-1">
                      {card.albums?.profiles?.client_name || 'Unknown Artist'}
                    </p>
                    <Button
                      onClick={() => handleBuyMore(card)}
                      className="w-full bg-primary hover:bg-primary/90 mt-3"
                    >
                      Buy More
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Buy More Dialog */}
      {selectedCard && (
        <BuyMoreFanCardsDialog
          open={buyDialogOpen}
          onOpenChange={setBuyDialogOpen}
          fanCard={selectedCard}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </>
  );
};

export default OverviewFanCardsGrid;
