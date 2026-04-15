#!/usr/bin/env node

/**
 * Blog CMS — MCP Server for Claude Desktop (stdio transport)
 *
 * Install in Claude Desktop config (~/Library/Application Support/Claude/claude_desktop_config.json):
 *
 *   "moonify-cms": {
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
import { registerAllTools } from '../lib/mcp-tools.js';
import { registerAllPrompts } from '../lib/mcp-prompts.js';

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

// ── Server ──────────────────────────────────────────────────

await ensureWorkspace();

const server = new McpServer({
  name: 'moonify-cms',
  version: '1.0.0',
});

registerAllTools(server, supabase, workspace_id);
registerAllPrompts(server);

// ── Start ───────────────────────────────────────────────────

const transport = new StdioServerTransport();
await server.connect(transport);
