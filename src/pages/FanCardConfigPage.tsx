
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ShoppingCart, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import FanCardPreview from '@/components/fancard/FanCardPreview';
import CardTypeSelector, { CardType } from '@/components/fancard/CardTypeSelector';

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
  };
}

const FanCardConfigPage: React.FC = () => {
  const { cardId } = useParams<{ cardId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [fanCard, setFanCard] = useState<FanCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCardType, setSelectedCardType] = useState<CardType | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (cardId && user) {
      fetchCardData();
    }
  }, [cardId, user]);

  const fetchCardData = async () => {
    try {
      const { data: cardData, error: cardError } = await supabase
        .from('fan_cards')
        .select(`
          *,
          albums (
            title,
            user_id
          )
        `)
        .eq('id', cardId)
        .eq('user_id', user?.id)
        .single();

      if (cardError) throw cardError;
      setFanCard(cardData);

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

  const handleSubmitOrder = async () => {
    if (!fanCard || !selectedCardType || !user) {
      toast({
        title: "Missing Information",
        description: "Please select a card type before submitting your order.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create order record
      const { error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fan_card_id: fanCard.id,
          quantity: fanCard.quantity,
          status: 'pending',
          total_amount: 0, // TBD - pricing will be determined by card type
          shipping_address: {
            card_type: selectedCardType,
            special_instructions: `Card Type: ${selectedCardType}`
          }
        });

      if (orderError) throw orderError;

      // Update fan card status
      const { error: updateError } = await supabase
        .from('fan_cards')
        .update({
          status: 'pending',
          purchased: true
        })
        .eq('id', fanCard.id)
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Send notification to Tapyoca Support (placeholder for email/webhook)
      const { error: notificationError } = await supabase.functions.invoke('send-order-notification', {
        body: {
          orderId: fanCard.id,
          userEmail: user.email,
          userName: user.email?.split('@')[0] || 'User',
          fanCardTitle: `${fanCard.albums?.title || 'Project'} - Fan Card`,
          cardType: selectedCardType,
          quantity: fanCard.quantity,
          artworkUrl: fanCard.artwork_url
        }
      });

      if (notificationError) {
        console.warn('Failed to send notification to support:', notificationError);
        // Don't fail the order if notification fails
      }

      toast({
        title: "Order Submitted Successfully!",
        description: "Your fan card order has been sent to Tapyoca Support for processing. You'll be notified once it's approved and shipped.",
      });

      // Navigate back to project detail page
      navigate(`/projects/${fanCard.album_id}`);

    } catch (error) {
      console.error('Error submitting order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error submitting your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoBack = () => {
    if (fanCard?.album_id) {
      navigate(`/projects/${fanCard.album_id}`);
    } else {
      navigate('/projects');
    }
  };

  const canSubmitOrder = () => {
    return fanCard && !fanCard.purchased && selectedCardType && fanCard.status !== 'shipped';
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

  if (!fanCard) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="text-center p-6">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
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
              onClick={handleGoBack}
              className="mt-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Project
            </Button>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground">
              Configure Fan Card
            </h1>
            <p className="text-lg text-muted-foreground">
              Review your artwork and select the card type for "{fanCard.albums?.title}"
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Card Preview */}
        <FanCardPreview fanCard={fanCard} />

        {/* Card Type Selection */}
        {!fanCard.purchased && fanCard.status !== 'shipped' && (
          <Card>
            <CardHeader>
              <CardTitle>Select Card Type</CardTitle>
              <p className="text-muted-foreground">
                Choose how your NFC card will function when tapped by users. 
                This determines the user experience and capabilities of your physical card.
              </p>
            </CardHeader>
            <CardContent>
              <CardTypeSelector
                selectedType={selectedCardType}
                onTypeSelect={setSelectedCardType}
              />
            </CardContent>
          </Card>
        )}

        {/* Order Summary & Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Card Quantity</p>
                <p className="text-2xl font-bold">{fanCard.quantity} cards</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selected Type</p>
                <p className="text-lg font-medium">
                  {selectedCardType || (fanCard.purchased ? 'Previously Selected' : 'None Selected')}
                </p>
              </div>
            </div>

            {fanCard.purchased ? (
              <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Order Already Submitted</p>
                  <p className="text-sm text-green-600">
                    Your order has been sent to Tapyoca Support and is being processed.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">What happens next?</h4>
                  <ol className="text-sm text-muted-foreground space-y-1">
                    <li>1. Your order will be sent to Tapyoca Support</li>
                    <li>2. Our team will review and approve your card design</li>
                    <li>3. Physical cards will be manufactured and shipped</li>
                    <li>4. You'll receive tracking information once shipped</li>
                    <li>5. Cards become active once you receive them</li>
                  </ol>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleSubmitOrder}
                    disabled={!canSubmitOrder() || isSubmitting}
                    className="flex-1"
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Submitting Order...' : 'Submit Order'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FanCardConfigPage;
