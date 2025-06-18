
-- Create analytics table for tracking user interactions
CREATE TABLE public.media_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  media_id uuid NOT NULL,
  media_type text NOT NULL CHECK (media_type IN ('audio', 'video')),
  play_count integer NOT NULL DEFAULT 1,
  location jsonb,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create index for better performance
CREATE INDEX idx_media_analytics_user_id ON public.media_analytics(user_id);
CREATE INDEX idx_media_analytics_media_id ON public.media_analytics(media_id);
CREATE INDEX idx_media_analytics_created_at ON public.media_analytics(created_at);

-- Enable RLS
ALTER TABLE public.media_analytics ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own analytics" 
  ON public.media_analytics 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics" 
  ON public.media_analytics 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Add order status tracking for card purchases
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS email_sent boolean DEFAULT false;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notification_sent_at timestamp with time zone;

-- Create function to get artist analytics
CREATE OR REPLACE FUNCTION public.get_artist_analytics(artist_id uuid)
RETURNS TABLE (
  total_plays bigint,
  weekly_plays bigint,
  monthly_plays bigint,
  total_cards_bought bigint,
  unique_locations bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(SUM(ma.play_count), 0) as total_plays,
    COALESCE(SUM(CASE 
      WHEN ma.created_at >= NOW() - INTERVAL '7 days' 
      THEN ma.play_count 
      ELSE 0 
    END), 0) as weekly_plays,
    COALESCE(SUM(CASE 
      WHEN ma.created_at >= NOW() - INTERVAL '30 days' 
      THEN ma.play_count 
      ELSE 0 
    END), 0) as monthly_plays,
    COALESCE((
      SELECT SUM(o.quantity) 
      FROM public.orders o
      JOIN public.fan_cards fc ON o.fan_card_id = fc.id
      WHERE fc.user_id = artist_id
      AND o.status = 'completed'
    ), 0) as total_cards_bought,
    COALESCE((
      SELECT COUNT(DISTINCT ma.location->>'country')
      FROM public.media_analytics ma
      JOIN public.tracks t ON ma.media_id::text = t.id::text
      WHERE t.user_id = artist_id
      AND ma.location IS NOT NULL
    ), 0) as unique_locations
  FROM public.media_analytics ma
  JOIN public.tracks t ON ma.media_id::text = t.id::text
  WHERE t.user_id = artist_id;
$$;
