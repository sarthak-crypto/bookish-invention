
-- Create album_landing_pages table to store custom landing page designs
CREATE TABLE public.album_landing_pages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  album_id UUID NOT NULL,
  title TEXT NOT NULL,
  elements JSONB NOT NULL DEFAULT '[]',
  theme JSONB NOT NULL DEFAULT '{"backgroundColor": "#ffffff", "textColor": "#000000", "accentColor": "#3b82f6"}',
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(album_id)
);

-- Add RLS policies for album_landing_pages
ALTER TABLE public.album_landing_pages ENABLE ROW LEVEL SECURITY;

-- Users can view their own landing pages
CREATE POLICY "Users can view their own landing pages" 
  ON public.album_landing_pages 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can create their own landing pages
CREATE POLICY "Users can create their own landing pages" 
  ON public.album_landing_pages 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own landing pages
CREATE POLICY "Users can update their own landing pages" 
  ON public.album_landing_pages 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own landing pages
CREATE POLICY "Users can delete their own landing pages" 
  ON public.album_landing_pages 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Allow public access to published landing pages
CREATE POLICY "Anyone can view published landing pages" 
  ON public.album_landing_pages 
  FOR SELECT 
  USING (is_published = true);

-- Add foreign key constraint
ALTER TABLE public.album_landing_pages 
ADD CONSTRAINT album_landing_pages_album_id_fkey 
FOREIGN KEY (album_id) REFERENCES public.albums(id) ON DELETE CASCADE;

-- Create an index for better performance
CREATE INDEX idx_album_landing_pages_album_id ON public.album_landing_pages(album_id);
CREATE INDEX idx_album_landing_pages_published ON public.album_landing_pages(is_published);
