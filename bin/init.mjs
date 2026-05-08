#!/usr/bin/env node
/**
 * blog-cms init — interactive bootstrap.
 *
 * Replaces the 8-step manual setup with a single command:
 * collects Supabase credentials, runs the schema, creates an
 * auth user, writes .env, and (optionally) installs the MCP
 * server into Claude Desktop's config.
 */
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { readFile, writeFile, access, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join, resolve as resolvePath } from "node:path";
import { homedir, platform } from "node:os";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const REPO_ROOT = resolvePath(__dirname, "..");
const SCHEMA_PATH = join(REPO_ROOT, "supabase", "schema.sql");

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s) => `\x1b[36m${s}\x1b[0m`,
};

const rl = createInterface({ input: stdin, output: stdout });
const ask = async (q, fallback = "") => {
  const a = (await rl.question(q)).trim();
  return a || fallback;
};
const askRequired = async (q) => {
  while (true) {
    const a = (await rl.question(q)).trim();
    if (a) return a;
    console.log(c.red("  required."));
  }
};
const askYesNo = async (q, def = true) => {
  const hint = def ? "Y/n" : "y/N";
  const a = (await rl.question(`${q} (${hint}) `)).trim().toLowerCase();
  if (!a) return def;
  return a.startsWith("y");
};

export function parseProjectRef(url) {
  const m = url.match(/^https:\/\/([a-z0-9-]+)\.supabase\.co\/?$/i);
  return m ? m[1] : null;
}

export async function fileExists(p) {
  try { await access(p); return true; } catch { return false; }
}

export async function runSchema({ ref, dbPassword }) {
  const { default: postgres } = await import("postgres");
  const schema = await readFile(SCHEMA_PATH, "utf8");
  const conn = `postgresql://postgres:${encodeURIComponent(dbPassword)}@db.${ref}.supabase.co:5432/postgres`;
  const sql = postgres(conn, { ssl: "require", max: 1, idle_timeout: 5 });
  try {
    await sql.unsafe(schema);
  } finally {
    await sql.end({ timeout: 5 });
  }
}

export async function createCmsUser({ url, serviceRoleKey, email, password }) {
  const admin = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw new Error(error.message);
  return data.user;
}

export async function writeEnvFile({ url, anonKey, cwd = process.cwd() }) {
  const envPath = join(cwd, ".env");
  const existing = (await fileExists(envPath)) ? await readFile(envPath, "utf8") : "";
  const lines = [];
  if (!/^VITE_SUPABASE_URL=/m.test(existing)) lines.push(`VITE_SUPABASE_URL=${url}`);
  if (!/^VITE_SUPABASE_ANON_KEY=/m.test(existing)) lines.push(`VITE_SUPABASE_ANON_KEY=${anonKey}`);
  if (lines.length === 0) return { path: envPath, wrote: false };
  const next = existing + (existing && !existing.endsWith("\n") ? "\n" : "") + lines.join("\n") + "\n";
  await writeFile(envPath, next, "utf8");
  return { path: envPath, wrote: true };
}

export function claudeDesktopConfigPath() {
  if (platform() === "darwin") {
    return join(homedir(), "Library", "Application Support", "Claude", "claude_desktop_config.json");
  }
  if (platform() === "win32") {
    return join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "Claude", "claude_desktop_config.json");
  }
  return join(homedir(), ".config", "Claude", "claude_desktop_config.json");
}

export async function installMcp({ url, serviceRoleKey, cfgPath: cfgOverride } = {}) {
  const cfgPath = cfgOverride || claudeDesktopConfigPath();
  let cfg = {};
  if (await fileExists(cfgPath)) {
    try { cfg = JSON.parse(await readFile(cfgPath, "utf8")); } catch { cfg = {}; }
  } else {
    await mkdir(dirname(cfgPath), { recursive: true });
  }
  cfg.mcpServers = cfg.mcpServers || {};
  cfg.mcpServers["blog-cms"] = {
    command: "npx",
    args: ["-y", "github:puzzled-mushroom911/blog-cms"],
    env: { SUPABASE_URL: url, SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey },
  };
  await writeFile(cfgPath, JSON.stringify(cfg, null, 2), "utf8");
  return cfgPath;
}

