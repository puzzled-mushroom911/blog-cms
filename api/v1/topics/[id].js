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
  const { id } = req.query;

  if (req.method === 'GET') {
    return getTopic(res, supabase, workspace_id, id);
  } else if (req.method === 'PATCH') {
    return updateTopic(req, res, supabase, workspace_id, id);
  } else {
    res.setHeader('Allow', 'GET, PATCH');
    return sendError(res, 405, 'Method not allowed');
  }
}

async function getTopic(res, supabase, workspace_id, id) {
  const { data, error } = await supabase
    .from('blog_topics')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq('id', id)
    .single();

  if (error || !data) return sendError(res, 404, 'Topic not found');
  return res.status(200).json({ data });
}

async function updateTopic(req, res, supabase, workspace_id, id) {
  const body = req.body;
  if (!body || Object.keys(body).length === 0) {
    return sendError(res, 400, 'Request body is required');
  }

  const allowed = [
    'title', 'primary_keyword', 'secondary_keywords', 'search_volume',
    'keyword_difficulty', 'cpc', 'competition_level', 'status',
    'research_data', 'blog_post_id', 'notes',
  ];

  const updates = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'No valid fields to update');
  }

  const { data, error } = await supabase
    .from('blog_topics')
    .update(updates)
    .eq('workspace_id', workspace_id)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return sendError(res, 404, 'Topic not found');
  return res.status(200).json({ data });
}
