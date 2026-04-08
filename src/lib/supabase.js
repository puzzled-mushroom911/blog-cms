import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables.\n' +
    'Copy .env.example to .env and fill in your Supabase project URL and anon key.\n' +
    'You can find these at: https://app.supabase.com → Your Project → Settings → API'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
