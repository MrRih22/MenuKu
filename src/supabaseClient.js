import { createClient } from '@supabase/supabase-js';

// Memanggil URL dan Key yang sudah disembunyikan di dalam file .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);