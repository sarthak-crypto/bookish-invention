import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ShoppingCart, Package, DollarSign, TrendingUp, Edit, CreditCard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface Order {
  id: string;
  user_id: string;
  fan_card_id: string;
  quantity: number;
  total_amount: number;
  status: string;
  payment_id: string | null;
  payment_method: string | null;
  payment_status: string | null;
  shipping_address: any;
  created_at: string;
  fan_cards: {
    id: string;
    artwork_url: string;
    albums: {
      title: string;
    } | null;
  } | null;
  profiles: {
    artist_name: string | null;
  } | null;
}

const OrderManagement: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editForm, setEditForm] = useState({
    payment_id: '',
    payment_method: '',
    payment_status: '',
    total_amount: ''
  });
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          *,
          fan_cards (
            id,
            artwork_url,
            albums (title)
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately due to relation issues
      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('artist_name')
              .eq('id', order.user_id)
              .single();

            return {
              ...order,
              profiles: profile || { artist_name: null }
            };
          } catch (error) {
            console.error('Error fetching profile for order:', error);
            return {
              ...order,
              profiles: { artist_name: null }
            };
          }
        })
      );

      setOrders(ordersWithProfiles);
      
      // Calculate stats
      const totalOrders = ordersWithProfiles.length;
      const totalRevenue = ordersWithProfiles.reduce((sum, order) => sum + Number(order.total_amount), 0);
      const pendingOrders = ordersWithProfiles.filter(order => order.status === 'pending').length;
      const completedOrders = ordersWithProfiles.filter(order => order.status === 'completed').length;

      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        completedOrders
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      // Track analytics when order status changes
      if (newStatus === 'completed') {
        await supabase
          .from('analytics_events')
          .insert({
            event_type: 'order_completed',
            metadata: { order_id: orderId, status: newStatus },
            user_id: null
          });
      }

      toast({
        title: "Success",
        description: `Order status updated to ${newStatus}`,
      });

      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setEditForm({
      payment_id: order.payment_id || '',
      payment_method: order.payment_method || '',
      payment_status: order.payment_status || '',
      total_amount: order.total_amount.toString()
    });
  };

  const updateOrderDetails = async () => {
    if (!editingOrder) return;

    try {
      const { error } = await supabase
        .from('orders')
        .update({
          payment_id: editForm.payment_id || null,
          payment_method: editForm.payment_method || null,
          payment_status: editForm.payment_status || null,
          total_amount: parseFloat(editForm.total_amount) || editingOrder.total_amount
        })
        .eq('id', editingOrder.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Order details updated successfully",
      });

      setEditingOrder(null);
      fetchOrders(); // Refresh the list
    } catch (error) {
      console.error('Error updating order details:', error);
      toast({
        title: "Error",
        description: "Failed to update order details",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'processing':
        return 'secondary';
      case 'pending':
        return 'outline';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading orders...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${stats.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Pending</CardTitle>
            <Package className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.pendingOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Completed</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.completedOrders}</div>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <ShoppingCart className="h-6 w-6" />
            Order Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                    <Package className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-gray-300 text-sm">
                      Album: {order.fan_cards?.albums?.title || 'Unknown Album'}
                    </p>
                    <p className="text-gray-300 text-sm">
                      Artist: {order.profiles?.artist_name || 'Unknown Artist'}
                    </p>
                    <p className="text-gray-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-medium">
                      ${order.total_amount} ({order.quantity} items)
                    </p>
                    {order.payment_id && (
                      <p className="text-gray-400 text-xs">
                        Payment ID: {order.payment_id.slice(0, 10)}...
                      </p>
                    )}
                    {order.payment_status && (
                      <p className="text-gray-400 text-xs">
                        Payment: {order.payment_status}
                      </p>
                    )}
                  </div>

                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {order.status}
                  </Badge>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                        onClick={() => openEditDialog(order)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="bg-gray-900 border-gray-700">
                      <DialogHeader>
                        <DialogTitle className="text-white">Edit Order Details</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="payment_id" className="text-white">Payment ID</Label>
                          <Input
                            id="payment_id"
                            value={editForm.payment_id}
                            onChange={(e) => setEditForm(prev => ({ ...prev, payment_id: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white"
                            placeholder="Enter payment ID"
                          />
                        </div>
                        <div>
                          <Label htmlFor="payment_method" className="text-white">Payment Method</Label>
                          <Select 
                            value={editForm.payment_method} 
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, payment_method: value }))}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="credit_card">Credit Card</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                              <SelectItem value="stripe">Stripe</SelectItem>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="cash">Cash</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="payment_status" className="text-white">Payment Status</Label>
                          <Select 
                            value={editForm.payment_status} 
                            onValueChange={(value) => setEditForm(prev => ({ ...prev, payment_status: value }))}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20 text-white">
                              <SelectValue placeholder="Select payment status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="processing">Processing</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="failed">Failed</SelectItem>
                              <SelectItem value="refunded">Refunded</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="total_amount" className="text-white">Total Amount ($)</Label>
                          <Input
                            id="total_amount"
                            type="number"
                            step="0.01"
                            value={editForm.total_amount}
                            onChange={(e) => setEditForm(prev => ({ ...prev, total_amount: e.target.value }))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button onClick={updateOrderDetails} className="flex-1">
                            <CreditCard className="h-4 w-4 mr-2" />
                            Update Details
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Select
                    value={order.status}
                    onValueChange={(newStatus) => updateOrderStatus(order.id, newStatus)}
                  >
                    <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
          </div>

          {orders.length === 0 && (
            <div className="text-center text-gray-400 py-8">
              No orders found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderManagement;
