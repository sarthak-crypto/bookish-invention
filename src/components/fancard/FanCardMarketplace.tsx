
import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface FanCard {
  id: string;
  artwork_url: string;
  price: number;
  description: string | null;
  created_at: string;
  albums: {
    title: string;
    user_id: string;
  } | null;
  profiles: {
    artist_name: string | null;
  } | null;
}

const FanCardMarketplace: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFanCards();
  }, []);

  const fetchFanCards = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_cards')
        .select(`
          *,
          albums (
            title,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch artist profiles separately
      const fanCardsWithProfiles = await Promise.all(
        (data || []).map(async (card) => {
          if (card.albums?.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('artist_name')
              .eq('id', card.albums.user_id)
              .single();
            
            return {
              ...card,
              profiles: profile
            };
          }
          return {
            ...card,
            profiles: null
          };
        })
      );

      setFanCards(fanCardsWithProfiles);
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

  const handlePurchase = async (fanCard: FanCard) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase fan cards.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the order first
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fan_card_id: fanCard.id,
          quantity: 1,
          total_amount: fanCard.price,
          status: 'pending'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;

      // Track order creation analytics
      await supabase
        .from('analytics_events')
        .insert({
          event_type: 'order_created',
          metadata: { 
            order_id: orderData.id, 
            fan_card_id: fanCard.id,
            total_amount: fanCard.price,
            album_title: fanCard.albums?.title
          },
          user_id: user.id
        });

      // Get user profile for the email
      const { data: profileData } = await supabase
        .from('profiles')
        .select('artist_name')
        .eq('id', user.id)
        .single();

      // Send order notification email
      const { error: emailError } = await supabase.functions.invoke('send-order-notification', {
        body: {
          orderId: orderData.id,
          userEmail: user.email,
          userName: profileData?.artist_name || 'Customer',
          fanCardTitle: fanCard.albums?.title || 'Fan Card',
          quantity: 1,
          totalAmount: fanCard.price
        }
      });

      if (emailError) {
        console.error('Email sending error:', emailError);
        // Don't fail the order if email fails, just log it
      }

      toast({
        title: "Success!",
        description: "Your order has been placed successfully. You'll receive a confirmation email shortly.",
      });
    } catch (error) {
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to place order. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading fan cards...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5" />
          Fan Card Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fanCards.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No fan cards available yet. Check back soon!
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fanCards.map((card) => (
              <div key={card.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <img
                  src={card.artwork_url}
                  alt="Fan card artwork"
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="font-semibold text-lg mb-1">
                    {card.albums?.title || 'Unknown Album'}
                  </h3>
                  {card.profiles?.artist_name && (
                    <p className="text-sm text-muted-foreground mb-2">
                      by {card.profiles.artist_name}
                    </p>
                  )}
                  {card.description && (
                    <p className="text-sm text-muted-foreground mb-3">
                      {card.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold text-primary">
                      ${card.price}
                    </span>
                    <Button
                      onClick={() => handlePurchase(card)}
                      className="flex items-center gap-2"
                    >
                      <ShoppingCart className="h-4 w-4" />
                      Buy Now
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FanCardMarketplace;
