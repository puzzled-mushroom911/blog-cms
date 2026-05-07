/**
 * blog_posts.content (JSONB block array) ↔ markdown roundtrip.
 *
 * Prose-native blocks (paragraph, heading, subheading, list, quote, image,
 * table) serialize as canonical markdown so they're editable in any editor.
 * Structured blocks (callout, info-box, process-steps, stat-cards, pros-cons,
 * prompt) round-trip via fenced JSON code blocks tagged with their type, e.g.
 *
 *     ```cms:callout
 *     { "title": "...", "text": "..." }
 *     ```
 *
 * Frontmatter carries everything else (slug, title, status, tags, etc.).
 */

const STRUCTURED_TYPES = new Set([
  "callout",
  "info-box",
  "process-steps",
  "stat-cards",
  "pros-cons",
  "prompt",
]);

const FRONTMATTER_FIELDS = [
  "slug", "title", "excerpt", "date", "read_time", "author", "category",
  "tags", "youtube_id", "image", "meta_description", "keywords", "status",
];

// ── Serialize ────────────────────────────────────────────────────────

function escapeYaml(v) {
  if (v === null || v === undefined) return "";
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) return `[${v.map((x) => `"${String(x).replace(/"/g, '\\"')}"`).join(", ")}]`;
  const s = String(v);
  // Quote only when YAML actually requires it: contains colon-space, hash-space,
  // newline, leading whitespace, or starts with a YAML special indicator.
  const needsQuote =
    /[\n"'\\]/.test(s) ||
    /:\s/.test(s) ||
    /#\s/.test(s) ||
    /^[\s\-?:>|@`!&*]/.test(s);
  if (needsQuote) return `"${s.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
  return s;
}

function blockToMarkdown(b) {
  switch (b.type) {
    case "paragraph": return b.text || "";
    case "heading":   return `## ${b.text || ""}`;
    case "subheading":return `### ${b.text || ""}`;
    case "list":      return (b.items || []).map((i) => `- ${i}`).join("\n");
    case "quote": {
      const attr = b.attribution ? `\n> — ${b.attribution}` : "";
      return `> ${(b.text || "").split("\n").join("\n> ")}${attr}`;
    }
    case "image": {
      const cap = b.caption ? `\n*${b.caption}*` : "";
      return `![${b.alt || ""}](${b.src || ""})${cap}`;
    }
    case "table": {
      const headers = b.headers || [];
      const rows = b.rows || [];
      if (headers.length === 0) return "";
      const head = `| ${headers.join(" | ")} |`;
      const sep = `| ${headers.map(() => "---").join(" | ")} |`;
      const body = rows.map((r) => `| ${r.join(" | ")} |`).join("\n");
      return [head, sep, body].filter(Boolean).join("\n");
    }
    default:
      // structured block → fenced JSON
      return "```cms:" + b.type + "\n" + JSON.stringify(b, null, 2) + "\n```";
  }
}

export function postToMarkdown(post) {
  const fm = ["---"];
  for (const k of FRONTMATTER_FIELDS) {
    if (post[k] === null || post[k] === undefined) continue;
    fm.push(`${k}: ${escapeYaml(post[k])}`);
  }
  fm.push("---", "");
  const body = (post.content || []).map(blockToMarkdown).join("\n\n");
  return fm.join("\n") + body + "\n";
}

// ── Parse ────────────────────────────────────────────────────────────

function parseYamlValue(raw) {
  const s = raw.trim();
  if (s === "" || s === "null") return null;
  if (s === "true") return true;
  if (s === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(s)) return Number(s);
  if (s.startsWith("[") && s.endsWith("]")) {
    return s.slice(1, -1).split(",").map((x) => x.trim().replace(/^["']|["']$/g, "")).filter(Boolean);
  }
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    return s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
  return s;
}

function parseFrontmatter(text) {
  if (!text.startsWith("---\n")) return { meta: {}, body: text };
  const end = text.indexOf("\n---", 4);
  if (end === -1) return { meta: {}, body: text };
  const block = text.slice(4, end);
  const body = text.slice(end + 4).replace(/^\n/, "");
  const meta = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^([a-z_]+):\s*(.*)$/i);
    if (m) meta[m[1]] = parseYamlValue(m[2]);
  }
  return { meta, body };
}

function splitBlocks(body) {
  const out = [];
  const lines = body.split("\n");
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    // fenced code (cms:type or generic)
    if (line.startsWith("```")) {
      const lang = line.slice(3).trim();
      const start = i + 1;
      let j = start;
      while (j < lines.length && !lines[j].startsWith("```")) j++;
      out.push({ kind: "fence", lang, content: lines.slice(start, j).join("\n") });
      i = j + 1;
      continue;
    }
    // table — header line, sep line, body lines
    if (line.startsWith("| ") && lines[i + 1] && /^\|\s*-+/.test(lines[i + 1])) {
      let j = i + 2;
      while (j < lines.length && lines[j].startsWith("|")) j++;
      out.push({ kind: "table", lines: lines.slice(i, j) });
      i = j;
      continue;
    }
    // list — consecutive `- ` lines
    if (line.startsWith("- ")) {
      let j = i;
      while (j < lines.length && lines[j].startsWith("- ")) j++;
      out.push({ kind: "list", lines: lines.slice(i, j) });
      i = j;
      continue;
    }
    // quote — consecutive `> ` lines
    if (line.startsWith("> ")) {
      let j = i;
      while (j < lines.length && lines[j].startsWith("> ")) j++;
      out.push({ kind: "quote", lines: lines.slice(i, j) });
      i = j;
      continue;
    }
    // image (single-line)
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)\s*$/);
    if (imgMatch) {
      const next = lines[i + 1];
      const capMatch = next ? next.match(/^\*([^*]+)\*\s*$/) : null;
      out.push({ kind: "image", alt: imgMatch[1], src: imgMatch[2], caption: capMatch ? capMatch[1] : null });
      i += capMatch ? 2 : 1;
      continue;
    }
    // heading
    if (line.startsWith("### ")) { out.push({ kind: "subheading", text: line.slice(4) }); i++; continue; }
    if (line.startsWith("## "))  { out.push({ kind: "heading", text: line.slice(3) });    i++; continue; }
    // blank line
    if (line.trim() === "") { i++; continue; }
    // paragraph — accumulate until blank or special
    let j = i;
    const para = [];
    while (j < lines.length && lines[j].trim() !== "" && !lines[j].startsWith("```") && !lines[j].startsWith("- ") && !lines[j].startsWith("> ") && !lines[j].startsWith("##") && !lines[j].startsWith("| ")) {
      para.push(lines[j]);
      j++;
    }
    out.push({ kind: "paragraph", text: para.join(" ") });
    i = j;
  }
  return out;
}