export async function main() {
  console.log("");
  console.log(c.bold("  blog-cms init"));
  console.log(c.dim("  Sets up Supabase, creates your first user, and wires up MCP."));
  console.log("");

  // ── 1. Supabase project
  const hasProject = await askYesNo("Do you already have a Supabase project?", true);
  if (!hasProject) {
    console.log("");
    console.log(c.yellow("  →  Create one at https://supabase.com/dashboard/new"));
    console.log(c.yellow("     Pick any name, set a strong DB password, wait ~1 min."));
    console.log("");
    await ask(c.dim("  Press Enter when your project is ready... "));
  }

  console.log("");
  console.log(c.dim("  Find these in Supabase → Settings → API"));
  const url = await askRequired("  Project URL: ");
  const ref = parseProjectRef(url);
  if (!ref) {
    console.log(c.red("  That URL doesn't look like a Supabase project URL."));
    console.log(c.red("  Expected: https://abcdefghij.supabase.co"));
    process.exit(1);
  }
  const anonKey = await askRequired("  anon / public key: ");
  const serviceRoleKey = await askRequired("  service_role key: ");
  console.log("");
  console.log(c.dim("  Find this in Supabase → Settings → Database → Database password"));
  const dbPassword = await askRequired("  DB password: ");

  // ── 2. Run schema
  console.log("");
  console.log(c.cyan("  → Running schema (creates tables, RLS, functions, triggers)..."));
  try {
    await runSchema({ ref, dbPassword });
    console.log(c.green("  ✓ Schema applied"));
  } catch (e) {
    console.log(c.red(`  ✗ Schema failed: ${e.message}`));
    console.log(c.dim("    If you see a duplicate-object error, the schema may already be applied — that's fine."));
    const cont = await askYesNo("  Continue anyway?", false);
    if (!cont) process.exit(1);
  }

  // ── 3. Create CMS user
  console.log("");
  console.log(c.bold("  Create your first CMS user:"));
  const email = await askRequired("  Email: ");
  const password = await askRequired("  Password: ");
  console.log(c.cyan("  → Creating user..."));
  try {
    await createCmsUser({ url, serviceRoleKey, email, password });
    console.log(c.green(`  ✓ User created: ${email}`));
  } catch (e) {
    if (/already.*registered|exists/i.test(e.message)) {
      console.log(c.yellow(`  ! User ${email} already exists — skipping`));
    } else {
      console.log(c.red(`  ✗ User creation failed: ${e.message}`));
    }
  }

  // ── 4. Write .env
  console.log("");
  const inClone = await fileExists(join(process.cwd(), "package.json"));
  if (inClone) {
    const { path, wrote } = await writeEnvFile({ url, anonKey });
    if (wrote) console.log(c.green(`  ✓ Wrote ${path}`));
    else console.log(c.dim(`  · ${path} already had Supabase keys — left it alone`));
  } else {
    console.log(c.yellow("  ! Not in a project directory — paste these into your .env:"));
    console.log(c.dim(`    VITE_SUPABASE_URL=${url}`));
    console.log(c.dim(`    VITE_SUPABASE_ANON_KEY=${anonKey}`));
  }

  // ── 5. MCP install
  console.log("");
  const wantMcp = await askYesNo("  Install the MCP server into Claude Desktop?", true);
  if (wantMcp) {
    try {
      const cfgPath = await installMcp({ url, serviceRoleKey });
      console.log(c.green(`  ✓ MCP installed: ${cfgPath}`));
      console.log(c.dim("    Restart Claude Desktop to pick it up."));
    } catch (e) {
      console.log(c.red(`  ✗ MCP install failed: ${e.message}`));
    }
  }

  // ── 6. Next steps
  console.log("");
  console.log(c.bold(c.green("  ✓ Done.")));
  console.log("");
  if (inClone) {
    console.log(c.bold("  Run the CMS locally:"));
    console.log("    npm install");
    console.log("    npm run dev");
    console.log("");
    console.log(c.dim("  Then open http://localhost:5173"));
  } else {
    console.log(c.bold("  Run the CMS locally:"));
    console.log("    git clone https://github.com/puzzled-mushroom911/blog-cms.git");
    console.log("    cd blog-cms && npm install && npm run dev");
    console.log("");
    console.log(c.dim("  Then open http://localhost:5173"));
  }
  console.log("");

  rl.close();
}

// Auto-run only when invoked directly (`node bin/init.mjs`).
// When imported by cli.mjs or the test harness, the caller decides.
import { basename } from "node:path";
const isMain = process.argv[1] && basename(process.argv[1]) === "init.mjs";
if (isMain) {
  main().catch((e) => {
    console.error(c.red(`\n  Fatal: ${e.message}`));
    rl.close();
    process.exit(1);
  });
}
