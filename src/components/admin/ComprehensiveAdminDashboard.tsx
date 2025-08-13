import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, ShoppingCart, CreditCard, DollarSign, Package, Settings, UserPlus, BarChart, Menu } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

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
  const isMobile = useIsMobile();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalOrders: 0,
    totalFanCards: 0,
    totalRevenue: 0
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('users');

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

  const tabItems = [
    { value: 'users', label: 'Users', icon: Users },
    { value: 'create-user', label: 'Create User', icon: UserPlus },
    { value: 'orders', label: 'Orders', icon: ShoppingCart },
    { value: 'fan-cards', label: 'Fan Cards', icon: CreditCard },
    { value: 'card-designs', label: 'Card Designs', icon: Package },
    { value: 'rfid-cards', label: 'RFID Cards', icon: Settings },
  ];

  const MobileTabNavigation = () => (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden mb-4">
          <Menu className="h-4 w-4 mr-2" />
          {tabItems.find(item => item.value === activeTab)?.label || 'Menu'}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-64">
        <div className="flex flex-col space-y-2 mt-8">
          {tabItems.map((item) => (
            <Button
              key={item.value}
              variant={activeTab === item.value ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setActiveTab(item.value)}
            >
              <item.icon className="h-4 w-4 mr-2" />
              {item.label}
            </Button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );

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
        <div className="container mx-auto px-4 py-4 lg:py-8">
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-foreground-dark mb-2">
            Admin Dashboard
          </h1>
          <p className="text-sm md:text-lg text-muted-foreground">
            Comprehensive system management and analytics
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4 lg:py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 mb-6 lg:mb-8">
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-blue-600">Total Users</p>
                  <p className="text-lg lg:text-3xl font-bold text-blue-700">{stats.totalUsers.toLocaleString()}</p>
                </div>
                <Users className="h-8 w-8 lg:h-12 lg:w-12 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-green-600">Total Orders</p>
                  <p className="text-lg lg:text-3xl font-bold text-green-700">{stats.totalOrders.toLocaleString()}</p>
                </div>
                <ShoppingCart className="h-8 w-8 lg:h-12 lg:w-12 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-purple-50 border-purple-200">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-purple-600">Total Fan Cards</p>
                  <p className="text-lg lg:text-3xl font-bold text-purple-700">{stats.totalFanCards.toLocaleString()}</p>
                </div>
                <CreditCard className="h-8 w-8 lg:h-12 lg:w-12 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-orange-50 border-orange-200">
            <CardContent className="p-3 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm font-medium text-orange-600">Total Revenue</p>
                  <p className="text-lg lg:text-3xl font-bold text-orange-700">{formatCurrency(stats.totalRevenue)}</p>
                </div>
                <DollarSign className="h-8 w-8 lg:h-12 lg:w-12 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Navigation */}
        <MobileTabNavigation />

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Desktop Tab Navigation */}
          <TabsList className="hidden lg:grid grid-cols-6 w-full">
            {tabItems.map((item) => (
              <TabsTrigger key={item.value} value={item.value} className="flex items-center gap-2">
                <item.icon className="h-4 w-4" />
                {item.label}
              </TabsTrigger>
            ))}
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
