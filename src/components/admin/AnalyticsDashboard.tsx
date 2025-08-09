
/*
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
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="text-foreground text-center">Loading analytics...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="bg-gradient-to-br from-blue-100 to-blue-200 border-blue-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">{analytics.totalUsers}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-100 to-green-200 border-green-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Tracks</CardTitle>
            <Music className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">{analytics.totalTracks}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-100 to-purple-200 border-purple-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-800">Videos</CardTitle>
            <Video className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900">{analytics.totalVideos}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800">Fan Cards</CardTitle>
            <CreditCard className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-900">{analytics.totalFanCards}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-100 to-red-200 border-red-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-900">{analytics.totalOrders}</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-100 to-indigo-200 border-indigo-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-800">Revenue</CardTitle>
            <BarChart3 className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-900">${analytics.totalRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground-dark">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={analytics.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Line type="monotone" dataKey="users" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground-dark">Content Distribution</CardTitle>
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
                  fill="hsl(var(--primary))"
                  dataKey="value"
                >
                  {analytics.contentByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-foreground-dark">Revenue by Month</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analytics.revenueByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--foreground))" />
                <YAxis stroke="hsl(var(--foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    color: 'hsl(var(--foreground))'
                  }} 
                />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
*/

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Admin analytics dashboard commented out for future use
const AnalyticsDashboard: React.FC = () => {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-6">
        <div className="text-foreground text-center">Admin analytics dashboard is temporarily disabled.</div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDashboard;
