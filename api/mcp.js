import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticate, sendError } from './_lib/auth.js';
import { getServiceClient } from './_lib/supabase.js';
import { registerAllTools } from '../lib/mcp-tools.js';
import { registerAllPrompts } from '../lib/mcp-prompts.js';

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

  registerAllTools(server, supabase, workspace_id);
  registerAllPrompts(server);

  return server;
}
