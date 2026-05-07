#!/usr/bin/env node
/**
 * blog-cms CLI dispatcher.
 *
 *   blog-cms                → starts the MCP server (default; preserves prior behavior)
 *   blog-cms init           → interactive bootstrap (Supabase + auth user + .env + MCP)
 *   blog-cms mcp            → starts the MCP server explicitly
 *   blog-cms version        → prints package version
 *   blog-cms help           → usage
 */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { readFile } from "node:fs/promises";

const __dirname = dirname(fileURLToPath(import.meta.url));
const cmd = (process.argv[2] || "").toLowerCase();

async function version() {
  const pkg = JSON.parse(await readFile(join(__dirname, "..", "package.json"), "utf8"));
  console.log(pkg.version);
}

function help() {
  console.log(`
  blog-cms — agent-native CMS for AI-generated blog posts

  Usage:
    npx blog-cms              start MCP server (for Claude Desktop / Code)
    npx blog-cms init         interactive setup (Supabase + .env + MCP)
    npx blog-cms mcp          start MCP server explicitly
    npx blog-cms version      print version
    npx blog-cms help         this message

  Docs: https://github.com/puzzled-mushroom911/blog-cms
`);
}

switch (cmd) {
  case "init":
    await import("./init.mjs");
    break;
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
  default:
    console.error(`Unknown command: ${cmd}\n`);
    help();
    process.exit(1);
}
