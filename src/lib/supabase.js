import { createClient } from '@supabase/supabase-js';

const STORAGE_KEY = 'blog-cms-connection';
let _client = null;

export function getStoredConnection() {
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
