import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://frvpzlgzjzopcavcfwpw.supabase.co';
const supabaseAnonKey = 'sb_publishable_Mi18xVU8hk3c1dN04XkIsQ_7Q8WmJ-O';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);