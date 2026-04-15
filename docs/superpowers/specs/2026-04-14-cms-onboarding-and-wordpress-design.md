# CMS Onboarding Hub + WordPress Publishing

**Date:** 2026-04-14
**Status:** Approved
**Scope:** Three parallel workstreams to make the CMS usable by anyone — documentation hub, WordPress publishing, and MCP prompt registration.

## Problem

Users who connect to the CMS get raw CRUD tools and a bare API reference page. They don't know:
- How to generate blog posts (the workflow prompts)
- How to set up a knowledge base or feedback loop
- How to connect their website (WordPress, static, or Supabase)
- How to customize prompts for their niche
- Where to get the database schema

The CMS also has no way to publish to WordPress or other CMS platforms, which means users without Supabase-powered websites can't use it.

## Workstream 1: Documentation Hub (Docs Page Expansion)

### Current State
`src/pages/Docs.jsx` has 4 sections: MCP setup, MCP tools table, REST API endpoints, content block types. It's API reference only.

### Target State
A multi-section docs page with tab navigation covering everything a new user needs.

### Sections to Add

**1. Getting Started**
- What this CMS does (2-3 sentences)
- Quick start: sign up → create first post → publish
- Architecture overview: CMS → API/MCP → Your Website

**2. Prompts & Workflows** (the existing `prompts/*.md` files, presented in-app)
- Generate Blog Post — full workflow with transcript → blog
- Research Topic — keyword research with or without DataForSEO
- SEO Review — pre-publish quality check
- Setup Knowledge Base — voice/style sources
- Build Public Website — scaffold the reader site
- Each prompt: description, prerequisites, the full prompt text (copyable), example usage

**3. Database Setup**
- Copyable SQL schema from `supabase/schema.sql`
- Step-by-step: create Supabase project → run SQL → connect
- Table reference with columns and types
- RLS policy explanation

**4. Feedback Loop Setup**
- What it does (CMS learns from your edits)
- How to enable vector embeddings
- Edge Function deployment steps
- How preferences work

**5. Connect Your Website**
- **Option A: Supabase direct** — your website reads from the same DB
- **Option B: REST API** — fetch published posts via API key
- **Option C: WordPress** — publish directly from CMS to WordPress (see Workstream 2)
- Code snippets for each: fetch, Next.js, React, WordPress

**6. Customization Guide**
- How to adapt prompts for your niche
- Adding custom content block types
- Workspace settings (default author, categories, site URL)
- Style preferences system

**7. API Reference** (existing — keep as-is)
- MCP setup, tools, REST endpoints, content blocks

### Implementation
- Add tab navigation to `Docs.jsx` (or sub-navigation within the page)
- Each section is a component in `src/pages/docs/` for maintainability
- Prompt content can be hardcoded (they rarely change) or read from a shared constants file
- The Supabase schema section reads from a constant (snapshot of `supabase/schema.sql`)

## Workstream 2: WordPress Publishing Integration

### Goal
Let users publish blog posts from the CMS directly to their WordPress site. This is the bridge for users who don't use Supabase for their public website.

### User Flow
1. Go to Settings → WordPress Connection
2. Enter: WordPress site URL, username, application password
3. Save (credentials stored in workspace settings JSONB)
4. From any published post → "Publish to WordPress" button
5. CMS converts JSONB content blocks → WordPress HTML
6. POST to WordPress REST API (`/wp-json/wp/v2/posts`)
7. Shows success with link to the WordPress post

### Architecture

**Settings Storage:**
- Store WordPress credentials in `workspaces.settings` JSONB:
  ```json
  {
    "wordpress": {
      "site_url": "https://example.com",
      "username": "admin",
      "app_password": "xxxx xxxx xxxx xxxx"
    }
  }
  ```
- App password is WordPress's built-in auth for REST API (no plugins needed)

