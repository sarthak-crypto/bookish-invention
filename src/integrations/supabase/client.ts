// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://pmrqueeoojexmuuyefba.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBtcnF1ZWVvb2pleG11dXllZmJhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzOTI2NjUsImV4cCI6MjA2Mzk2ODY2NX0.w4YtWj7DjXgN2vDpUyXmKz83_vD4FFnVHJM-0EgwFpY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);