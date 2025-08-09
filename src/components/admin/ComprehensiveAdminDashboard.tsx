
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, CreditCard, DollarSign, Package, Settings, UserPlus, BarChart } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Import admin components
import UserManagement from './UserManagement';
import CreateUser from './CreateUser';
import OrderManagement from './OrderManagement';
import CardDesignManager from './CardDesignManager';
import RFIDCardManagement from './RFIDCardManagement';
import AdminFanCardManager from './AdminFanCardManager';

interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalFanCards: number;
  totalRevenue: number;
}

const ComprehensiveAdminDashboard: React.FC = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalFanCards: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Fetch total users
      const { count: usersCount, error: usersError } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      if (usersError) throw usersError;

      // Fetch total orders
      const { count: ordersCount, error: ordersError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (ordersError) throw ordersError;

      // Fetch total fan cards
      const { count: fanCardsCount, error: fanCardsError } = await supabase
        .from('fan_cards')
        .select('*', { count: 'exact', head: true });

      if (fanCardsError) throw fanCardsError;

      // Calculate total revenue from completed orders
      const { data: revenueData, error: revenueError } = await supabase
        .from('orders')
        .select('total_amount')
        .eq('status', 'completed');

      if (revenueError) throw revenueError;

      const totalRevenue = revenueData?.reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0) || 0;

      setStats({
        totalUsers: usersCount || 0,
        totalOrders: ordersCount || 0,
        totalFanCards: fanCardsCount || 0,
        totalRevenue: totalRevenue
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      toast({
        title: "Error",
        description: "Failed to load dashboard statistics.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-r from-primary/20 to-accent/20 border-b">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground-dark mb-2">
            Admin Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            Comprehensive system management and analytics
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-3xl font-bold text-blue-700">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-12 w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-600">Total Orders</p>
                  <p className="text-3xl font-bold text-green-700">{stats.totalOrders.toLocaleString()}</p>
                </div>
                <ShoppingCart className="h-12 w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-purple-600">Total Fan Cards</p>
                  <p className="text-3xl font-bold text-purple-700">{stats.totalFanCards.toLocaleString()}</p>
                </div>
                <CreditCard className="h-12 w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-orange-600">Total Revenue</p>
                  <p className="text-3xl font-bold text-orange-700">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-12 w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-6 w-full">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Users
            </TabsTrigger>
            <TabsTrigger value="create-user" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Create User
            </TabsTrigger>
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <ShoppingCart className="h-4 w-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="fan-cards" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Fan Cards
            </TabsTrigger>
            <TabsTrigger value="card-designs" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Card Designs
            </TabsTrigger>
            <TabsTrigger value="rfid-cards" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              RFID Cards
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="create-user">
            <CreateUser />
          </TabsContent>

          <TabsContent value="orders">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="fan-cards">
            <AdminFanCardManager />
          </TabsContent>

          <TabsContent value="card-designs">
            <CardDesignManager />
          </TabsContent>

          <TabsContent value="rfid-cards">
            <RFIDCardManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ComprehensiveAdminDashboard;
