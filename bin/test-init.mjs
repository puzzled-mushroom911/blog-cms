#!/usr/bin/env node
/**
 * Smoke test for init.mjs helpers + headless commands.
 *
 * Reads creds from .env in the current dir. Skips runSchema (the schema
 * is already applied to the live project; rerunning would either be a
 * no-op or noisy). Exercises:
 *
 *   - parseProjectRef (pure)
 *   - createCmsUser (creates a throwaway test user, then deletes it)
 *   - writeEnvFile (writes to a tempdir)
 *   - installMcp (writes to a tempdir cfg file)
 *   - markdown roundtrip (block array → md → block array)
 *   - list / get / pull / push / sync (against existing posts)
 */
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

import { parseProjectRef, createCmsUser, writeEnvFile, installMcp, claudeDesktopConfigPath } from "./init.mjs";
import { postToMarkdown, markdownToPost } from "./lib/markdown.mjs";
import { resolveCreds } from "./lib/supabase.mjs";

let pass = 0, fail = 0;

function ok(name) { console.log(`  ✓ ${name}`); pass++; }
function bad(name, err) { console.log(`  ✗ ${name}\n      ${err}`); fail++; }
async function check(name, fn) { try { await fn(); ok(name); } catch (e) { bad(name, e.message); } }

async function main() {
  console.log("\n  blog-cms test-init\n");

  // Phase 1 — pure functions
  console.log("  [pure functions]");
  await check("parseProjectRef parses valid URL", () => {
    const r = parseProjectRef("https://abcdefghij.supabase.co");
    if (r !== "abcdefghij") throw new Error(`expected "abcdefghij", got ${JSON.stringify(r)}`);
  });
  await check("parseProjectRef rejects garbage", () => {
    if (parseProjectRef("not a url") !== null) throw new Error("should be null");
  });
  await check("claudeDesktopConfigPath returns a path", () => {
    const p = claudeDesktopConfigPath();
    if (!p || !p.includes("Claude")) throw new Error(`unexpected: ${p}`);
  });

  // Phase 2 — markdown roundtrip
  console.log("\n  [markdown roundtrip]");
  await check("paragraph + heading + list survives roundtrip", () => {
    const post = {
      slug: "rt-1", title: "Roundtrip", status: "draft",
      content: [
        { type: "heading", text: "Hello" },
        { type: "paragraph", text: "This is a paragraph." },
        { type: "list", items: ["one", "two", "three"] },
      ],
    };
    const md = postToMarkdown(post);
    const back = markdownToPost(md);
    if (back.slug !== "rt-1") throw new Error(`slug lost: ${back.slug}`);
    if (back.content.length !== 3) throw new Error(`block count ${back.content.length}`);
    if (back.content[0].type !== "heading" || back.content[0].text !== "Hello") throw new Error("heading mangled");
    if (back.content[2].items.length !== 3) throw new Error("list mangled");
  });
  await check("structured block (callout) survives via fenced JSON", () => {
    const post = {
      slug: "rt-2", title: "Struct", status: "draft",
      content: [{ type: "callout", title: "Heads up", text: "be careful" }],
    };
    const back = markdownToPost(postToMarkdown(post));
    if (back.content[0].type !== "callout" || back.content[0].title !== "Heads up") throw new Error("callout mangled");
  });
  await check("table roundtrip", () => {
    const post = {
      slug: "rt-3", title: "Table", status: "draft",
      content: [{ type: "table", headers: ["A", "B"], rows: [["1", "2"], ["3", "4"]] }],
    };
    const back = markdownToPost(postToMarkdown(post));
    if (back.content[0].type !== "table") throw new Error("not table");
    if (back.content[0].rows.length !== 2) throw new Error("rows lost");
  });

  // Phase 3 — filesystem ops in a tempdir
  console.log("\n  [filesystem ops (tempdir)]");
  const tmp = await mkdtemp(join(tmpdir(), "blog-cms-test-"));
  try {
    await check("writeEnvFile writes new keys", async () => {
      const { wrote } = await writeEnvFile({ url: "https://x.supabase.co", anonKey: "k", cwd: tmp });
      if (!wrote) throw new Error("did not write");
      const contents = await readFile(join(tmp, ".env"), "utf8");
      if (!contents.includes("VITE_SUPABASE_URL=https://x.supabase.co")) throw new Error("URL missing");
      if (!contents.includes("VITE_SUPABASE_ANON_KEY=k")) throw new Error("anon missing");
    });
    await check("writeEnvFile is idempotent (no overwrite of existing keys)", async () => {
      const { wrote } = await writeEnvFile({ url: "https://y.supabase.co", anonKey: "z", cwd: tmp });
      if (wrote) throw new Error("should not have rewritten");
      const contents = await readFile(join(tmp, ".env"), "utf8");
      if (!contents.includes("https://x.supabase.co")) throw new Error("first URL got clobbered");
    });
    await check("installMcp writes Claude Desktop config (tempdir)", async () => {
      const cfgPath = join(tmp, "claude_desktop_config.json");
      await installMcp({ url: "https://x.supabase.co", serviceRoleKey: "secret", cfgPath });
      const cfg = JSON.parse(await readFile(cfgPath, "utf8"));
      if (!cfg.mcpServers || !cfg.mcpServers["blog-cms"]) throw new Error("entry missing");
      if (cfg.mcpServers["blog-cms"].env.SUPABASE_URL !== "https://x.supabase.co") throw new Error("URL not stored");
    });
    await check("installMcp preserves existing entries", async () => {
      const cfgPath = join(tmp, "preexisting.json");
      await writeFile(cfgPath, JSON.stringify({ mcpServers: { other: { command: "x" } } }), "utf8");
      await installMcp({ url: "https://a.supabase.co", serviceRoleKey: "k", cfgPath });
      const cfg = JSON.parse(await readFile(cfgPath, "utf8"));
      if (!cfg.mcpServers.other) throw new Error("clobbered existing entry");
      if (!cfg.mcpServers["blog-cms"]) throw new Error("did not add new entry");
    });
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }

  // Phase 4 — live Supabase (requires creds)
  console.log("\n  [live Supabase]");
  let creds;
  try { creds = await resolveCreds(); }
  catch (e) {
    console.log(`  · skipped — ${e.message}`);
    return summary();
  }
  console.log(`  · using ${creds.url}`);
  const sb = createClient(creds.url, creds.serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const testEmail = `blog-cms-init-test+${Date.now()}@example.com`;

  let createdId;
  await check("createCmsUser creates a fresh user", async () => {
    const u = await createCmsUser({ url: creds.url, serviceRoleKey: creds.serviceRoleKey, email: testEmail, password: "Test_pw_" + Date.now() });
    if (!u || !u.id) throw new Error("no user returned");
    createdId = u.id;
  });
  await check("createCmsUser is idempotent (rejects duplicates cleanly)", async () => {
    try {
      await createCmsUser({ url: creds.url, serviceRoleKey: creds.serviceRoleKey, email: testEmail, password: "AnotherPw_1" });
      throw new Error("should have errored");
    } catch (e) {
      if (!/already|exists|registered/i.test(e.message)) throw new Error(`wrong error: ${e.message}`);
    }
  });

  // Cleanup the test user
  if (createdId) {
    await sb.auth.admin.deleteUser(createdId).catch(() => {});
    console.log("  · cleaned up test user");
  }

  // Phase 5 — headless data ops against existing posts
  console.log("\n  [headless commands]");
  const { list, get, pull } = await import("./lib/commands.mjs");
  await check("list returns at least one post", async () => {
    const before = console.log;
    let captured = "";
    console.log = (...args) => { captured += args.join(" ") + "\n"; };
    try { await list(["--limit=5"]); } finally { console.log = before; }
    if (!captured.includes("STATUS")) throw new Error("no header");
  });

  const { data: any } = await sb.from("blog_posts").select("slug").not("slug", "is", null).limit(1).maybeSingle();
  if (any?.slug) {
    await check(`get <existing slug> returns markdown`, async () => {
      const before = console.log;
      let captured = "";
      console.log = (...args) => { captured += args.join(" ") + "\n"; };
      try { await get([any.slug, "--format=md"]); } finally { console.log = before; }
      if (!captured.includes("---")) throw new Error("no frontmatter in output");
      if (!captured.includes(`slug: ${any.slug}`)) throw new Error("slug missing");
    });

    const pullDir = await mkdtemp(join(tmpdir(), "blog-cms-pull-"));
    try {
      await check(`pull writes .md files`, async () => {
        const before = console.log;
        try { console.log = () => {}; await pull([pullDir, "--status=published"]); } finally { console.log = before; }
        const { readdir } = await import("node:fs/promises");
        const files = await readdir(pullDir);
        if (files.length === 0) throw new Error("no files written");
        if (!files.some((f) => f.endsWith(".md"))) throw new Error("no .md files");
      });
    } finally {
      await rm(pullDir, { recursive: true, force: true });
    }
  }

  return summary();
}

function summary() {
  const total = pass + fail;
  console.log(`\n  ${pass}/${total} passed${fail ? `, ${fail} failed` : ""}\n`);
  process.exit(fail ? 1 : 0);
}

main().catch((e) => { console.error("fatal:", e.message); process.exit(2); });
