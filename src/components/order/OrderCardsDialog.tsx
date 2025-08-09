
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ShoppingCart, Mail, Package } from 'lucide-react';

interface OrderCardsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fanCard: {
    id: string;
    artwork_url: string;
    quantity: number;
    description: string | null;
  };
  onOrderComplete: () => void;
}

const OrderCardsDialog: React.FC<OrderCardsDialogProps> = ({
  open,
  onOpenChange,
  fanCard,
  onOrderComplete
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    quantity: fanCard.quantity,
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
          fanCardTitle: `Fan Card (${formData.quantity} cards)`,
          quantity: formData.quantity,
          totalAmount: totalAmount
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
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Order Fan Cards
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fan Card Preview */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <img
              src={fanCard.artwork_url}
              alt="Fan card"
              className="w-16 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <p className="font-medium">Fan Card</p>
              <p className="text-sm text-muted-foreground">
                Available: {fanCard.quantity} cards
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
              <Label htmlFor="quantity">Quantity to Order</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max={fanCard.quantity}
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseInt(e.target.value) || 1)}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Price: $10 per card × {formData.quantity} = ${formData.quantity * 10}
              </p>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="address">Street Address</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  type="text"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  type="text"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  type="text"
                  value={formData.country}
                  onChange={(e) => handleInputChange('country', e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-muted p-4 rounded-lg">
            <div className="flex items-start gap-2">
              <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
              <div className="text-sm">
                <p className="font-medium">Order Process</p>
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
              disabled={loading}
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

export default OrderCardsDialog;
