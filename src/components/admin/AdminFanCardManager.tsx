
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Plus, Search, Package, User, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface FanCard {
  id: string;
  user_id: string;
  album_id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  client_name?: string;
  album_title?: string;
}

interface User {
  id: string;
  client_name: string | null;
}

interface Album {
  id: string;
  title: string;
  user_id: string;
}

const AdminFanCardManager: React.FC = () => {
  const { toast } = useToast();
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedCard, setSelectedCard] = useState<FanCard | null>(null);

  // Create form state
  const [createForm, setCreateForm] = useState({
    userId: '',
    albumId: '',
    quantity: '500',
    description: '',
    artworkFile: null as File | null
  });

  // Order form state
  const [orderForm, setOrderForm] = useState({
    quantity: '1',
    shippingAddress: {
      name: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Fetch fan cards with separate queries to avoid relation issues
      const { data: fanCardsData, error: fanCardsError } = await supabase
        .from('fan_cards')
        .select('*')
        .order('created_at', { ascending: false });

      if (fanCardsError) throw fanCardsError;

      // Fetch all users/profiles
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, client_name')
        .order('client_name', { ascending: true });

      if (usersError) throw usersError;

      // Fetch all albums
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('id, title, user_id')
        .order('title', { ascending: true });

      if (albumsError) throw albumsError;

      // Enrich fan cards with client and album info
      const enrichedFanCards = fanCardsData?.map(card => {
        const user = usersData?.find(u => u.id === card.user_id);
        const album = albumsData?.find(a => a.id === card.album_id);
        return {
          ...card,
          client_name: user?.client_name || 'Unknown Client',
          album_title: album?.title || 'Unknown Album'
        };
      }) || [];

      setFanCards(enrichedFanCards);
      setUsers(usersData || []);
      setAlbums(albumsData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFanCard = async () => {
    if (!createForm.userId || !createForm.albumId || !createForm.artworkFile) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and select an artwork file.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Upload artwork file
      const fileExt = createForm.artworkFile.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `fan-cards/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('artwork')
        .upload(filePath, createForm.artworkFile);

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artwork')
        .getPublicUrl(filePath);

      const artworkUrl = publicUrl;

      // Create fan card
      const { error: fanCardError } = await supabase
        .from('fan_cards')
        .insert({
          user_id: createForm.userId,
          album_id: createForm.albumId,
          artwork_url: artworkUrl,
          quantity: parseInt(createForm.quantity),
          description: createForm.description || null,
        });

      if (fanCardError) throw fanCardError;

      toast({
        title: "Success",
        description: "Fan card created successfully!",
      });

      // Reset form and refresh data
      setCreateForm({
        userId: '',
        albumId: '',
        quantity: '500',
        description: '',
        artworkFile: null
      });
      setShowCreateForm(false);
      fetchData();
    } catch (error) {
      console.error('Error creating fan card:', error);
      toast({
        title: "Error",
        description: "Failed to create fan card.",
        variant: "destructive",
      });
    }
  };

  const handleCreateOrder = async () => {
    if (!selectedCard) return;

    try {
      const { error } = await supabase
        .from('orders')
        .insert({
          user_id: selectedCard.user_id,
          fan_card_id: selectedCard.id,
          quantity: parseInt(orderForm.quantity),
          shipping_address: orderForm.shippingAddress,
          status: 'pending',
          total_amount: 0 // This would be calculated based on pricing
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order created successfully!",
      });

      setShowOrderForm(false);
      setSelectedCard(null);
      setOrderForm({
        quantity: '1',
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
      console.error('Error creating order:', error);
      toast({
        title: "Error",
        description: "Failed to create order.",
        variant: "destructive",
      });
    }
  };

  const filteredFanCards = fanCards.filter(card => {
    const matchesSearch = card.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         card.album_title?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = selectedUser === '' || card.user_id === selectedUser;
    return matchesSearch && matchesUser;
  });

  const getUserAlbums = (userId: string) => {
    return albums.filter(album => album.user_id === userId);
  };

  if (loading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-foreground text-center">Loading fan cards...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground-dark flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            Fan Card Management ({filteredFanCards.length} cards)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name or album..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-48 bg-background border-border text-foreground">
                <SelectValue placeholder="Filter by client" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Clients</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.client_name || 'Unnamed Client'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button 
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Fan Card
            </Button>
          </div>

          {/* Fan Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFanCards.map((card) => (
              <Card key={card.id} className="bg-muted/50 border-border">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <img
                      src={card.artwork_url}
                      alt="Fan card artwork"
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="text-foreground-dark font-semibold">
                        {card.album_title}
                      </h3>
                      <p className="text-foreground text-sm">
                        Client: {card.client_name}
                      </p>
                      <p className="text-foreground text-sm">
                        Quantity: {card.quantity}
                      </p>
                      {card.description && (
                        <p className="text-muted-foreground text-xs mt-1 line-clamp-2">
                          {card.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedCard(card);
                        setShowOrderForm(true);
                      }}
                      className="flex-1 bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                    >
                      <ShoppingCart className="h-4 w-4 mr-1" />
                      Create Order
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredFanCards.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No fan cards found matching your criteria.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Fan Card Modal */}
      {showCreateForm && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground-dark">Create New Fan Card</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="user">Select Client</Label>
              <Select value={createForm.userId} onValueChange={(value) => setCreateForm({...createForm, userId: value, albumId: ''})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.client_name || 'Unnamed Client'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="album">Select Album</Label>
              <Select 
                value={createForm.albumId} 
                onValueChange={(value) => setCreateForm({...createForm, albumId: value})}
                disabled={!createForm.userId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an album" />
                </SelectTrigger>
                <SelectContent>
                  {getUserAlbums(createForm.userId).map((album) => (
                    <SelectItem key={album.id} value={album.id}>
                      {album.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="artwork">Upload Artwork</Label>
              <Input
                id="artwork"
                type="file"
                accept="image/*"
                onChange={(e) => setCreateForm({...createForm, artworkFile: e.target.files?.[0] || null})}
              />
            </div>

            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={createForm.quantity}
                onChange={(e) => setCreateForm({...createForm, quantity: e.target.value})}
              />
            </div>

            <div>
              <Label htmlFor="description">Description (Optional)</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({...createForm, description: e.target.value})}
                placeholder="Enter fan card description"
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateFanCard} className="flex-1">
                Create Fan Card
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Order Modal */}
      {showOrderForm && selectedCard && (
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground-dark">Create Order for {selectedCard.album_title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Client: {selectedCard.client_name}</Label>
            </div>

            <div>
              <Label htmlFor="orderQuantity">Quantity</Label>
              <Input
                id="orderQuantity"
                type="number"
                min="1"
                value={orderForm.quantity}
                onChange={(e) => setOrderForm({...orderForm, quantity: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Shipping Address</Label>
              <Input
                placeholder="Full Name"
                value={orderForm.shippingAddress.name}
                onChange={(e) => setOrderForm({
                  ...orderForm, 
                  shippingAddress: {...orderForm.shippingAddress, name: e.target.value}
                })}
              />
              <Input
                placeholder="Address"
                value={orderForm.shippingAddress.address}
                onChange={(e) => setOrderForm({
                  ...orderForm, 
                  shippingAddress: {...orderForm.shippingAddress, address: e.target.value}
                })}
              />
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="City"
                  value={orderForm.shippingAddress.city}
                  onChange={(e) => setOrderForm({
                    ...orderForm, 
                    shippingAddress: {...orderForm.shippingAddress, city: e.target.value}
                  })}
                />
                <Input
                  placeholder="State"
                  value={orderForm.shippingAddress.state}
                  onChange={(e) => setOrderForm({
                    ...orderForm, 
                    shippingAddress: {...orderForm.shippingAddress, state: e.target.value}
                  })}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  placeholder="ZIP Code"
                  value={orderForm.shippingAddress.zipCode}
                  onChange={(e) => setOrderForm({
                    ...orderForm, 
                    shippingAddress: {...orderForm.shippingAddress, zipCode: e.target.value}
                  })}
                />
                <Input
                  placeholder="Country"
                  value={orderForm.shippingAddress.country}
                  onChange={(e) => setOrderForm({
                    ...orderForm, 
                    shippingAddress: {...orderForm.shippingAddress, country: e.target.value}
                  })}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCreateOrder} className="flex-1">
                Create Order
              </Button>
              <Button variant="outline" onClick={() => {
                setShowOrderForm(false);
                setSelectedCard(null);
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminFanCardManager;
