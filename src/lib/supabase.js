import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'blog-cms-connection';
let _client = null;

/**
 * Check if the app is running in hosted mode (env vars set at build time).
 * In hosted mode, users don't need to provide their own Supabase credentials.
 */
export const HOSTED_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const HOSTED_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const isHostedMode = !!(HOSTED_SUPABASE_URL && HOSTED_SUPABASE_ANON_KEY);

export function getStoredConnection() {
  // In hosted mode, credentials come from env vars
  if (isHostedMode) {
    return { url: HOSTED_SUPABASE_URL, anonKey: HOSTED_SUPABASE_ANON_KEY };
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.url && parsed?.anonKey) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveConnection(url, anonKey) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, anonKey }));
  _client = createClient(url, anonKey);
  return _client;
}

export function clearConnection() {
  localStorage.removeItem(STORAGE_KEY);
  _client = null;
}

export function getClient() {
  if (_client) return _client;
  const conn = getStoredConnection();
  if (!conn) return null;
  _client = createClient(conn.url, conn.anonKey);
  return _client;
}
