
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Settings, 
  Users, 
  CreditCard, 
  BarChart3, 
  ShoppingCart, 
  UserPlus,
  Shield,
  Palette
} from 'lucide-react';

// Import admin components
import UserManagement from '@/components/admin/UserManagement';
import CardDesignManager from '@/components/admin/CardDesignManager';
import OrderManagement from '@/components/admin/OrderManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import CreateUser from '@/components/admin/CreateUser';

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isSuperAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading admin dashboard...</div>
      </div>
    );
  }

  if (!user || !isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-900 via-red-800 to-red-900">
        <Card className="w-96 bg-white/10 backdrop-blur-lg border-red-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-6 w-6" />
              Access Denied
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-200 mb-4">You don't have super admin privileges.</p>
            <Button onClick={() => navigate('/')} className="w-full">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto p-6">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Super Admin Dashboard</h1>
            <p className="text-purple-200">Welcome back, {user.email}</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              User Dashboard
            </Button>
            <Button 
              onClick={signOut} 
              variant="outline"
              className="bg-red-600/20 text-red-200 border-red-500/20 hover:bg-red-600/30"
            >
              Logout
            </Button>
          </div>
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-white/10 backdrop-blur-lg">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="card-designs" className="text-white data-[state=active]:bg-purple-600">
              <Palette className="h-4 w-4 mr-2" />
              Card Designs
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-white data-[state=active]:bg-purple-600">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="create-user" className="text-white data-[state=active]:bg-purple-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="card-designs" className="space-y-6">
            <CardDesignManager />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <OrderManagement />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="create-user" className="space-y-6">
            <CreateUser />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
