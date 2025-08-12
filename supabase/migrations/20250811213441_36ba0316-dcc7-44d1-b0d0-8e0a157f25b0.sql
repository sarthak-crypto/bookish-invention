
-- Add artist fields to the albums table
ALTER TABLE albums 
ADD COLUMN artist_name TEXT,
ADD COLUMN artist_bio TEXT;
