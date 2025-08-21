import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Upload, 
  Music, 
  Video, 
  CreditCard, 
  Package,
  CheckCircle,
  Clock,
  AlertCircle,
  Play,
  ShoppingCart,
  Eye
} from 'lucide-react';
import CreateFanCardForm from '@/components/fancard/CreateFanCardForm';
import UploadMusic from '@/components/music/UploadMusic';
import UploadVideo from '@/components/media/UploadVideo';
import SecureMusicPlayer from '@/components/media/SecureMusicPlayer';
import SecureVideoPlayer from '@/components/media/SecureVideoPlayer';
import OrderCardsDialog from '@/components/order/OrderCardsDialog';

interface Album {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
  user_id: string;
  created_at: string;
}

interface Track {
  id: string;
  title: string;
  file_url: string;
  duration: number | null;
  album_id: string;
  albums?: {
    title: string;
  };
}

interface Video {
  id: string;
  title: string;
  file_url: string;
  thumbnail_url: string | null;
  duration: number | null;
}

interface FanCard {
  id: string;
  artwork_url: string;
  description: string | null;
  quantity: number;
  status: string;
  created_at: string;
}

interface Order {
  id: string;
  quantity: number;
  total_amount: number;
  status: string;
  created_at: string;
  shipping_address: any;
  fan_cards?: {
    artwork_url: string;
    description: string | null;
  };
}

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [album, setAlbum] = useState<Album | null>(null);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('setup');
  const [selectedOrderCard, setSelectedOrderCard] = useState<FanCard | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState(0);

  useEffect(() => {
    if (id && user) {
      fetchProjectData();
    }
  }, [id, user]);

  const fetchProjectData = async () => {
    if (!id || !user) return;

    setLoading(true);
    try {
      // Fetch album/project data
      const { data: albumData, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', id)
        .single();

      if (albumError) throw albumError;
      setAlbum(albumData);

      // Fetch tracks
      const { data: tracksData, error: tracksError } = await supabase
        .from('tracks')
        .select('*')
        .eq('album_id', id)
        .order('title', { ascending: true });

      if (tracksError) throw tracksError;
      setTracks(tracksData || []);

      // Fetch videos
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_id', user.id)
        .order('title', { ascending: true });

      if (videosError) throw videosError;
      setVideos(videosData || []);

      // Fetch fan cards
      const { data: fanCardsData, error: fanCardsError } = await supabase
        .from('fan_cards')
        .select('*')
        .eq('album_id', id)
        .order('created_at', { ascending: false });

      if (fanCardsError) throw fanCardsError;
      setFanCards(fanCardsData || []);

      // Fetch orders for these fan cards
      if (fanCardsData && fanCardsData.length > 0) {
        const fanCardIds = fanCardsData.map(card => card.id);
        const { data: ordersData, error: ordersError } = await supabase
          .from('orders')
          .select(`
            *,
            fan_cards (
              artwork_url,
              description
            )
          `)
          .in('fan_card_id', fanCardIds)
          .order('created_at', { ascending: false });

        if (ordersError) throw ordersError;
        setOrders(ordersData || []);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOrderComplete = () => {
    console.log('Order completed - refreshing data...');
    fetchProjectData(); // Refresh data after order completion
    setOrderDialogOpen(false);
    setSelectedOrderCard(null);
    toast({
      title: "Order Placed!",
      description: "Your order has been placed successfully.",
    });
  };

  const openOrderDialog = (fanCard: FanCard) => {
    console.log('Opening order dialog for card:', fanCard.id);
    if (fanCard.status !== 'sucess') {
      toast({
        title: "Card Not Ready",
        description: "This card is still being processed and cannot be ordered yet.",
        variant: "destructive",
      });
      return;
    }
    setSelectedOrderCard(fanCard);
    setOrderDialogOpen(true);
  };

  const handleTrackEnd = () => {
    if (currentTrackIndex < tracks.length - 1) {
      setCurrentTrackIndex(currentTrackIndex + 1);
    }
  };

  const calculateProgress = () => {
    let completed = 0;
    const total = 4;

    if (album?.title && album.title !== '') completed++;
    if (tracks.length > 0) completed++;
    if (videos.length > 0) completed++;
    if (fanCards.length > 0) completed++;

    return (completed / total) * 100;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mb-4 mx-auto"></div>
          <p className="text-lg">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!album) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center">
        <div className="text-white text-center">
          <AlertCircle className="h-16 w-16 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/projects')} variant="outline" className="text-white border-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => navigate('/projects')}
              variant="ghost"
              className="text-white hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Projects
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">{album.title}</h1>
              {album.description && (
                <p className="text-gray-300 mt-1">{album.description}</p>
              )}
            </div>
          </div>
        </div>

        {/* Audio Player Section - Always visible when tracks exist */}
        {tracks.length > 0 && (
          <Card className="bg-card/10 backdrop-blur-lg border-border/20 mb-6">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Music className="h-5 w-5" />
                Now Playing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <SecureMusicPlayer
                track={{
                  ...tracks[currentTrackIndex],
                  albums: { title: album.title }
                }}
                onTrackEnd={handleTrackEnd}
              />
              
              {tracks.length > 1 && (
                <div className="mt-4 space-y-2">
                  <h4 className="text-card-foreground font-medium">Track List</h4>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {tracks.map((track, index) => (
                      <div
                        key={track.id}
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          index === currentTrackIndex
                            ? 'bg-primary/30 border border-primary'
                            : 'bg-muted/20 hover:bg-muted/30'
                        }`}
                        onClick={() => setCurrentTrackIndex(index)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <span className="text-xs font-medium text-primary-foreground">{index + 1}</span>
                          </div>
                          <p className="text-card-foreground text-sm">{track.title}</p>
                          {index === currentTrackIndex && (
                            <div className="ml-auto flex items-center gap-1">
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-100"></div>
                              <div className="w-1 h-1 bg-primary rounded-full animate-pulse delay-200"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white/10 border-white/20">
            <TabsTrigger value="setup" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Setup
            </TabsTrigger>
            <TabsTrigger value="content" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Content
            </TabsTrigger>
            <TabsTrigger value="inventory" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Inventory
            </TabsTrigger>
            <TabsTrigger value="media" className="data-[state=active]:bg-white data-[state=active]:text-purple-900">
              Media Player
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Project Setup Progress
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-white">
                    <span>Overall Progress</span>
                    <span>{Math.round(calculateProgress())}%</span>
                  </div>
                  <Progress value={calculateProgress()} className="h-2" />
                </div>

                <div className="grid gap-4">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${album?.title ? 'text-green-400' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-white">Project Details</p>
                        <p className="text-sm text-gray-300">Set up your project name and description</p>
                      </div>
                    </div>
                    <Badge variant={album?.title ? "default" : "secondary"}>
                      {album?.title ? "Complete" : "Pending"}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${tracks.length > 0 ? 'text-green-400' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-white">Upload Music</p>
                        <p className="text-sm text-gray-300">Add audio tracks to your project</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={tracks.length > 0 ? "default" : "secondary"}>
                        {tracks.length > 0 ? `${tracks.length} tracks` : "No tracks"}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('content')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {tracks.length > 0 ? 'Manage' : 'Upload'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${videos.length > 0 ? 'text-green-400' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-white">Upload Videos</p>
                        <p className="text-sm text-gray-300">Add video content to your project</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={videos.length > 0 ? "default" : "secondary"}>
                        {videos.length > 0 ? `${videos.length} videos` : "No videos"}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('content')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {videos.length > 0 ? 'Manage' : 'Upload'}
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      <CheckCircle className={`h-5 w-5 ${fanCards.length > 0 ? 'text-green-400' : 'text-gray-400'}`} />
                      <div>
                        <p className="font-medium text-white">Create Fan Cards</p>
                        <p className="text-sm text-gray-300">Design and create your fan cards</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={fanCards.length > 0 ? "default" : "secondary"}>
                        {fanCards.length > 0 ? `${fanCards.length} cards` : "No cards"}
                      </Badge>
                      <Button 
                        size="sm" 
                        onClick={() => setActiveTab('inventory')}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {fanCards.length > 0 ? 'Manage' : 'Create'}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Music className="h-5 w-5" />
                    Upload Music
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadMusic />
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Upload Videos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <UploadVideo onUploadComplete={fetchProjectData} />
                </CardContent>
              </Card>
            </div>

            {/* Display uploaded content */}
            {tracks.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Uploaded Tracks</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tracks.map((track) => (
                      <div key={track.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Music className="h-4 w-4 text-purple-400" />
                        <span className="text-white flex-1">{track.title}</span>
                        <Button size="sm" variant="ghost" className="text-purple-400">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {videos.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white">Uploaded Videos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {videos.map((video) => (
                      <div key={video.id} className="flex items-center gap-3 p-3 rounded-lg bg-white/5">
                        <Video className="h-4 w-4 text-purple-400" />
                        <span className="text-white flex-1">{video.title}</span>
                        <Button size="sm" variant="ghost" className="text-purple-400">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            {/* Create New Fan Card */}
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Create New Fan Card
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CreateFanCardForm albumId={id!} onCardCreated={fetchProjectData} />
              </CardContent>
            </Card>

            {/* Fan Cards Grid */}
            {fanCards.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Fan Cards ({fanCards.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {fanCards.map((card) => (
                      <div key={card.id} className="bg-white/5 rounded-lg p-4 space-y-3">
                        <div className="aspect-square rounded-lg overflow-hidden bg-white/10">
                          <img
                            src={card.artwork_url}
                            alt="Fan card artwork"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Badge 
                              variant={card.status === 'sucess' ? 'default' : 'secondary'}
                              className={card.status === 'sucess' ? 'bg-green-600' : ''}
                            >
                              {card.status === 'sucess' ? 'Ready' : 'Processing'}
                            </Badge>
                            <span className="text-sm text-gray-300">
                              Qty: {card.quantity}
                            </span>
                          </div>
                          {card.description && (
                            <p className="text-sm text-gray-300 line-clamp-2">
                              {card.description}
                            </p>
                          )}
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => {
                                console.log('Order Cards button clicked for card:', card.id, 'status:', card.status);
                                openOrderDialog(card);
                              }}
                              disabled={card.status !== 'sucess'}
                            >
                              <ShoppingCart className="h-4 w-4 mr-1" />
                              {card.status === 'sucess' ? 'Order Cards' : 'Processing...'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders List */}
            {orders.length > 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Recent Orders ({orders.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex gap-4">
                            {order.fan_cards?.artwork_url && (
                              <div className="w-16 h-16 rounded-lg overflow-hidden bg-white/10 flex-shrink-0">
                                <img
                                  src={order.fan_cards.artwork_url}
                                  alt="Fan card"
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            )}
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={order.status === 'completed' ? 'default' : 'secondary'}
                                  className={
                                    order.status === 'completed' ? 'bg-green-600' :
                                    order.status === 'processing' ? 'bg-blue-600' : ''
                                  }
                                >
                                  {order.status}
                                </Badge>
                                <span className="text-sm text-gray-300">
                                  Order #{order.id.slice(0, 8)}
                                </span>
                              </div>
                              <p className="text-white font-medium">
                                {order.quantity} cards × ${(order.total_amount / order.quantity).toFixed(2)} = ${order.total_amount.toFixed(2)}
                              </p>
                              <p className="text-sm text-gray-300">
                                Ordered on {new Date(order.created_at).toLocaleDateString()}
                              </p>
                              {order.shipping_address && (
                                <p className="text-xs text-gray-400">
                                  Shipping to: {order.shipping_address.name}, {order.shipping_address.city}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-1 text-gray-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">
                              {new Date(order.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {fanCards.length === 0 && (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="text-center py-12">
                  <CreditCard className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">No Fan Cards Yet</h3>
                  <p className="text-gray-300 mb-4">Create your first fan card to get started</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Media Player Tab */}
          <TabsContent value="media" className="space-y-6">
            {tracks.length > 0 || videos.length > 0 ? (
              <div className="grid gap-6">
                {/* Audio Player Section */}
                {tracks.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Music className="h-5 w-5" />
                        Audio Player
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SecureMusicPlayer
                        track={{
                          ...tracks[currentTrackIndex],
                          albums: { title: album.title }
                        }}
                        onTrackEnd={handleTrackEnd}
                      />
                      
                      {tracks.length > 1 && (
                        <div className="space-y-2">
                          <h4 className="text-white font-medium">Track List</h4>
                          <div className="space-y-1 max-h-64 overflow-y-auto">
                            {tracks.map((track, index) => (
                              <div
                                key={track.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  index === currentTrackIndex
                                    ? 'bg-purple-600/30 border border-purple-500'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                                onClick={() => setCurrentTrackIndex(index)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center">
                                    <span className="text-sm font-medium">{index + 1}</span>
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-white font-medium">{track.title}</p>
                                  </div>
                                  {index === currentTrackIndex && (
                                    <div className="flex items-center gap-1">
                                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse"></div>
                                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-100"></div>
                                      <div className="w-1 h-1 bg-purple-400 rounded-full animate-pulse delay-200"></div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Video Player Section */}
                {videos.length > 0 && (
                  <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Video className="h-5 w-5" />
                        Video Player
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <SecureVideoPlayer
                        video={videos[selectedVideoIndex]}
                      />
                      
                      {videos.length > 1 && (
                        <div className="space-y-2">
                          <h4 className="text-white font-medium">Video List</h4>
                          <div className="grid gap-2 md:grid-cols-2">
                            {videos.map((video, index) => (
                              <div
                                key={video.id}
                                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                                  index === selectedVideoIndex
                                    ? 'bg-purple-600/30 border border-purple-500'
                                    : 'bg-white/5 hover:bg-white/10'
                                }`}
                                onClick={() => setSelectedVideoIndex(index)}
                              >
                                <div className="flex items-center gap-3">
                                  {video.thumbnail_url ? (
                                    <img
                                      src={video.thumbnail_url}
                                      alt={video.title}
                                      className="w-12 h-8 object-cover rounded"
                                    />
                                  ) : (
                                    <div className="w-12 h-8 bg-gray-600 rounded flex items-center justify-center">
                                      <Video className="h-4 w-4 text-gray-400" />
                                    </div>
                                  )}
                                  <div className="flex-1">
                                    <p className="text-white font-medium text-sm">{video.title}</p>
                                  </div>
                                  {index === selectedVideoIndex && (
                                    <Eye className="h-4 w-4 text-purple-400" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Card className="bg-white/10 backdrop-blur-lg border-white/20">
                <CardContent className="text-center py-12">
                  <div className="flex justify-center mb-4">
                    <div className="flex gap-2">
                      <Music className="h-8 w-8 text-gray-400" />
                      <Video className="h-8 w-8 text-gray-400" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2">No Media Content</h3>
                  <p className="text-gray-300 mb-4">Upload some music or videos to use the media player</p>
                  <Button 
                    onClick={() => setActiveTab('content')}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Content
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>

        {/* Order Dialog */}
        {selectedOrderCard && (
          <OrderCardsDialog
            open={orderDialogOpen}
            onOpenChange={(open) => {
              console.log('Order dialog open state changed:', open);
              setOrderDialogOpen(open);
              if (!open) {
                setSelectedOrderCard(null);
              }
            }}
            fanCard={selectedOrderCard}
            onOrderComplete={handleOrderComplete}
          />
        )}
      </div>
    </div>
  );
};

export default ProjectDetailPage;
