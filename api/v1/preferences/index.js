import { authenticate, sendError } from '../../_lib/auth.js';
import { getServiceClient } from '../../_lib/supabase.js';
import { apiLimiter } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  const { limited } = apiLimiter(req);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const auth = await authenticate(req);
  if (auth.error) return sendError(res, auth.status, auth.error);

  const supabase = getServiceClient();
  const { workspace_id } = auth;

  if (req.method === 'GET') {
    return listPreferences(res, supabase, workspace_id);
  } else if (req.method === 'POST') {
    return createPreference(req, res, supabase, workspace_id);
  } else {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Method not allowed');
  }
}

async function listPreferences(res, supabase, workspace_id) {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('active', true)
    .order('created_at', { ascending: false });

  if (error) return sendError(res, 500, error.message);
  return res.status(200).json({ data });
}

async function createPreference(req, res, supabase, workspace_id) {
  const body = req.body;
  if (!body || !body.rule) {
    return sendError(res, 400, 'rule is required');
  }

  const record = {
    workspace_id,
    rule: body.rule,
    category: body.category || 'tone',
    active: body.active !== undefined ? body.active : true,
  };

  const { data, error } = await supabase
    .from('preferences')
    .insert(record)
    .select()
    .single();

  if (error) return sendError(res, 500, error.message);
  return res.status(201).json({ data });
}
