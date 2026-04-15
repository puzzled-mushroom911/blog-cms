import { useState } from 'react';
import { Copy, CheckCircle, Terminal, Key, Blocks, FileCode2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }
  return (
    <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 px-2 text-xs">
      {copied ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </Button>
  );
}

const MCP_TOOLS = [
  { name: 'list_posts', desc: 'List blog posts. Filter by status, set limit.' },
  { name: 'get_post', desc: 'Get a single post by ID or slug with full content blocks.' },
  { name: 'create_post', desc: 'Create a new blog post with title, content, category, tags, sources, etc.' },
  { name: 'update_post', desc: 'Partial update — only send the fields you want to change.' },
  { name: 'publish_post', desc: 'Set a post status to "published".' },
  { name: 'delete_post', desc: 'Permanently delete a post.' },
  { name: 'list_topics', desc: 'List topics from the research pipeline. Filter by status.' },
  { name: 'get_topic', desc: 'Get a topic with full research data.' },
  { name: 'create_topic', desc: 'Create a topic with keyword data.' },
  { name: 'update_topic', desc: 'Update topic status, notes, or research data.' },
  { name: 'list_preferences', desc: 'List active writing style preferences.' },
  { name: 'create_preference', desc: 'Add a new style rule (tone, structure, vocabulary, formatting).' },
  { name: 'get_workspace_info', desc: 'Workspace name, settings, and stats.' },
];

const CONTENT_BLOCKS = [
  { type: 'paragraph', example: '{ "type": "paragraph", "text": "..." }' },
  { type: 'heading', example: '{ "type": "heading", "text": "..." }' },
  { type: 'subheading', example: '{ "type": "subheading", "text": "..." }' },
  { type: 'list', example: '{ "type": "list", "items": ["item1", "item2"] }' },
  { type: 'callout', example: '{ "type": "callout", "title": "...", "text": "..." }' },
  { type: 'quote', example: '{ "type": "quote", "text": "...", "author": "..." }' },
  { type: 'info-box', example: '{ "type": "info-box", "title": "...", "text": "...", "variant": "blue" }' },
  { type: 'image', example: '{ "type": "image", "src": "...", "alt": "...", "caption": "..." }' },
  { type: 'table', example: '{ "type": "table", "headers": [...], "rows": [[...]] }' },
  { type: 'stat-cards', example: '{ "type": "stat-cards", "items": [{ "label": "...", "value": "..." }] }' },
  { type: 'pros-cons', example: '{ "type": "pros-cons", "pros": [...], "cons": [...] }' },
  { type: 'process-steps', example: '{ "type": "process-steps", "steps": [{ "title": "...", "text": "..." }] }' },
];

const REST_ENDPOINTS = [
  { method: 'GET', path: '/api/v1/posts', desc: 'List posts (filter: ?status=draft&limit=20&offset=0)' },
  { method: 'POST', path: '/api/v1/posts', desc: 'Create a post' },
  { method: 'GET', path: '/api/v1/posts/:id', desc: 'Get post by UUID or slug' },
  { method: 'PATCH', path: '/api/v1/posts/:id', desc: 'Update post (partial)' },
  { method: 'DELETE', path: '/api/v1/posts/:id', desc: 'Delete post' },
  { method: 'GET', path: '/api/v1/topics', desc: 'List topics (filter: ?status=approved)' },
  { method: 'POST', path: '/api/v1/topics', desc: 'Create a topic' },
  { method: 'GET', path: '/api/v1/topics/:id', desc: 'Get topic with research data' },
  { method: 'PATCH', path: '/api/v1/topics/:id', desc: 'Update topic' },
  { method: 'GET', path: '/api/v1/preferences', desc: 'List active style preferences' },
  { method: 'POST', path: '/api/v1/preferences', desc: 'Create a preference' },
  { method: 'GET', path: '/api/v1/auth/me', desc: 'Workspace info + stats' },
];

const METHOD_COLORS = {
  GET: 'bg-emerald-100 text-emerald-700',
  POST: 'bg-blue-100 text-blue-700',
  PATCH: 'bg-amber-100 text-amber-700',
  DELETE: 'bg-red-100 text-red-700',
};

