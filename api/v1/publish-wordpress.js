import { authenticateAny, sendError } from '../_lib/auth.js';
import { getServiceClient } from '../_lib/supabase.js';
import { blocksToHtml, publishToWordPress } from '../_lib/wordpress.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed');
  }

  const auth = await authenticateAny(req);
  if (auth.error) return sendError(res, auth.status, auth.error);

  const supabase = getServiceClient();
  const { workspace_id } = auth;

  // Post ID from request body
  let postId;
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    postId = body?.post_id;
  } catch {
    return sendError(res, 400, 'Invalid request body');
  }

  if (!postId) {
    return sendError(res, 400, 'Missing post_id in request body');
  }

  // 1. Load the post
  const { data: post, error: postError } = await supabase
    .from('blog_posts')
    .select('id, title, slug, excerpt, content, status')
    .eq('workspace_id', workspace_id)
    .eq('id', postId)
    .single();

  if (postError || !post) {
    return sendError(res, 404, 'Post not found');
  }

  // 2. Load WordPress credentials from workspace settings
  const { data: workspace, error: wsError } = await supabase
    .from('workspaces')
    .select('settings')
    .eq('id', workspace_id)
    .single();

  if (wsError || !workspace) {
    return sendError(res, 500, 'Could not load workspace settings');
  }

  const wp = workspace.settings?.wordpress;
  if (!wp || !wp.site_url || !wp.username || !wp.app_password) {
    return sendError(
      res,
      400,
      'WordPress is not configured. Go to Settings > WordPress Connection to add your site URL, username, and application password.'
    );
  }

  // 3. Convert content blocks to HTML
  const htmlContent = blocksToHtml(post.content);

  // 4. Publish to WordPress
  try {
    const result = await publishToWordPress({
      siteUrl: wp.site_url,
      username: wp.username,
      appPassword: wp.app_password,
      title: post.title,
      content: htmlContent,
      excerpt: post.excerpt || '',
      slug: post.slug,
      status: 'draft',
    });

    return res.status(200).json({
      success: true,
      wordpress_url: result.url,
      wordpress_id: result.id,
    });
  } catch (err) {
    return sendError(res, 502, err.message || 'Failed to publish to WordPress');
  }
}
