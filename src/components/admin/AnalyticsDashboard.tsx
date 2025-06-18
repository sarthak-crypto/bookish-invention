
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { BarChart3, Users, Music, Video, CreditCard, TrendingUp } from 'lucide-react';

interface AnalyticsData {
  totalUsers: number;
  totalTracks: number;
  totalVideos: number;
  totalFanCards: number;
  totalOrders: number;
  totalRevenue: number;
  userGrowth: any[];
  contentByType: any[];
  revenueByMonth: any[];
}

const AnalyticsDashboard: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalTracks: 0,
    totalVideos: 0,
    totalFanCards: 0,
    totalOrders: 0,
    totalRevenue: 0,
    userGrowth: [],
    contentByType: [],
    revenueByMonth: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch total counts
      const [usersData, tracksData, videosData, fanCardsData, ordersData] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact' }),
        supabase.from('tracks').select('id', { count: 'exact' }),
        supabase.from('videos').select('id', { count: 'exact' }),
        supabase.from('fan_cards').select('id', { count: 'exact' }),
        supabase.from('orders').select('total_amount')
      ]);

      const totalRevenue = ordersData.data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;

      // Fetch user growth data (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: userGrowthData } = await supabase
        .from('profiles')
        .select('created_at')
        .gte('created_at', sixMonthsAgo.toISOString());

      // Process user growth data
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const userGrowth = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - (5 - i));
        return {
          month: monthNames[date.getMonth()],
          users: 0
        };
      });

      userGrowthData?.forEach(user => {
        const userDate = new Date(user.created_at);
        const monthIndex = userDate.getMonth();
        const growthIndex = userGrowth.findIndex(item => item.month === monthNames[monthIndex]);
        if (growthIndex !== -1) {
          userGrowth[growthIndex].users++;
        }
      });

      // Content by type data
      const contentByType = [
        { name: 'Tracks', value: tracksData.count || 0, color: '#8884d8' },
        { name: 'Videos', value: videosData.count || 0, color: '#82ca9d' },
        { name: 'Fan Cards', value: fanCardsData.count || 0, color: '#ffc658' }
      ];

      // Revenue by month (mock data for demo)
      const revenueByMonth = [
        { month: 'Jan', revenue: Math.floor(Math.random() * 5000) },
        { month: 'Feb', revenue: Math.floor(Math.random() * 5000) },
        { month: 'Mar', revenue: Math.floor(Math.random() * 5000) },
        { month: 'Apr', revenue: Math.floor(Math.random() * 5000) },
        { month: 'May', revenue: Math.floor(Math.random() * 5000) },
        { month: 'Jun', revenue: Math.floor(Math.random() * 5000) }
      ];

      setAnalytics({
        totalUsers: usersData.count || 0,
        totalTracks: tracksData.count || 0,
        totalVideos: videosData.count || 0,
        totalFanCards: fanCardsData.count || 0,
        totalOrders: ordersData.data?.length || 0,
        totalRevenue,
        userGrowth,
        contentByType,
        revenueByMonth
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card className="bg-white/10 backdrop-blur-lg border-white/20">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-600/20 to-green-800/20 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Tracks</CardTitle>
            <Music className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalTracks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border-purple-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Videos</CardTitle>
            <Video className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalVideos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Fan Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalFanCards}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-600/20 to-red-800/20 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{analytics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-600/20 to-indigo-800/20 border-indigo-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-white">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${analytics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }} 
                />
                <Line type="monotone" dataKey="users" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="text-white">Content Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.contentByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {analytics.contentByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
                <XAxis dataKey="month" stroke="#ffffff60" />
                <YAxis stroke="#ffffff60" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1a1a2e', 
                    border: '1px solid #ffffff20',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }} 
                />
                <Bar dataKey="revenue" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
