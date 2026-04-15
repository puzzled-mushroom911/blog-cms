import { authenticate, sendError } from '../../_lib/auth.js';
import { getServiceClient } from '../../_lib/supabase.js';
import { apiLimiter } from '../../_lib/rateLimit.js';

export default async function handler(req, res) {
  const { limited } = apiLimiter(req);
  if (limited) return res.status(429).json({ error: 'Too many requests. Please try again later.' });

  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendError(res, 405, 'Method not allowed');
  }

  const auth = await authenticate(req);
  if (auth.error) return sendError(res, auth.status, auth.error);

  const supabase = getServiceClient();
  const { workspace_id } = auth;

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .select('id, name, slug, settings, created_at')
    .eq('id', workspace_id)
    .single();

  if (error || !workspace) {
    return sendError(res, 404, 'Workspace not found');
  }

  // Get counts for context
  const [postsResult, topicsResult] = await Promise.all([
    supabase
      .from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id),
    supabase
      .from('blog_topics')
      .select('id', { count: 'exact', head: true })
      .eq('workspace_id', workspace_id),
  ]);

  return res.status(200).json({
    data: {
      workspace,
      stats: {
        post_count: postsResult.count || 0,
        topic_count: topicsResult.count || 0,
      },
    },
  });
}