export default function ApiReference() {
  const mcpConfig = JSON.stringify({
    mcpServers: {
      'moonify-cms': {
        type: 'streamable-http',
        url: `${window.location.origin}/api/mcp`,
        headers: { Authorization: 'Bearer YOUR_API_KEY' },
      },
    },
  }, null, 2);

  const curlExample = `curl -H "Authorization: Bearer YOUR_API_KEY" \\
  ${window.location.origin}/api/v1/posts?status=draft&limit=5`;

  return (
    <div className="space-y-8">
      {/* Quick Start — MCP */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Terminal className="w-5 h-5" />
          Claude Code Setup (MCP)
        </h2>

        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">1</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Create an API key</p>
                <p className="text-xs text-slate-500">Go to <a href="/settings" className="text-blue-600 hover:text-blue-700 underline">Settings &gt; API Keys</a> and create a new key. Copy it immediately.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">2</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-700 mb-2">Add to your MCP config</p>
                <p className="text-xs text-slate-500 mb-2">
                  Paste into <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">~/.claude/mcp.json</code> (global) or <code className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-700">.claude/mcp.json</code> (project):
                </p>
                <div className="relative">
                  <pre className="text-xs bg-slate-950 text-slate-200 p-4 rounded-lg overflow-x-auto font-mono">{mcpConfig}</pre>
                  <div className="absolute top-2 right-2">
                    <CopyButton text={mcpConfig} />
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Replace <code className="bg-slate-100 px-1 rounded">YOUR_API_KEY</code> with the key from step 1.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <span className="flex items-center justify-center w-6 h-6 rounded-full bg-slate-900 text-white text-xs font-bold flex-shrink-0 mt-0.5">3</span>
              <div>
                <p className="text-sm font-medium text-slate-700">Restart Claude Code</p>
                <p className="text-xs text-slate-500">The 13 CMS tools will appear automatically. Try: "list my draft blog posts"</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* MCP Tools */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Blocks className="w-5 h-5" />
          MCP Tools
        </h2>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-44">Tool</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {MCP_TOOLS.map((tool, i) => (
                <tr key={tool.name} className={i < MCP_TOOLS.length - 1 ? 'border-b border-slate-100' : ''}>
                  <td className="px-4 py-2.5">
                    <code className="text-xs bg-slate-100 px-2 py-1 rounded font-mono text-slate-800">{tool.name}</code>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{tool.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* REST API */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <FileCode2 className="w-5 h-5" />
          REST API
        </h2>

        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <p className="text-xs text-slate-500 mb-1">All requests require:</p>
          <pre className="text-xs bg-slate-950 text-slate-200 p-3 rounded-lg font-mono">Authorization: Bearer YOUR_API_KEY</pre>

          <p className="text-xs text-slate-500 mt-4 mb-1">Example:</p>
          <div className="relative">
            <pre className="text-xs bg-slate-950 text-slate-200 p-3 rounded-lg font-mono overflow-x-auto">{curlExample}</pre>
            <div className="absolute top-1.5 right-1.5">
              <CopyButton text={curlExample} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-20">Method</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600 w-52">Endpoint</th>
                <th className="text-left px-4 py-2.5 font-medium text-slate-600">Description</th>
              </tr>
            </thead>
            <tbody>
              {REST_ENDPOINTS.map((ep, i) => (
                <tr key={`${ep.method}-${ep.path}`} className={i < REST_ENDPOINTS.length - 1 ? 'border-b border-slate-100' : ''}>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${METHOD_COLORS[ep.method]}`}>{ep.method}</span>
                  </td>
                  <td className="px-4 py-2.5">
                    <code className="text-xs font-mono text-slate-700">{ep.path}</code>
                  </td>
                  <td className="px-4 py-2.5 text-slate-600 text-xs">{ep.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Content Blocks */}
      <section>
        <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2 mb-4">
          <Key className="w-5 h-5" />
          Content Block Types
        </h2>
        <p className="text-xs text-slate-500 mb-4">
          Used in the <code className="bg-slate-100 px-1 rounded">content</code> field when creating or updating posts via API or MCP.
        </p>

        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          {CONTENT_BLOCKS.map((block, i) => (
            <div key={block.type} className={`px-4 py-2.5 flex items-center gap-3 ${i < CONTENT_BLOCKS.length - 1 ? 'border-b border-slate-100' : ''}`}>
              <span className="text-xs font-semibold text-slate-700 w-28 flex-shrink-0">{block.type}</span>
              <code className="text-[11px] font-mono text-slate-500 truncate">{block.example}</code>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
