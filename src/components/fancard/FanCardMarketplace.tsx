import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ShoppingCart, CreditCard, Package, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FanCard {
  id: string;
  album_id: string;
  user_id: string;
  artwork_url: string;
  description: string | null;
  quantity: number;
  created_at: string;
  updated_at: string;
  profiles: {
    client_name: string;
  } | null;
  albums: {
    id: string;
    title: string;
    artwork_url: string;
  } | null;
}

const FanCardMarketplace: React.FC = () => {
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCard, setSelectedCard] = useState<FanCard | null>(null);
  const [orderForm, setOrderForm] = useState({
    quantity: 1,
    shippingAddress: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchFanCards();
  }, []);

  const fetchFanCards = async () => {
    try {
      const { data: fanCardsData, error } = await supabase
        .from('fan_cards')
        .select(`
          *,
          albums (
            id,
            title,
            artwork_url
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const fanCardsWithProfiles = await Promise.all(
        (fanCardsData || []).map(async (card) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('client_name')
              .eq('id', card.user_id)
              .single();

            return {
              ...card,
              profiles: profile || { client_name: 'Unknown Client' }
            };
          } catch (error) {
            console.error('Error fetching profile for fan card:', error);
            return {
              ...card,
              profiles: { client_name: 'Unknown Client' }
            };
          }
        })
      );

      setFanCards(fanCardsWithProfiles);
    } catch (error) {
      console.error('Error fetching fan cards:', error);
      toast({
        title: "Error",
        description: "Failed to fetch fan cards",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrder = async () => {
    if (!selectedCard) return;

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        toast({
          title: "Error",
          description: "Please log in to place an order",
          variant: "destructive",
        });
        return;
      }

      const totalAmount = orderForm.quantity * 10; // Assuming $10 per card

      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fan_card_id: selectedCard.id,
          quantity: orderForm.quantity,
          total_amount: totalAmount,
          shipping_address: orderForm.shippingAddress,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order placed successfully!",
      });

      setSelectedCard(null);
      setOrderForm({
        quantity: 1,
        shippingAddress: {
          name: '',
          address: '',
          city: '',
          state: '',
          zipCode: '',
          country: ''
        }
      });
    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Error",
        description: "Failed to place order",
        variant: "destructive",
      });
    }
  };

  const filteredCards = fanCards.filter(card =>
    card.albums?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.profiles?.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    card.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4"></div>
          <p className="text-lg">Loading fan cards...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Fan Card Marketplace
          </h1>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Discover and collect exclusive fan cards from your favorite clients
          </p>
        </div>

        {/* Search */}
        <div className="max-w-md mx-auto mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by client, album, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-gray-400"
            />
          </div>
        </div>

        {/* Fan Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCards.map((card) => (
            <Card key={card.id} className="bg-white/10 backdrop-blur-lg border-white/20 overflow-hidden">
              <div className="aspect-square overflow-hidden">
                <img
                  src={card.artwork_url || card.albums?.artwork_url || '/placeholder.svg'}
                  alt={card.albums?.title || 'Fan Card'}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  {card.albums?.title || 'Unknown Album'}
                </CardTitle>
                <p className="text-purple-300 font-medium">
                  by {card.profiles?.client_name || 'Unknown Client'}
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                {card.description && (
                  <p className="text-gray-300 text-sm line-clamp-3">
                    {card.description}
                  </p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="bg-purple-600 text-white">
                    <Package className="h-3 w-3 mr-1" />
                    {card.quantity} available
                  </Badge>
                  <span className="text-lg font-bold text-white">$10</span>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      onClick={() => setSelectedCard(card)}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Order Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-gray-900 border-gray-700 max-w-md">
                    <DialogHeader>
                      <DialogTitle className="text-white">Order Fan Card</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="text-center">
                        <img
                          src={selectedCard?.artwork_url || selectedCard?.albums?.artwork_url || '/placeholder.svg'}
                          alt={selectedCard?.albums?.title || 'Fan Card'}
                          className="w-24 h-24 mx-auto rounded-lg object-cover mb-2"
                        />
                        <h3 className="text-white font-bold">{selectedCard?.albums?.title}</h3>
                        <p className="text-gray-300">by {selectedCard?.profiles?.client_name}</p>
                      </div>

                      <div>
                        <Label className="text-white">Quantity</Label>
                        <Input
                          type="number"
                          min="1"
                          max={selectedCard?.quantity || 1}
                          value={orderForm.quantity}
                          onChange={(e) => setOrderForm(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-white">Shipping Address</Label>
                        <Input
                          placeholder="Full Name"
                          value={orderForm.shippingAddress.name}
                          onChange={(e) => setOrderForm(prev => ({ 
                            ...prev, 
                            shippingAddress: { ...prev.shippingAddress, name: e.target.value }
                          }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <Textarea
                          placeholder="Street Address"
                          value={orderForm.shippingAddress.address}
                          onChange={(e) => setOrderForm(prev => ({ 
                            ...prev, 
                            shippingAddress: { ...prev.shippingAddress, address: e.target.value }
                          }))}
                          className="bg-white/10 border-white/20 text-white"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="City"
                            value={orderForm.shippingAddress.city}
                            onChange={(e) => setOrderForm(prev => ({ 
                              ...prev, 
                              shippingAddress: { ...prev.shippingAddress, city: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <Input
                            placeholder="State"
                            value={orderForm.shippingAddress.state}
                            onChange={(e) => setOrderForm(prev => ({ 
                              ...prev, 
                              shippingAddress: { ...prev.shippingAddress, state: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <Input
                            placeholder="ZIP Code"
                            value={orderForm.shippingAddress.zipCode}
                            onChange={(e) => setOrderForm(prev => ({ 
                              ...prev, 
                              shippingAddress: { ...prev.shippingAddress, zipCode: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                          <Input
                            placeholder="Country"
                            value={orderForm.shippingAddress.country}
                            onChange={(e) => setOrderForm(prev => ({ 
                              ...prev, 
                              shippingAddress: { ...prev.shippingAddress, country: e.target.value }
                            }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                        <span className="text-white">Total:</span>
                        <span className="text-xl font-bold text-white">
                          ${(orderForm.quantity * 10).toFixed(2)}
                        </span>
                      </div>

                      <Button
                        onClick={handleOrder}
                        className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                      >
                        <CreditCard className="h-4 w-4 mr-2" />
                        Place Order
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredCards.length === 0 && (
          <div className="text-center text-white py-12">
            <Package className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-semibold mb-2">No fan cards found</h3>
            <p className="text-gray-300">Try adjusting your search terms</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FanCardMarketplace;
