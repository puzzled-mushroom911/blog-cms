# Blog CMS — Claude Code Instructions

## Overview

This is a lightweight CMS for managing AI-generated blog posts. Built with React 19, Vite, Tailwind CSS 4, and Supabase.

- **Directory:** `~/blog-cms/`
- **Supabase project:** Uses the same Supabase instance as the main website
- **Dev server:** `cd ~/blog-cms && npm run dev`

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
| category | text | General, How-To, Guide, Review, News, Tips, Case Study, Comparison |
| tags | text[] | Array of tag strings |
| youtube_id | text | YouTube video ID (nullable) |
| image | text | Featured image URL |
| meta_description | text | SEO meta description |
| keywords | text | SEO keywords |
| content | JSONB | Array of content blocks (paragraph, heading, list, callout, quote, image, table, stat-cards, pros-cons, info-box, process-steps) |
| status | text | draft, needs-review, published |
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
| notes | text | Reviewer notes |
| created_at | timestamptz | Auto-set |
| updated_at | timestamptz | Auto-updated via trigger |

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
    "Angle 1 — why it works for our audience",
    "Angle 2 — differentiation opportunity"
  ],
  "full_brief": "Complete markdown SEO brief including all of the above in readable format"
}
```

## Content Block Types (for blog_posts.content)

When writing blog posts, use these JSONB block types:

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
