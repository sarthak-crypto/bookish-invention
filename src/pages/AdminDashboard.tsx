
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
  Palette,
  Database
} from 'lucide-react';

// Import admin components
import UserManagement from '@/components/admin/UserManagement';
import CardDesignManager from '@/components/admin/CardDesignManager';
import OrderManagement from '@/components/admin/OrderManagement';
import AnalyticsDashboard from '@/components/admin/AnalyticsDashboard';
import CreateUser from '@/components/admin/CreateUser';
import RFIDCardManagement from '@/components/admin/RFIDCardManagement';

const AdminDashboard: React.FC = () => {
  const { user, signOut } = useAuth();
  const { isSuperAdmin, isLoading } = useAdminAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="text-white text-xl">Loading super admin dashboard...</div>
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
            <p className="text-red-200 mb-4">You don't have super admin privileges to access this dashboard.</p>
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
            <h1 className="text-4xl font-bold text-white mb-2">Super Admin Control Panel</h1>
            <p className="text-purple-200">Complete system management for {user.email}</p>
            <p className="text-purple-300 text-sm">Manage users, RFID cards, orders, analytics and system settings</p>
          </div>
          <div className="flex gap-4">
            <Button 
              onClick={() => navigate('/dashboard')} 
              variant="outline"
              className="bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <Users className="h-4 w-4 mr-2" />
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
          <TabsList className="grid w-full grid-cols-8 bg-white/10 backdrop-blur-lg">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-purple-600">
              <BarChart3 className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="users" className="text-white data-[state=active]:bg-purple-600">
              <Users className="h-4 w-4 mr-2" />
              User Management
            </TabsTrigger>
            <TabsTrigger value="create-user" className="text-white data-[state=active]:bg-purple-600">
              <UserPlus className="h-4 w-4 mr-2" />
              Create User
            </TabsTrigger>
            <TabsTrigger value="rfid-cards" className="text-white data-[state=active]:bg-purple-600">
              <CreditCard className="h-4 w-4 mr-2" />
              RFID Cards
            </TabsTrigger>
            <TabsTrigger value="card-designs" className="text-white data-[state=active]:bg-purple-600">
              <Palette className="h-4 w-4 mr-2" />
              Card Designs
            </TabsTrigger>
            <TabsTrigger value="orders" className="text-white data-[state=active]:bg-purple-600">
              <ShoppingCart className="h-4 w-4 mr-2" />
              Order Management
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-white data-[state=active]:bg-purple-600">
              <Database className="h-4 w-4 mr-2" />
              System Analytics
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-purple-600">
              <Settings className="h-4 w-4 mr-2" />
              System Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gradient-to-r from-blue-600/20 to-blue-800/20 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-200 text-sm">Total Users</p>
                      <p className="text-white text-2xl font-bold">-</p>
                    </div>
                    <Users className="h-8 w-8 text-blue-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-green-600/20 to-green-800/20 border-green-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-200 text-sm">Active RFID Cards</p>
                      <p className="text-white text-2xl font-bold">-</p>
                    </div>
                    <CreditCard className="h-8 w-8 text-green-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-purple-600/20 to-purple-800/20 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-200 text-sm">Total Orders</p>
                      <p className="text-white text-2xl font-bold">-</p>
                    </div>
                    <ShoppingCart className="h-8 w-8 text-purple-400" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-r from-orange-600/20 to-orange-800/20 border-orange-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-200 text-sm">System Health</p>
                      <p className="text-white text-2xl font-bold">Good</p>
                    </div>
                    <Shield className="h-8 w-8 text-orange-400" />
                  </div>
                </CardContent>
              </Card>
            </div>
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <UserManagement />
          </TabsContent>

          <TabsContent value="create-user" className="space-y-6">
            <CreateUser />
          </TabsContent>

          <TabsContent value="rfid-cards" className="space-y-6">
            <RFIDCardManagement />
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

          <TabsContent value="settings" className="space-y-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  System Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-white space-y-4">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium mb-2">Database Status</h3>
                    <p className="text-sm text-gray-300">All systems operational</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium mb-2">Authentication Settings</h3>
                    <p className="text-sm text-gray-300">Email confirmation: Enabled</p>
                    <p className="text-sm text-gray-300">Password reset: Enabled</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium mb-2">RFID System</h3>
                    <p className="text-sm text-gray-300">Card validation: Active</p>
                    <p className="text-sm text-gray-300">Analytics tracking: Enabled</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
