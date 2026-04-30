# Blog CMS — Claude Code Instructions

## Overview

This is a lightweight CMS for managing AI-generated blog posts. Built with React 19, Vite, Tailwind CSS 4, and Supabase.

- **Repository:** [github.com/puzzled-mushroom911/blog-cms](https://github.com/puzzled-mushroom911/blog-cms)
- **Directory:** `~/blog-cms/`
- **Supabase project ID:** (your project ref — find it in your Supabase URL: `https://<project-id>.supabase.co`)
- **Dev server:** `cd ~/blog-cms && npm run dev`

## "CMS" as Context Keyword

When the user references **"CMS"** in conversation, it means this blog CMS and its Supabase tables. Use Supabase MCP to read/write data. Get the project ID from `.env` (`VITE_SUPABASE_URL` contains it).

## MCP Server vs Prompts

The MCP server (`bin/mcp-server.js` for Claude Desktop, `api/mcp.js` for Vercel) provides CRUD tools for posts, topics, and preferences. The **prompt templates** in `prompts/` are NOT served by the MCP server — they are reference files in the repo. Users need to clone the repo or access prompts from the [GitHub repository](https://github.com/puzzled-mushroom911/blog-cms/tree/main/prompts).

Available prompts:
- `prompts/generate-blog-post.md` — Turn a YouTube transcript into a blog post
- `prompts/research-topic.md` — Research a keyword with DataForSEO and save to the CMS
- `prompts/seo-review.md` — Audit a post for SEO quality before publishing
- `prompts/setup-knowledge-base.md` — Set up your voice/style knowledge base
- `prompts/build-public-website.md` — Build the public-facing reader site

## CMS Navigation

The CMS has 5 sidebar items:

| Page | Route | Purpose |
|------|-------|---------|
| **Content** | `/` | Unified feed of blog posts and SEO pages. Filter by status (Draft, In Review, Scheduled, Published) and type (Blog, SEO Page). Create new posts with "+ New Post" button. |
| **Calendar** | `/calendar` | Monthly calendar view of scheduled content. Quick-approve buttons on draft/review items. |
| **Analytics** | `/analytics` | Keyword opportunity maps, pipeline funnel, difficulty distribution, publishing velocity, top opportunities table. |
| **Docs** | `/docs` | In-app documentation: Getting Started, Prompts & Workflows, Database Setup, Feedback Loop, Connect Website, Customization, API Reference. |
| **Settings** | `/settings` | Database connection, content preferences (style rules), API keys, Content Pipeline toggle, site configuration. |

**Content Pipeline** (`/topics`) — available when toggled on in Settings. Advanced topic research and keyword management with statuses: idea → researched → approved → writing → written.

### Three Workflow Types

1. **Manual**: "Write me a blog about [topic]" → use `create_post` with all fields → appears in Content feed as Draft
2. **Collaborative**: "What topics should we cover?" → research with DataForSEO → save with `create_topic` → user approves in CMS → write with `create_post` → link via `update_topic` with blog_post_id
3. **Automated**: Research + write on a schedule → posts appear as Drafts → user reviews in Content feed or Calendar

### Post Editor Sidebar

Two tabs:
- **Metadata** — title, slug, excerpt, category, tags, author, date, featured image, YouTube ID, keywords, meta description, sources, ai_reasoning
- **SEO** — AI reasoning, keyword data (volume, difficulty, CPC), related keywords, People Also Ask, SERP features, content gaps (pulled from linked blog_topic)

## Tables

### `blog_posts` — Published blog content

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| slug | text | Unique, used in URLs |
| title | text | Post title |
| excerpt | text | Short description |
| date | date | Publish date |
| read_time | text | e.g. "5 min read" |
| author | text | Author name |
| category | text | General, How-To, Guide, Review, News, Tips, Case Study, Comparison |
| tags | text[] | Array of tag strings |
| youtube_id | text | YouTube video ID (nullable) |
| image | text | Featured image URL |
| meta_description | text | SEO meta description |
| keywords | text | SEO keywords |
| content | JSONB | Array of content blocks (paragraph, heading, list, callout, quote, image, table, stat-cards, pros-cons, info-box, process-steps) |
| status | text | draft, needs-review, published (see Status Transitions below) |
| editor_notes | JSONB | Array of {blockIndex, text, author, createdAt, resolved} — inline comments on content blocks (see Resolving Editor Comments workflow) |
| sources | JSONB | Array of {url, title, type, note} — research sources (internal only, not shown on public site). Types: reddit, youtube, government, news, data, mls, local, other |
| ai_reasoning | text | How the AI researched and structured the content (internal only) |
| workspace_id | UUID | FK to workspaces.id — scopes data per workspace |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-set |

### `blog_topics` — Topic research pipeline

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| title | text | Topic name / working title |
| primary_keyword | text | Main target keyword |
| secondary_keywords | text[] | Supporting keywords |
| search_volume | integer | Monthly search volume |
| keyword_difficulty | integer | 0-100 difficulty score |
| cpc | numeric(10,2) | Cost per click |
| competition_level | text | low, medium, high |
| status | text | researched, approved, discarded, writing, written |
| research_data | JSONB | Full research payload (see structure below) |
| blog_post_id | UUID | FK to blog_posts.id (set when blog is written) |
| seo_page_id | UUID | FK to seo_pages.id (if topic feeds a programmatic page instead of a blog post) |
| notes | text | Reviewer notes |
| workflow_type | text | `editorial` (default) or other workflow types |
| workspace_id | UUID | FK to workspaces.id |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

### `feedback` — Edit diffs (learning engine)

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| post_id | UUID | FK to blog_posts.id |
| block_index | integer | Which content block was edited |
| block_type | text | paragraph, heading, list, etc. |
| original_text | text | What the AI originally generated |
| edited_text | text | What the user changed it to |
| context | text | Post title for retrieval context |
| created_at | timestamptz | Auto-set |

### `feedback_embeddings` — Vector store for semantic search

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Auto-increment PK |
| feedback_id | UUID | FK to feedback.id |
| content | text | Formatted text that was embedded |
| embedding | vector(384) | gte-small embedding (pgvector) |

### `preferences` — Global style rules

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| rule | text | Style directive text |
| category | text | tone, structure, vocabulary, formatting |
| active | boolean | Toggle without deleting |
| created_at | timestamptz | Auto-set |

### `blog_posts.original_content` — AI baseline

JSONB column added to `blog_posts`. Set once on insert (same value as `content`), never updated. Used to diff against user edits for feedback capture. `NULL` for posts created before Phase 2.

### `seo_pages` — Programmatic SEO pages

For programmatic/templated pages (e.g. "moving from X to Y" pages) separate from editorial blog posts.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| slug | text | Unique, used in URLs |
| page_type | text | Template type (e.g. "moving-from") |
| title | text | Page title |
| h1 | text | H1 heading (can differ from title) |
| meta_description | text | SEO meta description |
| keywords | text | SEO keywords |
| data | JSONB | Structured data for the page template |
| content | JSONB | Content blocks (same format as blog_posts) |
| internal_links | JSONB | Links to related posts/pages |
| status | text | draft, published |
| scheduled_date | date | When to auto-publish (nullable) |
| workspace_id | UUID | FK to workspaces.id |

### `editorial_research` — Saved research sources

Stores research material gathered during content creation. Link to the post it was used in.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| source_type | text | Type of source (e.g. reddit, youtube, government, news) |
| source_name | text | Name/title of the source |
| source_url | text | URL to the source |
| title | text | Title of the research entry |
| summary | text | Summary of the relevant content |
| raw_content | text | Full text if captured |
| tags | text[] | Topic tags for retrieval |
| relevance_score | integer | 0-100 relevance rating |
| used_in_post_id | UUID | FK to blog_posts.id (nullable) |

### `blog_post_relations` — Internal linking

Tracks internal links between posts for the internal linking graph.

| Column | Type | Notes |
|--------|------|-------|
| id | serial | Primary key |
| from_slug | text | Source post slug |
| to_slug | text | Target post slug |
| unique | | (from_slug, to_slug) pair is unique |

### `cms_block_comments` — Inline block comments

Separate from `editor_notes` on the post. These are standalone comments on specific content blocks, stored in their own table.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| post_id | UUID | FK to blog_posts.id |
| block_index | integer | Which content block |
| comment_text | text | The comment |
| status | text | open, resolved |
| created_by | UUID | FK to auth.users |

### Workspace scoping

All major tables (`blog_posts`, `blog_topics`, `seo_pages`, `preferences`, `feedback`, `feedback_embeddings`) have a `workspace_id` column. When querying via the MCP server, data is automatically scoped to the authenticated workspace. When using Supabase MCP directly (via SQL), include `workspace_id` in your queries if the user has multiple workspaces.

## Topic Pipeline Workflows

### Saving researched topics → "put topics in the CMS"

When the user asks you to save researched topics to the CMS:

1. Use Supabase MCP to INSERT into `blog_topics`
2. Populate all typed columns: title, primary_keyword, secondary_keywords, search_volume, keyword_difficulty, cpc, competition_level
3. Build `research_data` JSONB following the structure below
4. Set status to `'researched'`

### Writing approved topics → "write the approved topics from the CMS"

When the user asks you to write approved topics:

1. Query `blog_topics` WHERE `status = 'approved'`
2. For each topic, use `research_data` as the SEO brief to guide writing
3. Write the blog post content as a JSONB array of content blocks
4. INSERT the blog post into `blog_posts` with status `'draft'`
5. UPDATE the topic: set `status = 'written'` and `blog_post_id = <new post id>`

### Checking for changes → "I made changes in the CMS"

When the user says they made changes in the CMS:

1. Query `blog_topics` ordered by `updated_at DESC` (limit 10) to see recent changes
2. Also check `blog_posts` if the user mentions blog changes
3. Report what changed (status updates, new notes, etc.)

### Resolving editor comments → "correct the blog post based on my comments"

When the user asks you to fix/resolve editor comments on a post:

1. **Find the post:**

```sql
SELECT id, title, slug, status
FROM blog_posts
WHERE title ILIKE '%<search term>%'
  AND editor_notes IS NOT NULL
  AND editor_notes != '[]'::jsonb;
```

2. **Use the helper function to get comments with context** (returns block type, nearest heading, and text preview — no manual counting needed):

```sql
SELECT * FROM get_comments_with_context('<post_id>');
```

This returns: `block_index`, `block_type`, `nearest_heading`, `text_preview`, `comment_text`, `author`, `created_at`, `resolved`.

3. **Identify unresolved comments:** Filter results where `resolved = false`. Present a summary to the user before making changes:
   - "Comment on block 21 (table under 'Flood Insurance' heading): ..."
   - "Comment on block 51 (paragraph under 'Sinkhole Coverage' heading): ..."

4. **Fetch the full content for editing:**

```sql
SELECT content, editor_notes FROM blog_posts WHERE id = '<post_id>';
```

5. **For each unresolved comment:**
   - Read the comment `.text` to understand what needs to change
   - Locate the block at `content[blockIndex]`
   - Apply the fix using `jsonb_set(content, '{<blockIndex>,<field>}', '<new value>')`
   - If the comment says to leave something alone or asks a question you can't answer, report it back to the user instead of guessing

6. **Mark all addressed comments as resolved** using a single update:

```sql
UPDATE blog_posts
SET
  content = jsonb_set(jsonb_set(content, ...), ...),  -- chain fixes
  editor_notes = (
    SELECT jsonb_agg(elem || '{"resolved": true}'::jsonb)
    FROM jsonb_array_elements(editor_notes) AS elem
  )
WHERE id = '<post_id>';
```

7. **Set status based on outcome:**
   - All comments resolved → set status to `'published'` (unless the user says otherwise)
   - Some comments need user input → keep status as `'needs-review'` and report which ones

## Status Transitions

| From | To | Trigger |
|------|----|---------|
| `draft` | `needs-review` | AI finishes writing, post is ready for human review |
| `needs-review` | `published` | User approves in CMS, or all editor comments resolved |
| `needs-review` | `draft` | User decides post needs major rework |
| `published` | `needs-review` | User adds new editor comments to a live post |
| `published` | `draft` | User unpublishes a post |

When resolving comments, default to `published` unless the user explicitly says to keep it in review.

### Feedback loop — learning from user edits

When the user edits a blog post in the CMS and saves, the system automatically:
1. Diffs `original_content` against the current `content` block-by-block
2. Inserts changed blocks into the `feedback` table
3. An Edge Function generates vector embeddings for each feedback entry

When generating new blog posts, query `preferences` for active style rules and use `query_feedback` RPC for relevant past corrections. See `prompts/generate-blog-post.md` for the full workflow.

## research_data JSONB Structure

Save research data in this format. The structure supports both manual research and DataForSEO-powered research. All fields are optional — the CMS renders whatever is present.

```json
{
  "keyword_data": {
    "monthly_searches": [{ "month": "2026-03", "volume": 1200 }],
    "competition_index": 0.45,
    "high_top_of_page_bid": 3.50,
    "low_top_of_page_bid": 1.20
  },
  "related_keywords": [
    {
      "keyword": "best neighborhoods st pete",
      "search_volume": 880,
      "keyword_difficulty": 35,
      "cpc": 2.10,
      "competition_level": "medium"
    }
  ],
  "serp_results": [
    {
      "position": 1,
      "title": "Top 10 Neighborhoods in St. Pete",
      "url": "https://example.com/neighborhoods",
      "domain": "example.com",
      "description": "...",
      "type": "organic"
    }
  ],
  "serp_features": ["featured_snippet", "people_also_ask", "local_pack"],
  "people_also_ask": ["What are the best neighborhoods?", "Is St Pete safe?"],
  "competitors": [
    {
      "domain": "example.com",
      "avg_position": 3.2,
      "estimated_traffic": 450,
      "relevant_keywords": 12
    }
  ],
  "competitor_analysis": [
    {
      "domain": "example.com",
      "what_they_cover": "...",
      "what_they_miss": "..."
    }
  ],
  "ai_search_presence": {
    "ai_search_volume": 320,
    "summary": "How LLMs currently cover this topic",
    "mentions_our_site": false,
    "top_mentioned_domains": ["domain1.com", "domain2.com"]
  },
  "serp_overview": {
    "top_results_summary": "What's ranking and content type",
    "content_types": ["article", "video", "local_pack"],
    "featured_snippets": true
  },
  "content_gaps": ["Gap 1 description", "Gap 2 description"],
  "suggested_angles": ["Angle 1", "Angle 2"],
  "full_brief": "Complete markdown SEO brief"
}
```

**DataForSEO research:** Use the prompt template at `prompts/research-topic.md` to research topics via Claude Code + DataForSEO MCP tools.

## Content Block Types (for blog_posts.content)

When writing blog posts, use these JSONB block types. These field names match what the ContentRenderer component expects — use them exactly.

- `{ "type": "paragraph", "text": "..." }`
- `{ "type": "heading", "text": "..." }`
- `{ "type": "subheading", "text": "..." }`
- `{ "type": "list", "items": ["item1", "item2"] }`
- `{ "type": "process-steps", "steps": [{ "title": "...", "text": "..." }] }`
- `{ "type": "callout", "title": "...", "text": "..." }`
- `{ "type": "quote", "text": "...", "attribution": "..." }`
- `{ "type": "info-box", "content": "...", "variant": "warning" }` (variant optional, defaults to blue)
- `{ "type": "image", "src": "...", "alt": "...", "caption": "..." }`
- `{ "type": "table", "headers": ["..."], "rows": [["...", "..."]] }`
- `{ "type": "stat-cards", "cards": [{ "number": "95%", "label": "...", "sublabel": "..." }] }`
- `{ "type": "pros-cons", "pros": ["..."], "cons": ["..."], "prosTitle": "...", "consTitle": "..." }` (titles optional)

## Prompt Block Type

The `prompt` block type is a special instruction block for Claude. It appears in the editor with a violet dashed border and is NOT rendered on the public site. Use it to leave instructions within the content for Claude to process.

- `{ "type": "prompt", "text": "Generate a comparison table of flood insurance costs by zone..." }`

## Revalidation

When `VITE_REVALIDATE_URL` is set in `.env`, the CMS will POST to that URL after saving a published post. This triggers ISR cache refresh on the public site so changes appear immediately.

For Next.js sites, set this to: `https://yourdomain.com/admin/api/revalidate`
