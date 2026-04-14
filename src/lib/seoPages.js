import { getClient } from './supabase';

/**
 * Fetch SEO pages with optional filters.
 * @param {Object} filters - { status, page_type, search }
 * @param {string} orderBy - Column to order by (default: 'created_at')
 * @param {boolean} ascending - Sort direction (default: false = newest first)
 * @param {string|null} workspaceId - Workspace ID for scoping
 */
export async function fetchSeoPages({ status, page_type, search } = {}, orderBy = 'created_at', ascending = false, workspaceId = null) {
  const supabase = getClient();
  let query = supabase
    .from('seo_pages')
    .select('id, slug, page_type, title, h1, meta_description, keywords, status, scheduled_date, created_at, updated_at')
    .order(orderBy, { ascending });

  if (workspaceId) query = query.eq('workspace_id', workspaceId);
  if (status) query = query.eq('status', status);
  if (page_type) query = query.eq('page_type', page_type);
  if (search) query = query.ilike('title', `%${search}%`);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch a single SEO page by ID (full record including content and data).
 */
export async function fetchSeoPageById(id, workspaceId = null) {
  const supabase = getClient();
  let query = supabase
    .from('seo_pages')
    .select('*')
    .eq('id', id);
  if (workspaceId) query = query.eq('workspace_id', workspaceId);

  const { data, error } = await query.single();
  if (error) throw error;
  return data;
}

/**
 * Update an SEO page. Accepts partial updates.
 */
export async function updateSeoPage(id, updates) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('seo_pages')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Delete an SEO page.
 */
export async function deleteSeoPage(id) {
  const supabase = getClient();
  const { error } = await supabase
    .from('seo_pages')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Approve a single SEO page: set status to 'published', optionally set scheduled_date.
 * Fires the deploy hook if VITE_DEPLOY_HOOK_URL is set.
 */
export async function approveSeoPage(id, scheduledDate = null) {
  const updates = { status: 'published' };
  if (scheduledDate) updates.scheduled_date = scheduledDate;

  const page = await updateSeoPage(id, updates);

  // Fire deploy hook (best-effort)
  const hookUrl = import.meta.env.VITE_DEPLOY_HOOK_URL;
  if (hookUrl) {
    fetch(hookUrl, { method: 'POST' }).catch(() => {});
  }

  return page;
}

/**
 * Batch approve multiple SEO pages.
 * @param {string[]} ids - Array of page IDs to approve
 */
export async function batchApproveSeoPages(ids) {
  const supabase = getClient();
  const { data, error } = await supabase
    .from('seo_pages')
    .update({ status: 'published' })
    .in('id', ids)
    .select();

  if (error) throw error;

  // Fire deploy hook once for the batch
  const hookUrl = import.meta.env.VITE_DEPLOY_HOOK_URL;
  if (hookUrl) {
    fetch(hookUrl, { method: 'POST' }).catch(() => {});
  }

  return data;
}

/**
 * Fetch pages for the approval queue: needs-review pages, ordered by scheduled_date.
 */
export async function fetchApprovalQueue(workspaceId = null) {
  const supabase = getClient();
  let query = supabase
    .from('seo_pages')
    .select('id, slug, page_type, title, h1, meta_description, keywords, status, scheduled_date, content, created_at')
    .eq('status', 'needs-review')
    .order('scheduled_date', { ascending: true, nullsFirst: false });

  if (workspaceId) query = query.eq('workspace_id', workspaceId);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}

/**
 * Fetch all scheduled content (blog_posts + seo_pages) for a given month.
 * Returns unified items with a `content_type` field ('blog' or 'seo').
 */
export async function fetchCalendarItems(year, month, workspaceId = null) {
  const supabase = getClient();
  const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, '0')}-01`;

  // Fetch blog posts with a date in this month
  let blogQuery = supabase
    .from('blog_posts')
    .select('id, title, slug, status, date, category')
    .gte('date', startDate)
    .lt('date', endDate)
    .order('date', { ascending: true });
  if (workspaceId) blogQuery = blogQuery.eq('workspace_id', workspaceId);

  const { data: blogs, error: blogError } = await blogQuery;
  if (blogError) throw blogError;

  // Fetch SEO pages with a scheduled_date in this month
  let seoQuery = supabase
    .from('seo_pages')
    .select('id, title, slug, status, scheduled_date, page_type')
    .gte('scheduled_date', startDate)
    .lt('scheduled_date', endDate)
    .order('scheduled_date', { ascending: true });
  if (workspaceId) seoQuery = seoQuery.eq('workspace_id', workspaceId);

  const { data: seoPages, error: seoError } = await seoQuery;
  if (seoError) throw seoError;

  // Unify into calendar items
  const items = [
    ...blogs.map(b => ({
      id: b.id,
      title: b.title,
      slug: b.slug,
      status: b.status,
      date: b.date,
      content_type: 'blog',
      label: b.category || 'Blog',
    })),
    ...seoPages.map(p => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      date: p.scheduled_date,
      content_type: 'seo',
      label: p.page_type,
    })),
  ];

  return items;
}

/**
 * Fetch editorial research entries, optionally filtered.
 */
export async function fetchEditorialResearch({ unused_only = false, source_type } = {}, workspaceId = null) {
  const supabase = getClient();
  let query = supabase
    .from('editorial_research')
    .select('*')
    .order('created_at', { ascending: false });

  if (workspaceId) query = query.eq('workspace_id', workspaceId);
  if (unused_only) query = query.is('used_in_post_id', null);
  if (source_type) query = query.eq('source_type', source_type);

  const { data, error } = await query;
  if (error) throw error;
  return data;
}
