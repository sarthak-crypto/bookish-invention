
-- Update the profiles table to change artist_name to client_name
ALTER TABLE public.profiles RENAME COLUMN artist_name TO client_name;

-- Update any existing functions that reference artist_name
DROP FUNCTION IF EXISTS public.get_artist_analytics(uuid);

CREATE OR REPLACE FUNCTION public.get_client_analytics(client_id uuid)
 RETURNS TABLE(total_plays bigint, weekly_plays bigint, monthly_plays bigint, total_cards_bought bigint, unique_locations bigint)
 LANGUAGE sql
 SECURITY DEFINER
AS $function$
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
      WHERE fc.user_id = client_id
      AND o.status = 'completed'
    ), 0) as total_cards_bought,
    COALESCE((
      SELECT COUNT(DISTINCT ma.location->>'country')
      FROM public.media_analytics ma
      JOIN public.tracks t ON ma.media_id::text = t.id::text
      WHERE t.user_id = client_id
      AND ma.location IS NOT NULL
    ), 0) as unique_locations
  FROM public.media_analytics ma
  JOIN public.tracks t ON ma.media_id::text = t.id::text
  WHERE t.user_id = client_id;
$function$;

-- Update the albums_analytics table to use client_name instead of artist_name
ALTER TABLE public.albums_analytics RENAME COLUMN artist_name TO client_name;

-- Update the sync_album_analytics function
DROP FUNCTION IF EXISTS public.sync_album_analytics();

CREATE OR REPLACE FUNCTION public.sync_album_analytics()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Insert or update album analytics
  INSERT INTO public.albums_analytics (
    album_id,
    title,
    client_name,
    total_plays,
    unique_listeners,
    total_tracks,
    last_played_at,
    updated_at
  )
  SELECT 
    a.id as album_id,
    a.title,
    p.client_name,
    COALESCE(play_stats.total_plays, 0) as total_plays,
    COALESCE(play_stats.unique_listeners, 0) as unique_listeners,
    COALESCE(track_count.total_tracks, 0) as total_tracks,
    play_stats.last_played_at,
    now() as updated_at
  FROM public.albums a
  LEFT JOIN public.profiles p ON a.user_id = p.id
  LEFT JOIN (
    SELECT 
      t.album_id,
      COUNT(DISTINCT ae.user_id) as unique_listeners,
      COUNT(ae.id) as total_plays,
      MAX(ae.created_at) as last_played_at
    FROM public.tracks t
    LEFT JOIN public.analytics_events ae ON ae.metadata->>'track_id' = t.id::text
    WHERE ae.event_type IN ('track_play', 'track_complete')
    GROUP BY t.album_id
  ) play_stats ON a.id = play_stats.album_id
  LEFT JOIN (
    SELECT album_id, COUNT(*) as total_tracks
    FROM public.tracks
    GROUP BY album_id
  ) track_count ON a.id = track_count.album_id
  ON CONFLICT (album_id) 
  DO UPDATE SET
    title = EXCLUDED.title,
    client_name = EXCLUDED.client_name,
    total_plays = EXCLUDED.total_plays,
    unique_listeners = EXCLUDED.unique_listeners,
    total_tracks = EXCLUDED.total_tracks,
    last_played_at = EXCLUDED.last_played_at,
    updated_at = EXCLUDED.updated_at;
END;
$function$;
