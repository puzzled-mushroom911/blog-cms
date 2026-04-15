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
    return getPost(res, supabase, workspace_id, id);
  } else if (req.method === 'PATCH') {
    return updatePost(req, res, supabase, workspace_id, id);
  } else if (req.method === 'DELETE') {
    return deletePost(res, supabase, workspace_id, id);
  } else {
    res.setHeader('Allow', 'GET, PATCH, DELETE');
    return sendError(res, 405, 'Method not allowed');
  }
}

async function getPost(res, supabase, workspace_id, id) {
  // Support lookup by ID or slug
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
  const column = isUuid ? 'id' : 'slug';

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('workspace_id', workspace_id)
    .eq(column, id)
    .single();

  if (error || !data) return sendError(res, 404, 'Post not found');
  return res.status(200).json({ data });
}

async function updatePost(req, res, supabase, workspace_id, id) {
  const body = req.body;
  if (!body || Object.keys(body).length === 0) {
    return sendError(res, 400, 'Request body is required');
  }

  // Only allow updating known columns
  const allowed = [
    'title', 'slug', 'excerpt', 'date', 'read_time', 'author',
    'category', 'tags', 'youtube_id', 'image', 'meta_description',
    'keywords', 'content', 'status', 'editor_notes',
    'sources', 'ai_reasoning',
  ];

  const updates = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return sendError(res, 400, 'No valid fields to update');
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updates)
    .eq('workspace_id', workspace_id)
    .eq('id', id)
    .select()
    .single();

  if (error || !data) return sendError(res, 404, 'Post not found');
  return res.status(200).json({ data });
}

async function deletePost(res, supabase, workspace_id, id) {
  const { error } = await supabase
    .from('blog_posts')
    .delete()
    .eq('workspace_id', workspace_id)
    .eq('id', id);

  if (error) return sendError(res, 500, error.message);
  return res.status(200).json({ data: { deleted: true } });
}
