
-- Update RLS policy to allow public read access to all fan cards for marketplace
-- This will allow users to see all fan cards in the marketplace, not just their own
DROP POLICY IF EXISTS "Users can view all fan_cards" ON fan_cards;

-- Create a new policy that allows everyone to view all fan cards
CREATE POLICY "Public can view all fan cards" 
  ON fan_cards 
  FOR SELECT 
  USING (true);

-- Ensure users can still only modify their own fan cards
-- (This policy should already exist, but let's make sure it's correct)
DROP POLICY IF EXISTS "Users can update their own fan cards" ON fan_cards;
CREATE POLICY "Users can update their own fan cards" 
  ON fan_cards 
  FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own fan cards" ON fan_cards;
CREATE POLICY "Users can delete their own fan cards" 
  ON fan_cards 
  FOR DELETE 
  USING (auth.uid() = user_id);
