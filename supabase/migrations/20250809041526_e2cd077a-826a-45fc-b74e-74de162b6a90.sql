
-- Add foreign key relationship between albums and profiles
ALTER TABLE albums 
ADD CONSTRAINT fk_albums_user_profiles 
FOREIGN KEY (user_id) REFERENCES profiles(id);
