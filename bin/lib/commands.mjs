/**
 * Headless data ops for blog-cms.
 *
 * Each command is a one-shot Supabase call. They all read creds from
 * env / .env via lib/supabase.mjs — no UI, no prompts, no surprises.
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join, basename, extname } from "node:path";
import { adminClient } from "./supabase.mjs";
import { postToMarkdown, markdownToPost } from "./markdown.mjs";

function parseArgs(argv) {
  const out = { _: [] };
  for (const a of argv) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out[k] = v ?? true;
    } else {
      out._.push(a);
    }
  }
  return out;
}

// ── list ────────────────────────────────────────────────────────────
export async function list(argv) {
  const { status, limit = 50, type = "posts" } = parseArgs(argv);
  const sb = await adminClient();
  const table = type === "topics" ? "blog_topics" : "blog_posts";
  let q = sb.from(table).select("slug,title,status,updated_at").order("updated_at", { ascending: false }).limit(Number(limit));
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  if (data.length === 0) {
    console.log("(none)");
    return;
  }
  const slugW = Math.max(8, ...data.map((p) => (p.slug || "").length));
  const titleW = Math.max(8, ...data.map((p) => (p.title || "").length));
  console.log("STATUS".padEnd(14) + "SLUG".padEnd(slugW + 2) + "TITLE".padEnd(titleW + 2) + "UPDATED");
  for (const p of data) {
    console.log(
      (p.status || "").padEnd(14) +
      (p.slug || "").padEnd(slugW + 2) +
      (p.title || "").padEnd(titleW + 2) +
      (p.updated_at || "").slice(0, 10)
    );
  }
}

// ── get ──────────────────────────────────────────────────────────────
export async function get(argv) {
  const { _: [slug], format = "json" } = parseArgs(argv);
  if (!slug) throw new Error("Usage: blog-cms get <slug> [--format=json|md]");
  const sb = await adminClient();
  const { data, error } = await sb.from("blog_posts").select("*").eq("slug", slug).maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No post with slug "${slug}"`);
  if (format === "md") console.log(postToMarkdown(data));
  else console.log(JSON.stringify(data, null, 2));
}

// ── publish / unpublish ─────────────────────────────────────────────
async function setStatus(slug, status) {
  const sb = await adminClient();
  const { data, error } = await sb.from("blog_posts").update({ status }).eq("slug", slug).select("slug,status").maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`No post with slug "${slug}"`);
  return data;
}

export async function publish(argv) {
  const { _: [slug] } = parseArgs(argv);
  if (!slug) throw new Error("Usage: blog-cms publish <slug>");
  const r = await setStatus(slug, "published");
  console.log(`✓ ${r.slug} → ${r.status}`);
}

export async function unpublish(argv) {
  const { _: [slug] } = parseArgs(argv);
  if (!slug) throw new Error("Usage: blog-cms unpublish <slug>");
  const r = await setStatus(slug, "draft");
  console.log(`✓ ${r.slug} → ${r.status}`);
}

// ── pull ─────────────────────────────────────────────────────────────
export async function pull(argv) {
  const { _: [outDir = "./content"], status } = parseArgs(argv);
  await mkdir(outDir, { recursive: true });
  const sb = await adminClient();
  let q = sb.from("blog_posts").select("*").order("date", { ascending: false });
  if (status) q = q.eq("status", status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  let n = 0;
  for (const post of data) {
    if (!post.slug) continue;
    const path = join(outDir, `${post.slug}.md`);
    await writeFile(path, postToMarkdown(post), "utf8");
    n++;
  }
  console.log(`✓ Pulled ${n} post${n === 1 ? "" : "s"} → ${outDir}`);
}

// ── push ─────────────────────────────────────────────────────────────
async function pushOne(sb, post) {
  if (!post.slug) throw new Error("Markdown is missing 'slug' in frontmatter");
  const { data: existing } = await sb.from("blog_posts").select("id").eq("slug", post.slug).maybeSingle();
  if (existing) {
    const { error } = await sb.from("blog_posts").update({
      title: post.title, excerpt: post.excerpt, content: post.content, status: post.status,
      category: post.category, tags: post.tags, author: post.author, date: post.date,
      meta_description: post.meta_description, keywords: post.keywords, image: post.image,
      youtube_id: post.youtube_id, read_time: post.read_time,
    }).eq("id", existing.id);
    if (error) throw new Error(`update ${post.slug}: ${error.message}`);
    return "updated";
  } else {
    const { error } = await sb.from("blog_posts").insert({
      slug: post.slug, title: post.title, excerpt: post.excerpt, content: post.content,
      status: post.status || "draft", category: post.category, tags: post.tags,
      author: post.author, date: post.date, meta_description: post.meta_description,
      keywords: post.keywords, image: post.image, youtube_id: post.youtube_id,
      read_time: post.read_time, original_content: post.content,
    });
    if (error) throw new Error(`insert ${post.slug}: ${error.message}`);
    return "created";
  }
}

export async function push(argv) {
  const { _: [filePath] } = parseArgs(argv);
  if (!filePath) throw new Error("Usage: blog-cms push <file.md>");
  const text = await readFile(filePath, "utf8");
  const post = markdownToPost(text);
  const sb = await adminClient();
  const action = await pushOne(sb, post);
  console.log(`✓ ${action}: ${post.slug}`);
}

// ── sync ─────────────────────────────────────────────────────────────
export async function sync(argv) {
  const { _: [dir = "./content"] } = parseArgs(argv);
  await mkdir(dir, { recursive: true });
  const sb = await adminClient();

  const { data: remote, error } = await sb.from("blog_posts").select("*");
  if (error) throw new Error(error.message);

  const remoteBySlug = new Map(remote.map((p) => [p.slug, p]));

  const localFiles = (await readdir(dir)).filter((f) => extname(f) === ".md");
  const localBySlug = new Map();
  for (const f of localFiles) {
    const text = await readFile(join(dir, f), "utf8");
    const post = markdownToPost(text);
    if (post.slug) localBySlug.set(post.slug, post);
    else localBySlug.set(basename(f, ".md"), { ...post, slug: basename(f, ".md") });
  }

  let pulled = 0, pushed = 0, skipped = 0;

  // pull: anything remote that's missing locally → write to disk
  for (const [slug, rpost] of remoteBySlug) {
    if (!localBySlug.has(slug)) {
      await writeFile(join(dir, `${slug}.md`), postToMarkdown(rpost), "utf8");
      pulled++;
    } else {
      skipped++;
    }
  }
  // push: anything local that's missing remote OR newer than remote (best-effort by content)
  for (const [slug, lpost] of localBySlug) {
    if (!remoteBySlug.has(slug)) {
      try { await pushOne(sb, lpost); pushed++; }
      catch (e) { console.error(`  ! push ${slug}: ${e.message}`); }
    }
  }

  console.log(`✓ Sync complete — pulled ${pulled}, pushed ${pushed}, already-synced ${skipped}`);
}
