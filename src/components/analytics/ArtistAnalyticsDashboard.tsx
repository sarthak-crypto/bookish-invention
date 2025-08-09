
/*
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, Play, ShoppingCart, MapPin, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AnalyticsData {
  total_plays: number;
  weekly_plays: number;
  monthly_plays: number;
  total_cards_bought: number;
  unique_locations: number;
}

const ClientAnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user]);

  const fetchAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_client_analytics', { client_id: user?.id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setAnalytics(data[0]);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">No analytics data available yet.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Analytics Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Total Plays</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{analytics.total_plays.toLocaleString()}</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Weekly Plays</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{analytics.weekly_plays.toLocaleString()}</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Monthly Plays</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{analytics.monthly_plays.toLocaleString()}</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <ShoppingCart className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Cards Sold</span>
              </div>
              <p className="text-2xl font-bold text-orange-700">{analytics.total_cards_bought.toLocaleString()}</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Unique Locations</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{analytics.unique_locations.toLocaleString()}</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Engagement Rate</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">
                {analytics.total_plays > 0 ? 
                  `${((analytics.weekly_plays / analytics.total_plays) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientAnalyticsDashboard;
*/

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Analytics functionality commented out for future use
const ClientAnalyticsDashboard: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground">Analytics feature is temporarily disabled.</p>
      </CardContent>
    </Card>
  );
};

export default ClientAnalyticsDashboard;