**Content Conversion (`lib/wordpress.js`):**
- `paragraph` → `<p>text</p>`
- `heading` → `<h2>text</h2>`
- `subheading` → `<h3>text</h3>`
- `list` → `<ul><li>...</li></ul>`
- `callout` → styled `<div>` with background color
- `quote` → `<blockquote>`
- `image` → `<figure><img><figcaption>`
- `table` → `<table>` with headers and rows
- `pros-cons` → two-column `<div>` or `<table>`
- `info-box` → styled `<div>`
- `stat-cards` → styled grid `<div>`
- `process-steps` → `<ol>` with styled steps
- `prompt` → skip (internal only)

**API Endpoint:**
- `POST /api/v1/posts/:id/publish-wordpress`
- Authenticated (requires API key)
- Reads WordPress credentials from workspace settings
- Converts content blocks → HTML
- POSTs to WordPress REST API
- Returns WordPress post URL

**Frontend:**
- "Publish to WordPress" button in PostEditor (only visible if WordPress is configured)
- WordPress settings section in Settings page
- Test connection button

### WordPress REST API Details
- Endpoint: `POST {site_url}/wp-json/wp/v2/posts`
- Auth: Basic auth with username + app password (Base64 encoded)
- Body: `{ title, content, status: "draft"|"publish", excerpt, slug, categories, tags }`
- Categories and tags need to be resolved to WordPress IDs (or created)

### Out of Scope (for now)
- Image upload to WordPress media library
- Bidirectional sync (WordPress → CMS)
- Category/tag mapping UI
- Scheduled publishing to WordPress
- Other platforms (Ghost, Webflow, etc.) — architecture should allow adding these later

## Workstream 3: MCP Prompt Registration

### Goal
When users connect the MCP server, they get prompts (not just tools) that guide them through workflows.

### Prompts to Register
| Name | Description | Content Source |
|------|------------|---------------|
| `getting-started` | Full onboarding — create workspace, set preferences, generate first post | New (synthesize from existing docs) |
| `generate-blog-post` | YouTube transcript → blog post with voice matching | `prompts/generate-blog-post.md` |
| `research-topic` | Keyword research and topic pipeline | `prompts/research-topic.md` |
| `seo-review` | Pre-publish SEO quality check | `prompts/seo-review.md` |
| `setup-knowledge-base` | Set up voice/style sources | `prompts/setup-knowledge-base.md` |
| `build-public-website` | Scaffold the reader-facing website | `prompts/build-public-website.md` |
| `publish-to-wordpress` | Set up and use WordPress publishing | New |

### Implementation
- Inline prompt content in a shared `lib/mcp-prompts.js`
- Register via `server.prompt()` in both `api/mcp.js` and `bin/mcp-server.js`
- Extract shared tool definitions into `lib/mcp-tools.js` to eliminate duplication between the two servers
- Fix name mismatch: both servers should be `moonify-cms`

## Files Changed

### Workstream 1 (Docs)
- `src/pages/Docs.jsx` — Refactor into tabbed layout, import section components
- `src/pages/docs/GettingStarted.jsx` — New
- `src/pages/docs/PromptsWorkflows.jsx` — New
- `src/pages/docs/DatabaseSetup.jsx` — New
- `src/pages/docs/FeedbackLoop.jsx` — New
- `src/pages/docs/ConnectWebsite.jsx` — New
- `src/pages/docs/Customization.jsx` — New
- `src/pages/docs/ApiReference.jsx` — Extracted from current Docs.jsx

### Workstream 2 (WordPress)
- `src/lib/wordpress.js` — Content block → HTML converter (frontend preview)
- `src/pages/Settings.jsx` — Add WordPress connection section
- `src/pages/PostEditor.jsx` — Add "Publish to WordPress" button
- `api/v1/posts/[id]/publish-wordpress.js` — New Vercel Function
- `api/_lib/wordpress.js` — WordPress API client + HTML converter (backend)

### Workstream 3 (MCP Prompts)
- `lib/mcp-prompts.js` — New: shared prompt definitions
- `lib/mcp-tools.js` — New: shared tool registration logic
- `api/mcp.js` — Refactor to use shared modules, add prompts
- `bin/mcp-server.js` — Refactor to use shared modules, add prompts

## Dependencies Between Workstreams

None — all three are independent and can be built in parallel. Workstream 2 adds a "WordPress" option to Workstream 1's "Connect Your Website" section, but each can reference the other without blocking.
