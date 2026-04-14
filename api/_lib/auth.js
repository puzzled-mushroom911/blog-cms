import { createHash } from 'crypto';
import { getServiceClient } from './supabase.js';

/**
 * Authenticate an API request via Bearer token.
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
 * Helper to send JSON error responses.
 */
export function sendError(res, status, message) {
  return res.status(status).json({ error: message });
}
