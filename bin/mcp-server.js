#!/usr/bin/env node

/**
 * Blog CMS — MCP Server for Claude Desktop
 *
 * Install in Claude Desktop config (~/Library/Application Support/Claude/claude_desktop_config.json):
 *
 *   "blog-cms": {
 *     "command": "npx",
 *     "args": ["-y", "github:puzzled-mushroom911/blog-cms"],
 *     "env": {
 *       "SUPABASE_URL": "https://your-project.supabase.co",
 *       "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
 *     }
 *   }
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod/v3';

// ── Config ──────────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
  console.error('Set them in your Claude Desktop MCP server config.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Workspace auto-detect ───────────────────────────────────

let workspace_id = process.env.WORKSPACE_ID || null;

async function ensureWorkspace() {
  if (workspace_id) return;

  const { data } = await supabase
    .from('workspaces')
    .select('id, name')
    .limit(1)
    .single();

  if (data) {
    workspace_id = data.id;
  } else {
    console.error('No workspace found. Create one in the CMS first.');
    process.exit(1);
  }
}

// ── Helpers ─────────────────────────────────────────────────

function text(t) {
  return { content: [{ type: 'text', text: t }] };
}

// ── Server ──────────────────────────────────────────────────

const server = new McpServer({
  name: 'blog-cms',
  version: '1.0.0',
});

// ── list_posts ──────────────────────────────────────────────

server.registerTool(
  'list_posts',
  {
    title: 'List Blog Posts',
    description: 'List blog posts. Optionally filter by status.',
    inputSchema: z.object({
      status: z.enum(['draft', 'needs-review', 'published']).optional().describe('Filter by status'),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }),
  },
  async ({ status, limit }) => {
    await ensureWorkspace();
    let query = supabase
      .from('blog_posts')
      .select('id, slug, title, excerpt, date, category, tags, status, created_at, updated_at')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return text(`Error: ${error.message}`);
    return text(
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
    await ensureWorkspace();
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq(isUuid ? 'id' : 'slug', id)
      .single();
    if (error || !data) return text('Post not found.');
    return text(JSON.stringify(data, null, 2));
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
      category: z.string().optional().describe('Post category'),
      tags: z.array(z.string()).optional(),
      youtube_id: z.string().optional().describe('YouTube video ID'),
      image: z.string().optional().describe('Featured image URL'),
      meta_description: z.string().optional().describe('SEO meta description'),
      keywords: z.string().optional().describe('SEO keywords'),
      content: z.array(z.record(z.any())).optional().describe('Array of content block objects'),
      status: z.enum(['draft', 'needs-review', 'published']).optional().default('draft'),
      sources: z.array(z.record(z.any())).optional().describe('Research sources'),
      ai_reasoning: z.string().optional().describe('How the AI structured the content'),
    }),
  },
  async (args) => {
    await ensureWorkspace();
    const slug = args.slug || args.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const record = {
      workspace_id,
      title: args.title,
      slug,
      excerpt: args.excerpt || '',
      date: args.date || new Date().toISOString().split('T')[0],
      read_time: args.read_time || '1 min read',
      author: args.author || 'Author',
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
    if (error) return text(`Error creating post: ${error.message}`);
    return text(`Created post "${data.title}" (${data.slug}) [${data.status}]. ID: ${data.id}`);
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
      sources: z.array(z.record(z.any())).optional(),
      ai_reasoning: z.string().optional(),
    }),
  },
  async ({ id, ...fields }) => {
    await ensureWorkspace();
    const updates = {};
    for (const [key, val] of Object.entries(fields)) {
      if (val !== undefined) updates[key] = val;
    }
    if (Object.keys(updates).length === 0) return text('No fields provided to update.');
    const { data, error } = await supabase
      .from('blog_posts')
      .update(updates)
      .eq('workspace_id', workspace_id)
      .eq('id', id)
      .select('id, slug, title, status')
      .single();
    if (error || !data) return text('Post not found or update failed.');
    return text(`Updated "${data.title}" (${data.slug}) [${data.status}].`);
  },
);

// ── publish_post ────────────────────────────────────────────

server.registerTool(
  'publish_post',
  {
    title: 'Publish Blog Post',
    description: 'Set a post status to "published".',
    inputSchema: z.object({ id: z.string().describe('Post UUID') }),
  },
  async ({ id }) => {
    await ensureWorkspace();
    const { data, error } = await supabase
      .from('blog_posts')
      .update({ status: 'published' })
      .eq('workspace_id', workspace_id)
      .eq('id', id)
      .select('id, slug, title')
      .single();
    if (error || !data) return text('Post not found.');
    return text(`Published "${data.title}" (${data.slug}).`);
  },
);

// ── list_topics ─────────────────────────────────────────────

server.registerTool(
  'list_topics',
  {
    title: 'List Blog Topics',
    description: 'List topics from the content pipeline. Optionally filter by status.',
    inputSchema: z.object({
      status: z.enum(['researched', 'approved', 'discarded', 'writing', 'written']).optional(),
      limit: z.number().int().min(1).max(100).optional().default(50),
    }),
  },
  async ({ status, limit }) => {
    await ensureWorkspace();
    let query = supabase
      .from('blog_topics')
      .select('id, title, primary_keyword, search_volume, keyword_difficulty, status, notes')
      .eq('workspace_id', workspace_id)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (status) query = query.eq('status', status);
    const { data, error } = await query;
    if (error) return text(`Error: ${error.message}`);
    return text(
      data.length === 0
        ? 'No topics found.'
        : data.map((t) => `- [${t.status}] "${t.title}" — KW: ${t.primary_keyword || 'n/a'}, Vol: ${t.search_volume || '?'}`).join('\n')
    );
  },
);

// ── create_topic ────────────────────────────────────────────

server.registerTool(
  'create_topic',
  {
    title: 'Create Blog Topic',
    description: 'Create a new topic in the content pipeline with keyword data.',
    inputSchema: z.object({
      title: z.string().describe('Topic name'),
      primary_keyword: z.string().optional(),
      secondary_keywords: z.array(z.string()).optional(),
      search_volume: z.number().int().optional(),
      keyword_difficulty: z.number().int().min(0).max(100).optional(),
      cpc: z.number().optional(),
      competition_level: z.enum(['low', 'medium', 'high']).optional(),
      status: z.enum(['researched', 'approved', 'discarded', 'writing', 'written']).optional().default('researched'),
      research_data: z.record(z.any()).optional(),
      notes: z.string().optional(),
    }),
  },
  async (args) => {
    await ensureWorkspace();
    const { data, error } = await supabase
      .from('blog_topics')
      .insert({
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
      })
      .select('id, title, status')
      .single();
    if (error) return text(`Error: ${error.message}`);
    return text(`Created topic "${data.title}" [${data.status}]. ID: ${data.id}`);
  },
);

// ── list_preferences ────────────────────────────────────────

server.registerTool(
  'list_preferences',
  {
    title: 'List Writing Preferences',
    description: 'List active writing style rules for this workspace.',
    inputSchema: z.object({}),
  },
  async () => {
    await ensureWorkspace();
    const { data, error } = await supabase
      .from('preferences')
      .select('*')
      .eq('workspace_id', workspace_id)
      .eq('active', true);
    if (error) return text(`Error: ${error.message}`);
    return text(
      data.length === 0
        ? 'No active preferences.'
        : data.map((p) => `- [${p.category}] ${p.rule}`).join('\n')
    );
  },
);

// ── get_workspace_info ──────────────────────────────────────

server.registerTool(
  'get_workspace_info',
  {
    title: 'Get Workspace Info',
    description: 'Workspace name, settings, and content stats.',
    inputSchema: z.object({}),
  },
  async () => {
    await ensureWorkspace();
    const [ws, posts, topics] = await Promise.all([
      supabase.from('workspaces').select('id, name, slug, settings').eq('id', workspace_id).single(),
      supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace_id),
      supabase.from('blog_topics').select('id', { count: 'exact', head: true }).eq('workspace_id', workspace_id),
    ]);
    if (ws.error) return text('Workspace not found.');
    return text(JSON.stringify({
      workspace: ws.data,
      stats: { posts: posts.count || 0, topics: topics.count || 0 },
    }, null, 2));
  },
);

// ── Start ───────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
