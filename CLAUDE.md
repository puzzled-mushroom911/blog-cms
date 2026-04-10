# Blog CMS — Claude Code Instructions

## Overview

This is a lightweight CMS for managing AI-generated content. Built with React 19, Vite, Tailwind CSS 4, and Supabase.

- **Directory:** `~/blog-cms/`
- **Dev server:** `cd ~/blog-cms && npm run dev`
- **Categories** and **page types** are configurable in Settings — no code changes required.

## "CMS" as Context Keyword

When the user references **"CMS"** in conversation, it means this blog CMS and its Supabase tables. Use Supabase MCP to read/write data.

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
| category | text | Configurable in Settings (e.g. General, How-To, Guide, Review, News, Tips, Case Study, Comparison) |
| tags | text[] | Array of tag strings |
| youtube_id | text | YouTube video ID (nullable) |
| image | text | Featured image URL |
| meta_description | text | SEO meta description |
| keywords | text | SEO keywords |
| content | JSONB | Array of content blocks (paragraph, heading, subheading, list, callout, quote, image, table, stat-cards, pros-cons, info-box, process-steps) |
| status | text | draft, needs-review, published |
| editor_notes | JSONB | Array of {blockIndex, text, author, createdAt, resolved} — inline comments on content blocks |
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
| blog_post_id | UUID | FK to blog_posts.id (set when blog post is written) |
| workflow_type | text | editorial (weekly deep blog) or programmatic (daily SEO pages) |
| seo_page_id | UUID | FK to seo_pages.id (set when programmatic page is generated) |
| notes | text | Reviewer notes |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

### `seo_pages` — Programmatic SEO pages

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| slug | text | Unique, used in URLs |
| page_type | text | Free text — configurable in Settings (no DB constraint); e.g. compare, location, category, topic |
| title | text | Page title |
| h1 | text | Main heading |
| meta_description | text | SEO meta description |
| keywords | text | SEO keywords |
| data | JSONB | Structured data payload for the page template |
| content | JSONB | Array of content blocks (same block types as blog_posts) |
| internal_links | JSONB | Array of internal link objects |
| status | text | draft, needs-review, published |
| scheduled_date | date | Scheduled publish date (nullable — unscheduled if null) |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

### `editorial_research` — Accumulated research for blog posts

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | Primary key |
| source_type | text | podcast, youtube, web, dataforseo, rag, manual |
| source_name | text | Name of the source |
| source_url | text | URL of the source (nullable) |
| title | text | Research item title |
| summary | text | Summary of the key finding |
| raw_content | text | Full raw content (optional) |
| tags | text[] | Topic tags |
| relevance_score | integer | 0-100 relevance score |
| used_in_post_id | UUID | FK to blog_posts.id (set when research is incorporated) |
| created_at | timestamptz | Auto-set |

## Topic Pipeline Workflows

### Saving researched topics → "put topics in the CMS"

When the user asks you to save researched topics to the CMS:

1. Use Supabase MCP to INSERT into `blog_topics`
2. Populate all typed columns: title, primary_keyword, secondary_keywords, search_volume, keyword_difficulty, cpc, competition_level
3. Build `research_data` JSONB following the structure below
4. Set `workflow_type` to `'editorial'` (default) or `'programmatic'` as appropriate
5. Set status to `'researched'`

### Writing approved topics → "write the approved topics from the CMS"

When the user asks you to write approved topics:

1. Query `blog_topics` WHERE `status = 'approved'` AND `workflow_type = 'editorial'`
2. For each topic, use `research_data` as the SEO brief to guide writing
3. Write the blog post content as a JSONB array of content blocks
4. INSERT the blog post into `blog_posts` with status `'draft'`
5. UPDATE the topic: set `status = 'written'` and `blog_post_id = <new post id>`

### Generating programmatic SEO pages → "generate the programmatic topics"

When the user asks you to generate programmatic pages:

1. Query `blog_topics` WHERE `status = 'approved'` AND `workflow_type = 'programmatic'`
2. For each topic, build the structured `data` payload and content blocks for the page template
3. INSERT the page into `seo_pages` with status `'draft'`
4. UPDATE the topic: set `status = 'written'` and `seo_page_id = <new page id>`

### Checking for changes → "I made changes in the CMS"

When the user says they made changes in the CMS:

1. Query `blog_topics` ordered by `updated_at DESC` (limit 10) to see recent changes
2. Also check `blog_posts` or `seo_pages` if the user mentions changes to those
3. Report what changed (status updates, new notes, etc.)

### Approval queue → "what needs review"

1. Query `blog_posts` WHERE `status = 'needs-review'`
2. Query `seo_pages` WHERE `status = 'needs-review'`
3. Report counts and titles; team reviews and approves in the CMS

## research_data JSONB Structure

Always save research data in this format for consistency:

```json
{
  "competitor_analysis": [
    {
      "domain": "example.com",
      "what_they_cover": "...",
      "what_they_miss": "..."
    }
  ],
  "content_gaps": [
    "Gap 1 description",
    "Gap 2 description"
  ],
  "ai_search_presence": {
    "summary": "How LLMs currently cover this topic",
    "mentions_our_site": false,
    "top_mentioned_domains": ["domain1.com", "domain2.com"]
  },
  "serp_overview": {
    "top_results_summary": "What's ranking and content type",
    "content_types": ["article", "video", "local_pack"],
    "featured_snippets": true
  },
  "suggested_angles": [
    "Angle 1 — why it works for the target audience",
    "Angle 2 — differentiation opportunity"
  ],
  "full_brief": "Complete markdown SEO brief including all of the above in readable format"
}
```

## Content Block Types (for blog_posts.content and seo_pages.content)

When writing blog posts or SEO pages, use these JSONB block types:

- `{ "type": "paragraph", "text": "..." }`
- `{ "type": "heading", "text": "..." }`
- `{ "type": "subheading", "text": "..." }`
- `{ "type": "list", "items": ["item1", "item2"] }`
- `{ "type": "process-steps", "steps": [{ "title": "...", "text": "..." }] }`
- `{ "type": "callout", "title": "...", "text": "..." }`
- `{ "type": "quote", "text": "...", "author": "..." }`
- `{ "type": "info-box", "title": "...", "text": "...", "variant": "blue|warning" }`
- `{ "type": "image", "src": "...", "alt": "...", "caption": "..." }`
- `{ "type": "table", "headers": ["..."], "rows": [["...", "..."]] }`
- `{ "type": "stat-cards", "items": [{ "label": "...", "value": "..." }] }`
- `{ "type": "pros-cons", "pros": ["..."], "cons": ["..."] }`

## Prompt Block Type

The `prompt` block type is a special instruction block for Claude. It appears in the editor with a violet dashed border and is NOT rendered on the public site. Use it to leave instructions within the content for Claude to process.

- `{ "type": "prompt", "text": "Generate a comparison table of pricing tiers..." }`

## Revalidation

When `VITE_REVALIDATE_URL` is set in `.env`, the CMS will POST to that URL after saving a published post or page. This triggers ISR cache refresh on the public site so changes appear immediately.

For Next.js sites, set this to: `https://yourdomain.com/admin/api/revalidate`
