import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod/v3';
import { authenticate, sendError } from './_lib/auth.js';
import { getServiceClient } from './_lib/supabase.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendError(res, 405, 'Method not allowed');
  }

  const auth = await authenticate(req);
  if (auth.error) return sendError(res, auth.status, auth.error);

  const { workspace_id } = auth;
  const supabase = getServiceClient();

  const server = createMcpServer(supabase, workspace_id);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on('close', () => transport.close());

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}

function createMcpServer(supabase, workspace_id) {
  const server = new McpServer({
    name: 'moonify-cms',
    version: '1.0.0',
  });

  // ── list_posts ──────────────────────────────────────────────
  server.registerTool(
    'list_posts',
    {
      title: 'List Blog Posts',
      description: 'List blog posts. Optionally filter by status.',
      inputSchema: z.object({
        status: z.enum(['draft', 'needs-review', 'published']).optional().describe('Filter by post status'),
        limit: z.number().int().min(1).max(100).optional().default(50).describe('Max results to return'),
      }),
    },
    async ({ status, limit }) => {
      let query = supabase
        .from('blog_posts')
        .select('id, slug, title, excerpt, date, category, tags, status, created_at, updated_at')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return textResult(`Error: ${error.message}`);

      return textResult(
        data.length === 0
          ? 'No posts found.'
          : data.map((p) => `- [${p.status}] "${p.title}" (${p.slug}) — ${p.date || 'no date'}`).join('\n')
      );
    },
  );

  // ── get_post ────────────────────────────────────────────────
  server.registerTool(
    'get_post',
    {
      title: 'Get Blog Post',
      description: 'Get a single blog post by ID or slug. Returns full content blocks.',
      inputSchema: z.object({
        id: z.string().describe('Post UUID or slug'),
      }),
    },
    async ({ id }) => {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
      const column = isUuid ? 'id' : 'slug';

      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq(column, id)
        .single();

      if (error || !data) return textResult('Post not found.');
      return textResult(JSON.stringify(data, null, 2));
    },
  );

  // ── create_post ─────────────────────────────────────────────
  server.registerTool(
    'create_post',
    {
      title: 'Create Blog Post',
      description: 'Create a new blog post. Content is an array of blocks: paragraph, heading, subheading, list, process-steps, callout, quote, info-box, image, table, stat-cards, pros-cons, prompt.',
      inputSchema: z.object({
        title: z.string().describe('Post title'),
        slug: z.string().optional().describe('URL slug (auto-generated from title if omitted)'),
        excerpt: z.string().optional().describe('Short description'),
        date: z.string().optional().describe('Publish date (YYYY-MM-DD)'),
        read_time: z.string().optional().describe('e.g. "5 min read"'),
        author: z.string().optional().describe('Author name'),
        category: z.string().optional().describe('General, How-To, Guide, Review, News, Tips, Case Study, Comparison'),
        tags: z.array(z.string()).optional().describe('Tag strings'),
        youtube_id: z.string().optional().describe('YouTube video ID'),
        image: z.string().optional().describe('Featured image URL'),
        meta_description: z.string().optional().describe('SEO meta description'),
        keywords: z.string().optional().describe('SEO keywords'),
        content: z.array(z.record(z.any())).optional().describe('Array of content block objects'),
        status: z.enum(['draft', 'needs-review', 'published']).optional().default('draft'),
        sources: z.array(z.object({
          url: z.string().optional(),
          title: z.string().optional(),
          type: z.enum(['reddit', 'youtube', 'government', 'news', 'data', 'mls', 'local', 'other']).optional(),
          note: z.string().optional().describe('Why this source matters'),
        })).optional().describe('Research sources (internal only, not shown on public site)'),
        ai_reasoning: z.string().optional().describe('How the AI researched and structured the content (internal only)'),
      }),
    },
    async (args) => {
      const slug = args.slug || args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

      const record = {
        workspace_id,
        title: args.title,
        slug,
        excerpt: args.excerpt || '',
        date: args.date || new Date().toISOString().split('T')[0],
        read_time: args.read_time || '1 min read',
        author: args.author || 'Aaron Chand',
        category: args.category || 'General',
        tags: args.tags || [],
        youtube_id: args.youtube_id || null,
        image: args.image || '',
        meta_description: args.meta_description || '',
        keywords: args.keywords || '',
        content: args.content || [],
        original_content: args.content || [],
        status: args.status,
        editor_notes: [],
        sources: args.sources || [],
        ai_reasoning: args.ai_reasoning || '',
      };

      const { data, error } = await supabase
        .from('blog_posts')
        .insert(record)
        .select('id, slug, title, status')
        .single();

      if (error) return textResult(`Error creating post: ${error.message}`);
      return textResult(`Created post "${data.title}" (${data.slug}) with status ${data.status}. ID: ${data.id}`);
    },
  );

  // ── update_post ─────────────────────────────────────────────
  server.registerTool(
    'update_post',
    {
      title: 'Update Blog Post',
      description: 'Update an existing blog post. Partial updates — only include fields you want to change.',
      inputSchema: z.object({
        id: z.string().describe('Post UUID'),
        title: z.string().optional(),
        slug: z.string().optional(),
        excerpt: z.string().optional(),
        date: z.string().optional(),
        read_time: z.string().optional(),
        author: z.string().optional(),
        category: z.string().optional(),
        tags: z.array(z.string()).optional(),
        youtube_id: z.string().optional(),
        image: z.string().optional(),
        meta_description: z.string().optional(),
        keywords: z.string().optional(),
        content: z.array(z.record(z.any())).optional(),
        status: z.enum(['draft', 'needs-review', 'published']).optional(),
        editor_notes: z.array(z.record(z.any())).optional(),
        sources: z.array(z.object({
          url: z.string().optional(),
          title: z.string().optional(),
          type: z.enum(['reddit', 'youtube', 'government', 'news', 'data', 'mls', 'local', 'other']).optional(),
          note: z.string().optional(),
        })).optional(),
        ai_reasoning: z.string().optional(),
      }),
    },
    async ({ id, ...fields }) => {
      const updates = {};
      for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined) updates[key] = val;
      }

      if (Object.keys(updates).length === 0) {
        return textResult('No fields provided to update.');
      }

      const { data, error } = await supabase
        .from('blog_posts')
        .update(updates)
        .eq('workspace_id', workspace_id)
        .eq('id', id)
        .select('id, slug, title, status')
        .single();

      if (error || !data) return textResult('Post not found or update failed.');
      return textResult(`Updated post "${data.title}" (${data.slug}). Status: ${data.status}`);
    },
  );

  // ── publish_post ────────────────────────────────────────────
  server.registerTool(
    'publish_post',
    {
      title: 'Publish Blog Post',
      description: 'Set a post status to "published".',
      inputSchema: z.object({
        id: z.string().describe('Post UUID'),
      }),
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from('blog_posts')
        .update({ status: 'published' })
        .eq('workspace_id', workspace_id)
        .eq('id', id)
        .select('id, slug, title')
        .single();

      if (error || !data) return textResult('Post not found.');
      return textResult(`Published "${data.title}" (${data.slug}).`);
    },
  );

  // ── delete_post ─────────────────────────────────────────────
  server.registerTool(
    'delete_post',
    {
      title: 'Delete Blog Post',
      description: 'Permanently delete a blog post.',
      inputSchema: z.object({
        id: z.string().describe('Post UUID'),
      }),
    },
    async ({ id }) => {
      const { error } = await supabase
        .from('blog_posts')
        .delete()
        .eq('workspace_id', workspace_id)
        .eq('id', id);

      if (error) return textResult(`Error: ${error.message}`);
      return textResult('Post deleted.');
    },
  );

  // ── list_topics ─────────────────────────────────────────────
  server.registerTool(
    'list_topics',
    {
      title: 'List Blog Topics',
      description: 'List blog topics from the research pipeline. Optionally filter by status.',
      inputSchema: z.object({
        status: z.enum(['researched', 'approved', 'discarded', 'writing', 'written']).optional().describe('Filter by topic status'),
        limit: z.number().int().min(1).max(100).optional().default(50),
      }),
    },
    async ({ status, limit }) => {
      let query = supabase
        .from('blog_topics')
        .select('id, title, primary_keyword, search_volume, keyword_difficulty, competition_level, status, notes, created_at')
        .eq('workspace_id', workspace_id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (status) query = query.eq('status', status);

      const { data, error } = await query;
      if (error) return textResult(`Error: ${error.message}`);

      return textResult(
        data.length === 0
          ? 'No topics found.'
          : data.map((t) => `- [${t.status}] "${t.title}" — KW: ${t.primary_keyword || 'n/a'}, Vol: ${t.search_volume || '?'}, KD: ${t.keyword_difficulty || '?'}`).join('\n')
      );
    },
  );

  // ── get_topic ───────────────────────────────────────────────
  server.registerTool(
    'get_topic',
    {
      title: 'Get Blog Topic',
      description: 'Get a single topic by ID, including full research data.',
      inputSchema: z.object({
        id: z.string().describe('Topic UUID'),
      }),
    },
    async ({ id }) => {
      const { data, error } = await supabase
        .from('blog_topics')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('id', id)
        .single();

      if (error || !data) return textResult('Topic not found.');
      return textResult(JSON.stringify(data, null, 2));
    },
  );

  // ── create_topic ────────────────────────────────────────────
  server.registerTool(
    'create_topic',
    {
      title: 'Create Blog Topic',
      description: 'Create a new topic in the research pipeline with keyword data.',
      inputSchema: z.object({
        title: z.string().describe('Topic name / working title'),
        primary_keyword: z.string().optional().describe('Main target keyword'),
        secondary_keywords: z.array(z.string()).optional(),
        search_volume: z.number().int().optional().describe('Monthly search volume'),
        keyword_difficulty: z.number().int().min(0).max(100).optional(),
        cpc: z.number().optional().describe('Cost per click'),
        competition_level: z.enum(['low', 'medium', 'high']).optional(),
        status: z.enum(['researched', 'approved', 'discarded', 'writing', 'written']).optional().default('researched'),
        research_data: z.record(z.any()).optional().describe('Full research payload (JSONB)'),
        notes: z.string().optional(),
      }),
    },
    async (args) => {
      const record = {
        workspace_id,
        title: args.title,
        primary_keyword: args.primary_keyword || null,
        secondary_keywords: args.secondary_keywords || [],
        search_volume: args.search_volume || null,
        keyword_difficulty: args.keyword_difficulty || null,
        cpc: args.cpc || null,
        competition_level: args.competition_level || null,
        status: args.status,
        research_data: args.research_data || null,
        notes: args.notes || null,
      };

      const { data, error } = await supabase
        .from('blog_topics')
        .insert(record)
        .select('id, title, status')
        .single();

      if (error) return textResult(`Error: ${error.message}`);
      return textResult(`Created topic "${data.title}" [${data.status}]. ID: ${data.id}`);
    },
  );

  // ── update_topic ────────────────────────────────────────────
  server.registerTool(
    'update_topic',
    {
      title: 'Update Blog Topic',
      description: 'Update a topic (status, notes, research_data, etc.). Partial updates.',
      inputSchema: z.object({
        id: z.string().describe('Topic UUID'),
        title: z.string().optional(),
        primary_keyword: z.string().optional(),
        secondary_keywords: z.array(z.string()).optional(),
        search_volume: z.number().int().optional(),
        keyword_difficulty: z.number().int().min(0).max(100).optional(),
        cpc: z.number().optional(),
        competition_level: z.enum(['low', 'medium', 'high']).optional(),
        status: z.enum(['researched', 'approved', 'discarded', 'writing', 'written']).optional(),
        research_data: z.record(z.any()).optional(),
        blog_post_id: z.string().optional(),
        notes: z.string().optional(),
      }),
    },
    async ({ id, ...fields }) => {
      const updates = {};
      for (const [key, val] of Object.entries(fields)) {
        if (val !== undefined) updates[key] = val;
      }

      if (Object.keys(updates).length === 0) {
        return textResult('No fields provided to update.');
      }

      const { data, error } = await supabase
        .from('blog_topics')
        .update(updates)
        .eq('workspace_id', workspace_id)
        .eq('id', id)
        .select('id, title, status')
        .single();

      if (error || !data) return textResult('Topic not found or update failed.');
      return textResult(`Updated topic "${data.title}" [${data.status}].`);
    },
  );

  // ── list_preferences ────────────────────────────────────────
  server.registerTool(
    'list_preferences',
    {
      title: 'List Writing Preferences',
      description: 'List active writing style preferences for this workspace.',
      inputSchema: z.object({}),
    },
    async () => {
      const { data, error } = await supabase
        .from('preferences')
        .select('*')
        .eq('workspace_id', workspace_id)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (error) return textResult(`Error: ${error.message}`);

      return textResult(
        data.length === 0
          ? 'No active preferences.'
          : data.map((p) => `- [${p.category}] ${p.rule}`).join('\n')
      );
    },
  );

  // ── create_preference ───────────────────────────────────────
  server.registerTool(
    'create_preference',
    {
      title: 'Create Writing Preference',
      description: 'Add a new style preference rule.',
      inputSchema: z.object({
        rule: z.string().describe('Style directive text'),
        category: z.enum(['tone', 'structure', 'vocabulary', 'formatting']).optional().default('tone'),
        active: z.boolean().optional().default(true),
      }),
    },
    async (args) => {
      const { data, error } = await supabase
        .from('preferences')
        .insert({
          workspace_id,
          rule: args.rule,
          category: args.category,
          active: args.active,
        })
        .select('id, rule, category')
        .single();

      if (error) return textResult(`Error: ${error.message}`);
      return textResult(`Created preference [${data.category}]: "${data.rule}"`);
    },
  );

  // ── get_workspace_info ──────────────────────────────────────
  server.registerTool(
    'get_workspace_info',
    {
      title: 'Get Workspace Info',
      description: 'Returns workspace name, settings, and stats (post count, topic count).',
      inputSchema: z.object({}),
    },
    async () => {
      const [wsResult, postsResult, topicsResult] = await Promise.all([
        supabase
          .from('workspaces')
          .select('id, name, slug, settings, created_at')
          .eq('id', workspace_id)
          .single(),
        supabase
          .from('blog_posts')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspace_id),
        supabase
          .from('blog_topics')
          .select('id', { count: 'exact', head: true })
          .eq('workspace_id', workspace_id),
      ]);

      if (wsResult.error || !wsResult.data) return textResult('Workspace not found.');

      const info = {
        workspace: wsResult.data,
        stats: {
          post_count: postsResult.count || 0,
          topic_count: topicsResult.count || 0,
        },
      };

      return textResult(JSON.stringify(info, null, 2));
    },
  );

  return server;
}

function textResult(text) {
  return { content: [{ type: 'text', text }] };
}
