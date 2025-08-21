
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogOverlay } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Mail, Package } from 'lucide-react';

interface FanCard {
  id: string;
  artwork_url: string;
  quantity: number;
  description: string | null;
  albums?: {
    title: string;
    user_id: string;
    profiles?: {
      client_name: string | null;
    } | null;
  } | null;
}

interface BuyMoreFanCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fanCard: FanCard;
  onOrderComplete: () => void;
}

const BuyMoreFanCardsDialog: React.FC<BuyMoreFanCardsDialogProps> = ({
  open,
  onOpenChange,
  fanCard,
  onOrderComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: 25, // Minimum quantity set to 25
    email: user?.email || '',
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  const handleInputChange = (field: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate minimum quantity
    if (formData.quantity < 25) {
      toast({
        title: "Invalid Quantity",
        description: "Minimum order quantity is 25 cards.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Calculate total amount (example pricing: $10 per card)
      const totalAmount = formData.quantity * 10;

      // Create order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          fan_card_id: fanCard.id,
          quantity: formData.quantity,
          total_amount: totalAmount,
          shipping_address: {
            name: formData.name,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            zipCode: formData.zipCode,
            country: formData.country
          },
          status: 'pending'
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Send order notification email
      const { error: emailError } = await supabase.functions.invoke('send-order-notification', {
        body: {
          orderId: order.id,
          userEmail: formData.email,
          userName: formData.name,
          fanCardTitle: `${fanCard.albums?.title} Fan Card`,
          quantity: formData.quantity,
          totalAmount: totalAmount,
          clientName: fanCard.albums?.profiles?.client_name || 'Unknown Artist'
        }
      });

      if (emailError) {
        console.warn('Failed to send email notification:', emailError);
        // Don't fail the order if email fails
      }

      toast({
        title: "Order Placed Successfully!",
        description: `Your order for ${formData.quantity} fan cards has been submitted. You'll receive a confirmation email shortly.`,
      });

      onOrderComplete();
      onOpenChange(false);

      // Reset form
      setFormData(prev => ({ ...prev, quantity: 25, name: '', address: '', city: '', state: '', zipCode: '' }));

    } catch (error) {
      console.error('Error placing order:', error);
      toast({
        title: "Order Failed",
        description: "There was an error placing your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogOverlay className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <DialogContent className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-[500px] max-h-[90vh] translate-x-[-50%] translate-y-[-50%] gap-4 border border-border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <ShoppingCart className="h-5 w-5" />
            Buy More Fan Cards
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fan Card Preview */}
          <div className="flex items-center gap-4 p-4 border border-border rounded-lg bg-muted/50">
            <img
              src={fanCard.artwork_url}
              alt="Fan card"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium text-foreground">{fanCard.albums?.profiles?.client_name || 'Unknown Artist'}</p>
              <p className="text-sm text-muted-foreground">
                {fanCard.albums?.title} Fan Card
              </p>
              {fanCard.description && (
                <p className="text-xs text-muted-foreground mt-1">
                  {fanCard.description}
                </p>
              )}
            </div>
          </div>

          {/* Order Details */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="quantity" className="text-foreground">Quantity to Order (Minimum: 25)</Label>
              <Input
                id="quantity"
                type="number"
                min="25"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 25)}
                required
                className="bg-background border-border text-foreground"
              />
              {formData.quantity < 25 && (
                <p className="text-sm text-red-500 mt-1">
                  Minimum quantity is 25 cards
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Price: $10 per card × {formData.quantity} = ${formData.quantity * 10}
              </p>
            </div>

            <div>
              <Label htmlFor="email" className="text-foreground">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="name" className="text-foreground">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div>
              <Label htmlFor="address" className="text-foreground">Street Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
                className="bg-background border-border text-foreground"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city" className="text-foreground">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="state" className="text-foreground">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode" className="text-foreground">ZIP Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
              <div>
                <Label htmlFor="country" className="text-foreground">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                  className="bg-background border-border text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium text-foreground">Order Process</p>
                <p className="text-muted-foreground">
                  After placing your order, our team will contact you within 48 hours with payment details and shipping information.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || formData.quantity < 25}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Package className="h-4 w-4 mr-2 animate-spin" />
                  Placing Order...
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Place Order
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BuyMoreFanCardsDialog;
