-- Create images table for image management
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for images
CREATE POLICY "Users can view their own images" 
ON public.images 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own images" 
ON public.images 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own images" 
ON public.images 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own images" 
ON public.images 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create user_bios table for bio management
CREATE TABLE public.user_bios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  header_1 TEXT,
  header_2 TEXT,
  content_1 TEXT,
  content_2 TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_bios ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_bios
CREATE POLICY "Users can view their own bio" 
ON public.user_bios 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bio" 
ON public.user_bios 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bio" 
ON public.user_bios 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bio" 
ON public.user_bios 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create playlists table
CREATE TABLE public.playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('audio', 'video')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for playlists
CREATE POLICY "Users can view their own playlists" 
ON public.playlists 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own playlists" 
ON public.playlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own playlists" 
ON public.playlists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own playlists" 
ON public.playlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create playlist_items table
CREATE TABLE public.playlist_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.playlists(id) ON DELETE CASCADE,
  media_id UUID NOT NULL,
  playlist_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.playlist_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for playlist_items
CREATE POLICY "Users can view items from their own playlists" 
ON public.playlist_items 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_items.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can add items to their own playlists" 
ON public.playlist_items 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_items.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can update items in their own playlists" 
ON public.playlist_items 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_items.playlist_id 
  AND playlists.user_id = auth.uid()
));

CREATE POLICY "Users can delete items from their own playlists" 
ON public.playlist_items 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.playlists 
  WHERE playlists.id = playlist_items.playlist_id 
  AND playlists.user_id = auth.uid()
));

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_images_updated_at
  BEFORE UPDATE ON public.images
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_bios_updated_at
  BEFORE UPDATE ON public.user_bios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_playlists_updated_at
  BEFORE UPDATE ON public.playlists
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();