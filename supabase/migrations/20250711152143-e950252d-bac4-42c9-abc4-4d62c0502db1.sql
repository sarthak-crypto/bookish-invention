-- Create social media links table
CREATE TABLE public.social_media_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  platform TEXT NOT NULL,
  url TEXT NOT NULL,
  display_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.social_media_links ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own social media links" 
ON public.social_media_links 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own social media links" 
ON public.social_media_links 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social media links" 
ON public.social_media_links 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own social media links" 
ON public.social_media_links 
FOR DELETE 
USING (auth.uid() = user_id);

-- Public read access for published profiles
CREATE POLICY "Public can view active social media links" 
ON public.social_media_links 
FOR SELECT 
USING (is_active = true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_social_media_links_updated_at
BEFORE UPDATE ON public.social_media_links
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_social_media_links_user_id ON public.social_media_links(user_id);
CREATE INDEX idx_social_media_links_display_order ON public.social_media_links(user_id, display_order);