function blockFromTokens(tok) {
  switch (tok.kind) {
    case "paragraph":  return { type: "paragraph", text: tok.text };
    case "heading":    return { type: "heading", text: tok.text };
    case "subheading": return { type: "subheading", text: tok.text };
    case "list":       return { type: "list", items: tok.lines.map((l) => l.replace(/^- /, "")) };
    case "quote": {
      const text = [];
      let attribution = null;
      for (const l of tok.lines) {
        const stripped = l.replace(/^> /, "");
        if (stripped.startsWith("— ")) attribution = stripped.slice(2);
        else text.push(stripped);
      }
      const out = { type: "quote", text: text.join("\n") };
      if (attribution) out.attribution = attribution;
      return out;
    }
    case "image": {
      const out = { type: "image", src: tok.src, alt: tok.alt };
      if (tok.caption) out.caption = tok.caption;
      return out;
    }
    case "table": {
      const [head, _sep, ...body] = tok.lines;
      const headers = head.split("|").slice(1, -1).map((c) => c.trim());
      const rows = body.map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
      return { type: "table", headers, rows };
    }
    case "fence": {
      if (tok.lang.startsWith("cms:")) {
        try {
          const block = JSON.parse(tok.content);
          if (!block.type) block.type = tok.lang.slice(4);
          return block;
        } catch {
          return { type: tok.lang.slice(4), text: tok.content };
        }
      }
      // generic fenced block becomes a code paragraph (preserves but doesn't structure)
      return { type: "paragraph", text: "```" + tok.lang + "\n" + tok.content + "\n```" };
    }
    default: return null;
  }
}

export function markdownToPost(text) {
  const { meta, body } = parseFrontmatter(text);
  const tokens = splitBlocks(body);
  const blocks = tokens.map(blockFromTokens).filter(Boolean);
  return { ...meta, content: blocks };
}
