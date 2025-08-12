
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, ShoppingCart, Package, Edit, CreditCard, MapPin, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import OrderCardsDialog from '@/components/order/OrderCardsDialog';
import BuyMoreFanCardsDialog from '@/components/dashboard/BuyMoreFanCardsDialog';

interface FanCard {
  id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  status: string;
  purchased: boolean;
  album_id: string;
}

interface Project {
  id: string;
  title: string;
  description: string | null;
  artwork_url: string | null;
}

const CardDetailPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fanCard, setFanCard] = useState<FanCard | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [buyMoreDialogOpen, setBuyMoreDialogOpen] = useState(false);

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
        .select('*')
        .eq('id', cardId)
        .eq('user_id', user?.id)
        .single();

      if (cardError) throw cardError;
      setFanCard(cardData);

      // Fetch associated project details
      const { data: projectData, error: projectError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', cardData.album_id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  const isCardApproved = (card: FanCard) => {
    return card.status === 'completed' || card.status === 'shipped';
  };

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

  if (!fanCard || !project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Card Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The fan card you're looking for doesn't exist or you don't have access to it.
            </p>
            <Button onClick={() => navigate('/projects')}>
              Back to Projects
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
              onClick={() => navigate(`/project/${project.id}`)}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-1/3">
              <img
                src={fanCard.artwork_url}
                alt="Fan card artwork"
                className={`w-full aspect-square object-cover rounded-lg shadow-lg ${
                  !isCardApproved(fanCard) ? 'filter grayscale' : ''
                }`}
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
                Fan Card for "{project.title}"
              </h1>
              
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
                {!fanCard.purchased && fanCard.status !== 'shipped' && (
                  <Button
                    onClick={() => setOrderDialogOpen(true)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Order Cards
                  </Button>
                )}

                <Button
                  onClick={() => setBuyMoreDialogOpen(true)}
                  variant="outline"
                  className="border-primary text-primary hover:bg-primary/10"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Buy More Cards
                </Button>
                
                {fanCard.status === 'shipped' && (
                  <div className="flex items-center gap-2 text-green-600">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Cards have been shipped!</span>
                  </div>
                )}
                
                <Button variant="outline">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Card
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card Details */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Project Information */}
          <Card>
            <CardHeader>
              <CardTitle>Associated Project</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {project.artwork_url && (
                  <img
                    src={project.artwork_url}
                    alt={project.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div>
                  <h3 className="font-semibold">{project.title}</h3>
                  {project.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full mt-4"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                View Project
              </Button>
            </CardContent>
          </Card>

          {/* Card Information */}
          <Card>
            <CardHeader>
              <CardTitle>Card Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge className={getStatusColor(fanCard.status)}>
                  {fanCard.status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Quantity</p>
                <p className="text-2xl font-bold">{fanCard.quantity}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(fanCard.created_at)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rural Cards and Registered Cards Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Rural Cards Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Rural Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Cards distributed in rural areas and remote locations.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Rural Cards:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Activity:</span>
                  <span className="font-medium">Never</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Registered Cards Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Registered Cards
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Cards that have been registered by end users.
              </p>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total Registered:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Active Users:</span>
                  <span className="font-medium">0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Last Registration:</span>
                  <span className="font-medium">Never</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Order Dialog */}
      {fanCard && (
        <OrderCardsDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          fanCard={fanCard}
          onOrderComplete={handleOrderComplete}
        />
      )}

      {/* Buy More Cards Dialog */}
      {fanCard && (
        <BuyMoreFanCardsDialog
          open={buyMoreDialogOpen}
          onOpenChange={setBuyMoreDialogOpen}
          fanCard={{
            ...fanCard,
            albums: {
              title: project.title,
              user_id: user?.id || '',
              profiles: {
                client_name: user?.email?.split('@')[0] || 'Unknown Client'
              }
            }
          }}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </div>
  );
};

export default CardDetailPage;
