
/*
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users, Play, ShoppingCart, MapPin, Calendar, CreditCard, Music } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DetailedAnalyticsData {
  // Card analytics
  registered_cards: number;
  active_cards: number;
  inactive_cards: number;
  
  // Play analytics
  total_plays: number;
  weekly_plays: number;
  monthly_plays: number;
  
  // Track breakdown
  track_plays: Array<{
    track_id: string;
    title: string;
    play_count: number;
    completion_rate: number;
  }>;
}

const DetailedAnalytics: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<DetailedAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDetailedAnalytics();
    }
  }, [user]);

  const fetchDetailedAnalytics = async () => {
    try {
      // Fetch card analytics - get all cards for user's albums
      const { data: userAlbums, error: albumError } = await supabase
        .from('albums')
        .select('id')
        .eq('user_id', user?.id);

      if (albumError) throw albumError;

      const albumIds = userAlbums?.map(album => album.id) || [];

      // Fetch RFID cards data
      const { data: cardData, error: cardError } = await supabase
        .from('rfid_cards')
        .select('*')
        .in('album_id', albumIds);

      if (cardError) throw cardError;

      // Fetch NFC usage analytics data
      const { data: nfcAnalytics, error: nfcError } = await supabase
        .from('nfc_usage_analytics')
        .select('card_id, tap_count')
        .in('album_id', albumIds);

      if (nfcError) throw nfcError;

      // Create a map of card_id to tap_count for easy lookup
      const tapCountMap = (nfcAnalytics || []).reduce((acc, analytics) => {
        acc[analytics.card_id] = analytics.tap_count || 0;
        return acc;
      }, {} as Record<string, number>);

      // Calculate card metrics
      const registeredCards = cardData?.filter(card => card.is_active).length || 0;
      const activeCards = cardData?.filter(card => {
        const tapCount = tapCountMap[card.card_id] || 0;
        return card.is_active && tapCount > 10;
      }).length || 0;
      const inactiveCards = cardData?.filter(card => {
        const tapCount = tapCountMap[card.card_id] || 0;
        return !card.is_active || tapCount === 0;
      }).length || 0;

      // Fetch play analytics
      const { data: playData, error: playError } = await supabase
        .rpc('get_client_analytics', { client_id: user?.id });

      if (playError) throw playError;

      // Fetch track breakdown
      const { data: trackData, error: trackError } = await supabase
        .from('track_analytics')
        .select(`
          track_id,
          title,
          play_count,
          completion_rate,
          tracks!inner(user_id)
        `)
        .eq('tracks.user_id', user?.id)
        .order('play_count', { ascending: false });

      if (trackError) throw trackError;

      const analyticsData: DetailedAnalyticsData = {
        registered_cards: registeredCards,
        active_cards: activeCards,
        inactive_cards: inactiveCards,
        total_plays: playData?.[0]?.total_plays || 0,
        weekly_plays: playData?.[0]?.weekly_plays || 0,
        monthly_plays: playData?.[0]?.monthly_plays || 0,
        track_plays: trackData?.map(track => ({
          track_id: track.track_id,
          title: track.title,
          play_count: track.play_count || 0,
          completion_rate: track.completion_rate || 0
        })) || []
      };

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching detailed analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load detailed analytics.",
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
          <p className="text-center text-muted-foreground">Loading detailed analytics...</p>
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
            <CreditCard className="h-5 w-5" />
            RFID Card Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-600">Registered Cards</span>
              </div>
              <p className="text-2xl font-bold text-blue-700">{analytics.registered_cards}</p>
              <p className="text-xs text-blue-600 mt-1">Cards linked to email addresses</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-600">Active Cards</span>
              </div>
              <p className="text-2xl font-bold text-green-700">{analytics.active_cards}</p>
              <p className="text-xs text-green-600 mt-1">Cards with 10+ taps</p>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-600">Inactive Cards</span>
              </div>
              <p className="text-2xl font-bold text-gray-700">{analytics.inactive_cards}</p>
              <p className="text-xs text-gray-600 mt-1">Unregistered or unused cards</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart className="h-5 w-5" />
            Play Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Play className="h-4 w-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-600">Total Plays</span>
              </div>
              <p className="text-2xl font-bold text-purple-700">{analytics.total_plays.toLocaleString()}</p>
              <p className="text-xs text-purple-600 mt-1">All-time play count</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-600">Weekly Plays</span>
              </div>
              <p className="text-2xl font-bold text-orange-700">{analytics.weekly_plays.toLocaleString()}</p>
              <p className="text-xs text-orange-600 mt-1">Last 7 days</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-red-600" />
                <span className="text-sm font-medium text-red-600">Monthly Plays</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{analytics.monthly_plays.toLocaleString()}</p>
              <p className="text-xs text-red-600 mt-1">Last 28 days</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Audio Plays Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          {analytics.track_plays.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No track play data available yet.
            </p>
          ) : (
            <div className="space-y-3">
              {analytics.track_plays.map((track) => (
                <div key={track.track_id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{track.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {track.play_count} plays • {track.completion_rate.toFixed(1)}% completion rate
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">{track.play_count}</p>
                    <p className="text-xs text-muted-foreground">plays</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DetailedAnalytics;
*/

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

// Analytics functionality commented out for future use
const DetailedAnalytics: React.FC = () => {
  return (
    <Card>
      <CardContent className="p-6">
        <p className="text-center text-muted-foreground">Detailed analytics feature is temporarily disabled.</p>
      </CardContent>
    </Card>
  );
};

export default DetailedAnalytics;
