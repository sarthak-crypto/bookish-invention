
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MediaAnalyticsData {
  media_id: string;
  media_type: 'audio' | 'video';
  location?: {
    country?: string;
    city?: string;
    region?: string;
  };
}

export const useMediaAnalytics = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const trackMediaPlay = async (data: MediaAnalyticsData) => {
    if (!user) return;

    try {
      // Get user's location and other metadata
      const userAgent = navigator.userAgent;
      let location = data.location;

      // Try to get location from browser (requires HTTPS)
      if (!location && 'geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              enableHighAccuracy: false
            });
          });
          
          // Use reverse geocoding service (you might want to add a proper service)
          location = {
            country: 'Unknown',
            city: 'Unknown',
            region: 'Unknown'
          };
        } catch (geoError) {
          // Geolocation failed, continue without location
          console.log('Geolocation not available');
        }
      }

      const { error } = await supabase
        .from('media_analytics')
        .insert({
          user_id: user.id,
          media_id: data.media_id,
          media_type: data.media_type,
          location: location,
          user_agent: userAgent,
          play_count: 1
        });

      if (error) {
        console.error('Analytics tracking error:', error);
        // Don't show toast for analytics errors to avoid bothering users
      }
    } catch (error) {
      console.error('Failed to track media play:', error);
    }
  };

  return { trackMediaPlay };
};
