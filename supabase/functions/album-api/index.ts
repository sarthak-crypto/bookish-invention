
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)
    const pathSegments = url.pathname.split('/')
    const apiKey = pathSegments[pathSegments.length - 1]

    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: 'API key is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase client with service role key for database access
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Validate API key and get album info (no auth required - using service role)
    const { data: apiKeyData, error: apiKeyError } = await supabase
      .from('album_api_keys')
      .select(`
        id,
        album_id,
        is_active,
        usage_count,
        albums!inner(
          id,
          title,
          description,
          artwork_url,
          user_id
        )
      `)
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single()

    if (apiKeyError || !apiKeyData) {
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Update usage count and last used timestamp
    await supabase
      .from('album_api_keys')
      .update({
        usage_count: apiKeyData.usage_count + 1,
        last_used_at: new Date().toISOString()
      })
      .eq('id', apiKeyData.id)

    // Fetch tracks for the album (no auth required - using service role)
    const { data: tracks, error: tracksError } = await supabase
      .from('tracks')
      .select('id, title, file_url, duration')
      .eq('album_id', apiKeyData.album_id)
      .order('title')

    if (tracksError) {
      console.error('Error fetching tracks:', tracksError)
    }

    // Fetch videos for the album owner (no auth required - using service role)
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, file_url, thumbnail_url, duration')
      .eq('user_id', apiKeyData.albums.user_id)
      .order('title')

    if (videosError) {
      console.error('Error fetching videos:', videosError)
    }

    // Return album data with tracks and videos
    const response = {
      album: {
        id: apiKeyData.albums.id,
        title: apiKeyData.albums.title,
        description: apiKeyData.albums.description,
        artwork_url: apiKeyData.albums.artwork_url,
      },
      tracks: tracks || [],
      videos: videos || [],
      usage_info: {
        total_calls: apiKeyData.usage_count + 1,
        timestamp: new Date().toISOString()
      }
    }

    return new Response(
      JSON.stringify(response),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in album-api function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
