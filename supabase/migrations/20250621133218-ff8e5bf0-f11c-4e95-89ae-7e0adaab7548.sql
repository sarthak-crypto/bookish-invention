
-- Add foreign key relationships only if they don't exist
DO $$ 
BEGIN
    -- Add albums foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'albums_user_id_fkey') THEN
        ALTER TABLE albums ADD CONSTRAINT albums_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add tracks user_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tracks_user_id_fkey') THEN
        ALTER TABLE tracks ADD CONSTRAINT tracks_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add tracks album_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'tracks_album_id_fkey') THEN
        ALTER TABLE tracks ADD CONSTRAINT tracks_album_id_fkey FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE SET NULL;
    END IF;
    
    -- Add fan_cards user_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fan_cards_user_id_fkey') THEN
        ALTER TABLE fan_cards ADD CONSTRAINT fan_cards_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
    
    -- Add fan_cards album_id foreign key if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fan_cards_album_id_fkey') THEN
        ALTER TABLE fan_cards ADD CONSTRAINT fan_cards_album_id_fkey FOREIGN KEY (album_id) REFERENCES albums(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS on all tables (this is safe to run multiple times)
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
ALTER TABLE fan_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies only if they don't exist
DO $$
BEGIN
    -- Albums policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can view all albums') THEN
        EXECUTE 'CREATE POLICY "Users can view all albums" ON albums FOR SELECT TO authenticated USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can insert their own albums') THEN
        EXECUTE 'CREATE POLICY "Users can insert their own albums" ON albums FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can update their own albums') THEN
        EXECUTE 'CREATE POLICY "Users can update their own albums" ON albums FOR UPDATE TO authenticated USING (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'albums' AND policyname = 'Users can delete their own albums') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own albums" ON albums FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;

    -- Tracks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracks' AND policyname = 'Users can view all tracks') THEN
        EXECUTE 'CREATE POLICY "Users can view all tracks" ON tracks FOR SELECT TO authenticated USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracks' AND policyname = 'Users can insert their own tracks') THEN
        EXECUTE 'CREATE POLICY "Users can insert their own tracks" ON tracks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracks' AND policyname = 'Users can update their own tracks') THEN
        EXECUTE 'CREATE POLICY "Users can update their own tracks" ON tracks FOR UPDATE TO authenticated USING (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tracks' AND policyname = 'Users can delete their own tracks') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own tracks" ON tracks FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;

    -- Fan cards policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fan_cards' AND policyname = 'Users can view all fan_cards') THEN
        EXECUTE 'CREATE POLICY "Users can view all fan_cards" ON fan_cards FOR SELECT TO authenticated USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fan_cards' AND policyname = 'Users can insert their own fan_cards') THEN
        EXECUTE 'CREATE POLICY "Users can insert their own fan_cards" ON fan_cards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fan_cards' AND policyname = 'Users can update their own fan_cards') THEN
        EXECUTE 'CREATE POLICY "Users can update their own fan_cards" ON fan_cards FOR UPDATE TO authenticated USING (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'fan_cards' AND policyname = 'Users can delete their own fan_cards') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own fan_cards" ON fan_cards FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;

    -- Videos policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Users can view all videos') THEN
        EXECUTE 'CREATE POLICY "Users can view all videos" ON videos FOR SELECT TO authenticated USING (true)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Users can insert their own videos') THEN
        EXECUTE 'CREATE POLICY "Users can insert their own videos" ON videos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Users can update their own videos') THEN
        EXECUTE 'CREATE POLICY "Users can update their own videos" ON videos FOR UPDATE TO authenticated USING (auth.uid() = user_id)';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'videos' AND policyname = 'Users can delete their own videos') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own videos" ON videos FOR DELETE TO authenticated USING (auth.uid() = user_id)';
    END IF;
END $$;

-- Create storage buckets (safe to run multiple times with ON CONFLICT)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('music-files', 'music-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('video-files', 'video-files', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('artwork', 'artwork', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (these will only be created if they don't exist)
DO $$
BEGIN
    -- Music files policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own music files') THEN
        EXECUTE 'CREATE POLICY "Users can upload their own music files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''music-files'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Anyone can view music files') THEN
        EXECUTE 'CREATE POLICY "Anyone can view music files" ON storage.objects FOR SELECT TO public USING (bucket_id = ''music-files'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own music files') THEN
        EXECUTE 'CREATE POLICY "Users can update their own music files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''music-files'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own music files') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own music files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''music-files'')';
    END IF;

    -- Video files policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload their own video files') THEN
        EXECUTE 'CREATE POLICY "Users can upload their own video files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''video-files'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Anyone can view video files') THEN
        EXECUTE 'CREATE POLICY "Anyone can view video files" ON storage.objects FOR SELECT TO public USING (bucket_id = ''video-files'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own video files') THEN
        EXECUTE 'CREATE POLICY "Users can update their own video files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''video-files'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own video files') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own video files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''video-files'')';
    END IF;

    -- Artwork policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can upload artwork') THEN
        EXECUTE 'CREATE POLICY "Users can upload artwork" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = ''artwork'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Anyone can view artwork') THEN
        EXECUTE 'CREATE POLICY "Anyone can view artwork" ON storage.objects FOR SELECT TO public USING (bucket_id = ''artwork'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can update their own artwork') THEN
        EXECUTE 'CREATE POLICY "Users can update their own artwork" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = ''artwork'')';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Users can delete their own artwork') THEN
        EXECUTE 'CREATE POLICY "Users can delete their own artwork" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = ''artwork'')';
    END IF;
END $$;
