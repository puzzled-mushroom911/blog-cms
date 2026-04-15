import { createHash } from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { getServiceClient } from './supabase.js';

/**
 * Authenticate an API request via Bearer token (API key).
 * Returns { workspace_id } on success, or { error, status } on failure.
 */
export async function authenticate(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 };
  }

  const apiKey = authHeader.slice(7);
  if (!apiKey.startsWith('sk_live_')) {
    return { error: 'Invalid API key format', status: 401 };
  }

  const keyHash = createHash('sha256').update(apiKey).digest('hex');
  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from('api_keys')
    .select('id, workspace_id')
    .eq('key_hash', keyHash)
    .single();

  if (error || !data) {
    return { error: 'Invalid API key', status: 401 };
  }

  // Update last_used_at (fire-and-forget)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', data.id)
    .then(() => {});

  return { workspace_id: data.workspace_id };
}

/**
 * Authenticate via Supabase session JWT (for browser-initiated requests).
 * Returns { workspace_id } on success, or { error, status } on failure.
 */
export async function authenticateSession(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 };
  }

  const token = authHeader.slice(7);

  // If it looks like an API key, reject — use authenticate() instead
  if (token.startsWith('sk_live_')) {
    return { error: 'Use API key auth for this token type', status: 401 };
  }

  // Verify the JWT with Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) {
    return { error: 'Invalid session token', status: 401 };
  }

  // Look up the user's workspace
  const { data: membership } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)
    .limit(1)
    .single();

  if (!membership) {
    return { error: 'No workspace found for this user', status: 403 };
  }

  return { workspace_id: membership.workspace_id };
}

/**
 * Try API key auth first, then fall back to session auth.
 * Returns { workspace_id } on success, or { error, status } on failure.
 */
export async function authenticateAny(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Missing or invalid Authorization header', status: 401 };
  }

  const token = authHeader.slice(7);
  if (token.startsWith('sk_live_')) {
    return authenticate(req);
  }
  return authenticateSession(req);
}

/**
 * Helper to send JSON error responses.
 */
export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
