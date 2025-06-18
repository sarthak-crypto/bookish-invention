
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FanCard {
  id: string;
  artwork_url: string;
  price: number;
  description: string | null;
  albums: {
    title: string;
    user_id: string;
  } | null;
}

const FanCardMarketplace: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantities, setQuantities] = useState<{ [key: string]: number }>({});
  const [orderProcessing, setOrderProcessing] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    fetchFanCards();
  }, []);

  const fetchFanCards = async () => {
    try {
      const { data, error } = await supabase
        .from('fan_cards')
        .select(`
          id,
          artwork_url,
          price,
          description,
          albums (
            title,
            user_id
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filter out cards where the album relationship failed to load or is null
      const validCards = (data || []).filter(card => 
        card.albums && 
        typeof card.albums === 'object' && 
        !('error' in card.albums) &&
        card.albums.title
      ) as FanCard[];
      
      setFanCards(validCards);
      
      // Initialize quantities
      const initialQuantities: { [key: string]: number } = {};
      validCards.forEach(card => {
        initialQuantities[card.id] = 1;
      });
      setQuantities(initialQuantities);
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

  const updateQuantity = (cardId: string, change: number) => {
    setQuantities(prev => ({
      ...prev,
      [cardId]: Math.max(1, (prev[cardId] || 1) + change)
    }));
  };

  const handleOrder = async (card: FanCard) => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to place an order.",
        variant: "destructive",
      });
      return;
    }

    if (!card.albums) {
      toast({
        title: "Error",
        description: "Album information is not available for this card.",
        variant: "destructive",
      });
      return;
    }

    setOrderProcessing(prev => ({ ...prev, [card.id]: true }));

    try {
      const quantity = quantities[card.id] || 1;
      const totalAmount = card.price * quantity;

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fan_card_id: card.id,
          quantity,
          total_amount: totalAmount,
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Send email notification
      const { error: emailError } = await supabase.functions.invoke('send-order-notification', {
        body: {
          orderId: orderData.id,
          userEmail: user.email,
          userName: user.email?.split('@')[0], // Simple name extraction
          fanCardTitle: card.albums.title,
          quantity,
          totalAmount
        }
      });

      if (emailError) {
        console.error('Email notification error:', emailError);
        // Don't fail the order if email fails
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Your order for ${quantity} x ${card.albums.title} has been placed. We'll contact you within 48 hours with further details.`,
      });

      // Reset quantity for this card
      setQuantities(prev => ({ ...prev, [card.id]: 1 }));

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "Failed to place your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setOrderProcessing(prev => ({ ...prev, [card.id]: false }));
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
          <ShoppingCart className="h-5 w-5" />
          Fan Card Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent>
        {fanCards.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No fan cards available yet.
          </p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {fanCards.map((card) => (
              <div key={card.id} className="border rounded-lg overflow-hidden">
                <div className="aspect-square relative">
                  <img
                    src={card.artwork_url}
                    alt={card.albums?.title || 'Fan Card'}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold">{card.albums?.title}</h3>
                  </div>
                  
                  {card.description && (
                    <p className="text-sm text-muted-foreground">{card.description}</p>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-lg font-semibold">
                      ${card.price.toFixed(2)}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(card.id, -1)}
                      disabled={quantities[card.id] <= 1}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min="1"
                      value={quantities[card.id] || 1}
                      onChange={(e) => setQuantities(prev => ({
                        ...prev,
                        [card.id]: Math.max(1, parseInt(e.target.value) || 1)
                      }))}
                      className="w-16 text-center"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(card.id, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Total:</span>
                      <span className="font-semibold">
                        ${(card.price * (quantities[card.id] || 1)).toFixed(2)}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleOrder(card)}
                      disabled={orderProcessing[card.id] || !user}
                      className="w-full"
                    >
                      {orderProcessing[card.id] ? (
                        'Processing...'
                      ) : (
                        <>
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Order Now
                        </>
                      )}
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
