import { createClient } from '@supabase/supabase-js';

// User's Project URL
const supabaseUrl = 'https://mdjbetqfvelzlbntygyi.supabase.co';

// User's anon public key
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kamJldHFmdmVsemxibnR5Z3lpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI5MTc5MTksImV4cCI6MjA3ODQ5MzkxOX0.3fn1bLRSbNVWDfLpYzL0QvT7yeHSv74oIDZyjuWufwU';

// This creates the Supabase client for the application to use.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
