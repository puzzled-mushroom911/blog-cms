#!/usr/bin/env node
/**
 * blog-cms CLI dispatcher.
 *
 *   blog-cms                       start MCP server (preserves prior behavior)
 *   blog-cms init                  interactive bootstrap
 *   blog-cms mcp                   start MCP server explicitly
 *
 *   blog-cms list [--status=draft|published] [--limit=N] [--type=posts|topics]
 *   blog-cms get <slug> [--format=json|md]
 *   blog-cms publish <slug>
 *   blog-cms unpublish <slug>
 *   blog-cms pull <dir> [--status=published]
 *   blog-cms push <file.md>
 *   blog-cms sync <dir>
 *
 *   blog-cms version
 *   blog-cms help
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const cmd = (argv[0] || "").toLowerCase();
const rest = argv.slice(1);

async function version() {
  const pkg = JSON.parse(await readFile(join(__dirname, "..", "package.json"), "utf8"));
  console.log(pkg.version);
}

function help() {
  console.log(`
  blog-cms — agent-native CMS for AI-generated blog posts

  Setup:
    npx blog-cms init                  interactive bootstrap (Supabase + .env + MCP)

  Server:
    npx blog-cms                       start MCP server (default; for Claude Desktop / Code)
    npx blog-cms mcp                   start MCP server explicitly

  Headless data ops (require SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY):
    npx blog-cms list                  list posts (--status, --limit, --type=posts|topics)
    npx blog-cms get <slug>             read one post (--format=json|md)
    npx blog-cms publish <slug>         set status to published
    npx blog-cms unpublish <slug>       set status to draft
    npx blog-cms pull <dir>             export posts to markdown files
    npx blog-cms push <file.md>         import a markdown file as a post
    npx blog-cms sync <dir>             two-way sync between dir and Supabase

  Misc:
    npx blog-cms version               print version
    npx blog-cms help                  this message

  Docs: https://github.com/puzzled-mushroom911/blog-cms
`);
}

async function runCommand(fnName) {
  const mod = await import("./lib/commands.mjs");
  try {
    await mod[fnName](rest);
  } catch (e) {
    console.error(`error: ${e.message}`);
    process.exit(1);
  }
}

switch (cmd) {
  case "init": {
    const { main } = await import("./init.mjs");
    await main();
    break;
  }
  case "version":
  case "-v":
  case "--version":
    await version();
    break;
  case "help":
  case "-h":
  case "--help":
    help();
    break;
  case "mcp":
  case "":
    await import("./mcp-server.js");
    break;
  case "list":      await runCommand("list"); break;
  case "get":       await runCommand("get"); break;
  case "publish":   await runCommand("publish"); break;
  case "unpublish": await runCommand("unpublish"); break;
  case "pull":      await runCommand("pull"); break;
  case "push":      await runCommand("push"); break;
  case "sync":      await runCommand("sync"); break;
  default:
    console.error(`Unknown command: ${cmd}\n`);
    help();
    process.exit(1);
}
