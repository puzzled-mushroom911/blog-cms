import { createClient } from '@supabase/supabase-js';

const CONNECTION_KEY = 'blog-cms-connection';
const MODE_KEY = 'blog-cms-mode';
let _client = null;

// Hosted Supabase credentials (baked in at build time, always available)
export const HOSTED_URL = import.meta.env.VITE_SUPABASE_URL || '';
export const HOSTED_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
export const hasHostedCredentials = !!(HOSTED_URL && HOSTED_ANON_KEY);

/**
 * Connection mode:
 *  'hosted' — using Moonify's Supabase (env var credentials)
 *  'byo'    — using the user's own Supabase (localStorage credentials)
 *  null     — not yet chosen
 */
export function getConnectionMode() {
  return localStorage.getItem(MODE_KEY);
}

export function setConnectionMode(mode) {
  localStorage.setItem(MODE_KEY, mode);
  _client = null; // Force client recreation on next getClient()
}

export function getStoredConnection() {
  const mode = getConnectionMode();

  if (mode === 'hosted' && hasHostedCredentials) {
    return { url: HOSTED_URL, anonKey: HOSTED_ANON_KEY };
  }

  if (mode === 'byo') {
    try {
      const raw = localStorage.getItem(CONNECTION_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.anonKey) return parsed;
      return null;
    } catch {
      return null;
    }
  }

  // No mode chosen yet — check if there's a legacy connection in localStorage
  try {
    const raw = localStorage.getItem(CONNECTION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.url && parsed?.anonKey) {
        // Migrate: mark as BYO if credentials differ from hosted, otherwise hosted
        if (hasHostedCredentials && parsed.url === HOSTED_URL) {
          localStorage.setItem(MODE_KEY, 'hosted');
        } else {
          localStorage.setItem(MODE_KEY, 'byo');
        }
        return parsed;
      }
    }
  } catch {}

  // Check if hosted credentials exist and user has an auth session (returning hosted user)
  if (hasHostedCredentials) {
    const hasSession = Object.keys(localStorage).some(k => k.includes('supabase') && k.includes('auth-token'));
    if (hasSession) {
      localStorage.setItem(MODE_KEY, 'hosted');
      return { url: HOSTED_URL, anonKey: HOSTED_ANON_KEY };
    }
  }

  return null;
}

export function saveConnection(url, anonKey) {
  localStorage.setItem(CONNECTION_KEY, JSON.stringify({ url, anonKey }));
  setConnectionMode('byo');
  _client = createClient(url, anonKey);
  return _client;
}

export function clearConnection() {
  localStorage.removeItem(CONNECTION_KEY);
  localStorage.removeItem(MODE_KEY);
  _client = null;
}

export function getClient() {
  if (_client) return _client;
  const conn = getStoredConnection();
  if (!conn) return null;
  _client = createClient(conn.url, conn.anonKey);
  return _client;
}
