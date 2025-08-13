import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, ShoppingCart, Package, Edit, CreditCard, Music, Users, History } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BuyMoreFanCardsDialog from '@/components/dashboard/BuyMoreFanCardsDialog';
import EditFanCardDialog from '@/components/fancard/EditFanCardDialog';

interface FanCard {
  id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  status: string;
  purchased: boolean;
  album_id: string;
  albums?: {
    title: string;
    user_id: string;
    artist_name: string | null;
    description: string | null;
    artwork_url: string | null;
    profiles?: {
      client_name: string | null;
    } | null;
  } | null;
}

interface Track {
  id: string;
  title: string;
  duration: number | null;
  file_url: string;
}

interface Order {
  id: string;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
}

const FanCardDetailPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fanCard, setFanCard] = useState<FanCard | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [buyMoreDialogOpen, setBuyMoreDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  useEffect(() => {
    if (cardId && user) {
      fetchCardData();
    }
  }, [cardId, user]);

  const fetchCardData = async () => {
    try {
      // Fetch fan card details
      const { data: cardData, error: cardError } = await supabase
        .from('fan_cards')
        .select(`
          *,
          albums (
            title,
            user_id,
            artist_name,
            description,
            artwork_url,
            profiles (
              client_name
            )
          )
        `)
        .eq('id', cardId)
        .eq('user_id', user?.id)
        .single();

      if (cardError) throw cardError;
      setFanCard(cardData);

      // Fetch tracks from the associated album
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', cardData.album_id)
        .order('title');

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);

      // Fetch orders for this fan card
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .eq('fan_card_id', cardId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

    } catch (error) {
      console.error('Error fetching card data:', error);
      toast({
        title: "Error",
        description: "Failed to load card details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderComplete = () => {
    fetchCardData();
  };

  const handleCardUpdated = () => {
    fetchCardData();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const totalOrderedCards = orders.reduce((sum, order) => sum + order.quantity, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading card details...</p>
        </div>
      </div>
    );
  }

  if (!fanCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Card Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The fan card you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/dashboard')}>
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-start gap-4 mb-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <img
                src={fanCard.artwork_url}
                alt="Fan card artwork"
                className="w-full aspect-square object-cover rounded-lg shadow-lg"
              />
            </div>
            
            <div className="lg:w-2/3">
              <div className="flex items-center gap-4 mb-4">
                <Badge className={getStatusColor(fanCard.status)}>
                  {fanCard.status}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {fanCard.quantity} cards available
                </span>
              </div>
              
              <h1 className="text-3xl md:text-4xl font-bold text-foreground-dark mb-4">
                Fan Card for "{fanCard.albums?.title}"
              </h1>
              
              <p className="text-lg text-muted-foreground mb-2">
                Artist: {fanCard.albums?.artist_name || fanCard.albums?.profiles?.client_name || 'Unknown Artist'}
              </p>
              
              {fanCard.description && (
                <p className="text-lg text-muted-foreground mb-6">
                  {fanCard.description}
                </p>
              )}
              
              <div className="flex items-center gap-2 text-muted-foreground mb-8">
                <Calendar className="h-4 w-4" />
                Created on {formatDate(fanCard.created_at)}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <Button
                  onClick={() => setBuyMoreDialogOpen(true)}
                  className="bg-primary hover:bg-primary/90"
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Order More Cards
                </Button>
                
                <Button variant="outline" onClick={() => setEditDialogOpen(true)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="h-5 w-5" />
                Order History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-lg">
                  <p className="text-sm text-muted-foreground">Total Cards Ordered</p>
                  <p className="text-2xl font-bold">{totalOrderedCards}</p>
                </div>
                
                {orders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-4">
                    No orders placed yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="font-medium">{order.quantity} cards</p>
                            <p className="text-sm text-muted-foreground">
                              ${order.total_amount}
                            </p>
                          </div>
                          <Badge className={getStatusColor(order.status)}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ordered on {formatDate(order.created_at)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Album Tracks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Album Tracks ({tracks.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {tracks.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  No tracks available
                </p>
              ) : (
                <div className="space-y-3">
                  {tracks.map((track, index) => (
                    <div key={track.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-muted-foreground w-6">
                          {index + 1}
                        </span>
                        <div>
                          <p className="font-medium">{track.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDuration(track.duration)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Album Information */}
          <Card>
            <CardHeader>
              <CardTitle>Album Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {fanCard.albums?.artwork_url && (
                  <img
                    src={fanCard.albums.artwork_url}
                    alt={fanCard.albums.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{fanCard.albums?.title}</h3>
                  <p className="text-sm text-muted-foreground">
                    {fanCard.albums?.artist_name || fanCard.albums?.profiles?.client_name}
                  </p>
                  {fanCard.albums?.description && (
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                      {fanCard.albums.description}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Card Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Available Cards</p>
                <p className="text-2xl font-bold">{fanCard.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Ordered</p>
                <p className="text-2xl font-bold">{totalOrderedCards}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(fanCard.status)}>
                  {fanCard.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Buy More Cards Dialog */}
      {fanCard && (
        <BuyMoreFanCardsDialog
          open={buyMoreDialogOpen}
          onOpenChange={setBuyMoreDialogOpen}
          fanCard={fanCard}
          onOrderComplete={handleOrderComplete}
        />
      )}

      {/* Edit Fan Card Dialog */}
      {fanCard && (
        <EditFanCardDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          fanCard={fanCard}
          onCardUpdated={handleCardUpdated}
        />
      )}
    </div>
  );
};

export default FanCardDetailPage;
