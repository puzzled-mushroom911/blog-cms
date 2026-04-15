import { authenticate, sendError } from '../../_lib/auth.js';
import { getServiceClient } from '../../_lib/supabase.js';
import { apiLimiter } from '../../_lib/rateLimit.js';
import { validateTopic } from '../../_lib/validate.js';

export default async function handler(req, res) {
  const { limited } = apiLimiter(req);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  const auth = await authenticate(req);
  if (auth.error) return sendError(res, auth.status, auth.error);

  const supabase = getServiceClient();
  const { workspace_id } = auth;

  if (req.method === 'GET') {
    return listTopics(req, res, supabase, workspace_id);
  } else if (req.method === 'POST') {
    return createTopic(req, res, supabase, workspace_id);
  } else {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Method not allowed');
  }
}

async function listTopics(req, res, supabase, workspace_id) {
  const { status, limit = '50', offset = '0' } = req.query;

  let query = supabase
    .from('blog_topics')
    .select('id, title, primary_keyword, search_volume, keyword_difficulty, competition_level, status, blog_post_id, notes, created_at, updated_at')
    .eq('workspace_id', workspace_id)
    .order('created_at', { ascending: false })
    .range(parseInt(offset), parseInt(offset) + parseInt(limit) - 1);

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) return sendError(res, 500, error.message);
  return res.status(200).json({ data });
}

async function createTopic(req, res, supabase, workspace_id) {
  const body = req.body;
  const { valid, error: validationError } = validateTopic(body);
  if (!valid) return sendError(res, 400, validationError);

  const record = {
    workspace_id,
    title: body.title,
    primary_keyword: body.primary_keyword || null,
    secondary_keywords: body.secondary_keywords || [],
    search_volume: body.search_volume || null,
    keyword_difficulty: body.keyword_difficulty || null,
    cpc: body.cpc || null,
    competition_level: body.competition_level || null,
    status: body.status || 'researched',
    research_data: body.research_data || null,
    notes: body.notes || null,
  };

  const { data, error } = await supabase
    .from('blog_topics')
    .insert(record)
    .select()
    .single();

  if (error) return sendError(res, 500, error.message);
  return res.status(201).json({ data });
}
