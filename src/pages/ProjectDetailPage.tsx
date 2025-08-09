
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Calendar, CreditCard, Plus, ShoppingCart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import CreateFanCardForm from '@/components/fancard/CreateFanCardForm';
import OrderCardsDialog from '@/components/order/OrderCardsDialog';

interface Project {
  id: string;
  title: string;
  description: string | null;
  created_at: string;
  artwork_url: string | null;
}

interface FanCard {
  id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  created_at: string;
  status: string;
  purchased: boolean;
}

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [project, setProject] = useState<Project | null>(null);
  const [fanCards, setFanCards] = useState<FanCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<FanCard | null>(null);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);

  useEffect(() => {
    if (projectId && user) {
      fetchProjectData();
    }
  }, [projectId, user]);

  const fetchProjectData = async () => {
    try {
      // Fetch project details
      const { data: projectData, error: projectError } = await supabase
        .from('albums')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', user?.id)
        .single();

      if (projectError) throw projectError;
      setProject(projectData);

      // Fetch fan cards for this project - including status and purchased columns
      const { data: fanCardsData, error: fanCardsError } = await supabase
        .from('fan_cards')
        .select('*')
        .eq('album_id', projectId)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (fanCardsError) throw fanCardsError;
      setFanCards(fanCardsData || []);

    } catch (error) {
      console.error('Error fetching project data:', error);
      toast({
        title: "Error",
        description: "Failed to load project details.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (cardId: string) => {
    navigate(`/card/${cardId}`);
  };

  const handleCardCreated = () => {
    fetchProjectData();
  };

  const handleOrderClick = (card: FanCard) => {
    setSelectedCard(card);
    setOrderDialogOpen(true);
  };

  const handleOrderComplete = () => {
    fetchProjectData();
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading project...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <h1 className="text-2xl font-bold mb-4">Project Not Found</h1>
            <p className="text-muted-foreground mb-4">
              The project you're looking for doesn't exist or you don't have access to it.
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
              onClick={() => navigate('/projects')}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-6">
            {project?.artwork_url && (
              <img
                src={project.artwork_url}
                alt={project.title}
                className="w-48 h-48 object-cover rounded-lg shadow-lg"
              />
            )}
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground-dark mb-2">
                {project?.title}
              </h1>
              {project?.description && (
                <p className="text-lg text-muted-foreground mb-4">
                  {project.description}
                </p>
              )}
              <div className="flex items-center gap-2 text-muted-foreground mb-4">
                <Calendar className="h-4 w-4" />
                Created on {project && formatDate(project.created_at)}
              </div>
              <Button 
                onClick={() => navigate(`/create-card/${projectId}`)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create New Card
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Fan Cards Grid */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Create New Card Form */}
          <CreateFanCardForm 
            albumId={projectId!} 
            onCardCreated={handleCardCreated} 
          />

          {/* Fan Cards Section */}
          <div>
            <h2 className="text-2xl font-bold text-foreground-dark mb-2">Fan Cards</h2>
            <p className="text-muted-foreground mb-6">
              Manage your NFC fan cards for this project
            </p>

            {fanCards.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-foreground-dark mb-2">
                  No fan cards yet
                </h3>
                <p className="text-muted-foreground mb-6">
                  Create your first fan card using the form above
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {fanCards.map((card) => (
                  <Card 
                    key={card.id}
                    className="cursor-pointer transition-all duration-200 hover:shadow-lg"
                    onClick={() => handleCardClick(card.id)}
                  >
                    <CardHeader className="p-0">
                      <img
                        src={card.artwork_url}
                        alt="Fan card artwork"
                        className={`w-full h-48 object-cover rounded-t-lg ${
                          card.status === 'pending' ? 'filter grayscale' : ''
                        }`}
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <Badge className={getStatusColor(card.status || 'pending')}>
                          {card.status || 'pending'}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          {card.quantity} cards
                        </span>
                      </div>
                      
                      {card.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {card.description}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formatDate(card.created_at)}
                        </div>
                      </div>

                      {!card.purchased && card.status !== 'shipped' && (
                        <Button
                          size="sm"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOrderClick(card);
                          }}
                        >
                          <ShoppingCart className="h-4 w-4 mr-2" />
                          Order Cards
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Order Dialog */}
      {selectedCard && (
        <OrderCardsDialog
          open={orderDialogOpen}
          onOpenChange={setOrderDialogOpen}
          fanCard={selectedCard}
          onOrderComplete={handleOrderComplete}
        />
      )}
    </div>
  );
};

export default ProjectDetailPage;
