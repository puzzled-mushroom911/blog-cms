import { authenticate, sendError } from '../../_lib/auth.js';
import { getServiceClient } from '../../_lib/supabase.js';

export default async function handler(req, res) {
  const auth = await authenticate(req);
  if (auth.error) return sendError(res, auth.status, auth.error);

  const supabase = getServiceClient();
  const { workspace_id } = auth;

  if (req.method === 'GET') {
    return listPosts(req, res, supabase, workspace_id);
  } else if (req.method === 'POST') {
    return createPost(req, res, supabase, workspace_id);
  } else {
    res.setHeader('Allow', 'GET, POST');
    return sendError(res, 405, 'Method not allowed');
  }
}

async function listPosts(req, res, supabase, workspace_id) {
  const { status, limit = '50', offset = '0' } = req.query;

  let query = supabase
    .from('blog_posts')
    .select('id, slug, title, excerpt, date, category, tags, status, created_at, updated_at')
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

async function createPost(req, res, supabase, workspace_id) {
  const body = req.body;
  if (!body || !body.title) {
    return sendError(res, 400, 'title is required');
  }

  const slug = body.slug || body.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const record = {
    workspace_id,
    title: body.title,
    slug,
    excerpt: body.excerpt || null,
    date: body.date || new Date().toISOString().split('T')[0],
    read_time: body.read_time || null,
    author: body.author || null,
    category: body.category || null,
    tags: body.tags || [],
    youtube_id: body.youtube_id || null,
    image: body.image || null,
    meta_description: body.meta_description || null,
    keywords: body.keywords || null,
    content: body.content || [],
    original_content: body.content || [],
    status: body.status || 'draft',
    editor_notes: body.editor_notes || [],
    sources: body.sources || [],
    ai_reasoning: body.ai_reasoning || '',
  };

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(record)
    .select()
    .single();

  if (error) return sendError(res, 500, error.message);
  return res.status(201).json({ data });
}
