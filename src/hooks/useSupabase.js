import { useConnection } from '../contexts/ConnectionContext';

export function useSupabase() {
  const { supabase } = useConnection();
  if (!supabase) throw new Error('Not connected to Supabase');
  return supabase;
}
