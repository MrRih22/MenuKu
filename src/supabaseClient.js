import { createClient } from '@supabase/supabase-js';

<<<<<<< HEAD
// Memanggil URL dan Key yang sudah disembunyikan di dalam file .env
=======
>>>>>>> e5b13cade032e9cf2b0fd39eafd0322b495f8b48
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
