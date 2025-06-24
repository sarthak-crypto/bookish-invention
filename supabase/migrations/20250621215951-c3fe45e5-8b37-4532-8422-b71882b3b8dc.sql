
-- Create a table for API keys linked to albums
CREATE TABLE public.album_api_keys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
  api_key TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_used_at TIMESTAMP WITH TIME ZONE,
  usage_count INTEGER NOT NULL DEFAULT 0
);

-- Add RLS policies for the album API keys table
ALTER TABLE public.album_api_keys ENABLE ROW LEVEL SECURITY;

-- Only album owners can manage their API keys
CREATE POLICY "Users can view their own album API keys" 
  ON public.album_api_keys 
  FOR SELECT 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_api_keys.album_id 
      AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create API keys for their own albums" 
  ON public.album_api_keys 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_api_keys.album_id 
      AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own album API keys" 
  ON public.album_api_keys 
  FOR UPDATE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_api_keys.album_id 
      AND albums.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own album API keys" 
  ON public.album_api_keys 
  FOR DELETE 
  TO authenticated 
  USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = album_api_keys.album_id 
      AND albums.user_id = auth.uid()
    )
  );

-- Create an index for faster API key lookups
CREATE INDEX idx_album_api_keys_api_key ON public.album_api_keys(api_key) WHERE is_active = true;
CREATE INDEX idx_album_api_keys_album_id ON public.album_api_keys(album_id);
