
-- Create RFID cards table to associate physical cards with albums
CREATE TABLE public.rfid_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT NOT NULL UNIQUE,
  album_id UUID NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMP WITH TIME ZONE
);

-- Create index for fast card lookups
CREATE INDEX idx_rfid_cards_card_id ON public.rfid_cards(card_id);
CREATE INDEX idx_rfid_cards_album_id ON public.rfid_cards(album_id);

-- Enable RLS for security
ALTER TABLE public.rfid_cards ENABLE ROW LEVEL SECURITY;

-- Create policy to allow public read access for active cards (needed for end user access)
CREATE POLICY "Public can view active RFID cards" 
  ON public.rfid_cards 
  FOR SELECT 
  USING (is_active = true);

-- Create policy for artists to manage their own cards
CREATE POLICY "Artists can manage cards for their albums" 
  ON public.rfid_cards 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = rfid_cards.album_id 
      AND albums.user_id = auth.uid()
    )
  );

-- Create end user sessions table to track card access
CREATE TABLE public.end_user_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  card_id TEXT NOT NULL,
  album_id UUID NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  location JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for sessions
ALTER TABLE public.end_user_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public insert for session tracking
CREATE POLICY "Allow public session creation" 
  ON public.end_user_sessions 
  FOR INSERT 
  WITH CHECK (true);

-- Artists can view sessions for their albums
CREATE POLICY "Artists can view sessions for their albums" 
  ON public.end_user_sessions 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.albums 
      WHERE albums.id = end_user_sessions.album_id 
      AND albums.user_id = auth.uid()
    )
  );
