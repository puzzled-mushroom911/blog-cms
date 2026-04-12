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
| blog_post_id | UUID | FK to blog_posts.id (set when blog is written) |
| notes | text | Reviewer notes |
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

## Prompt Block Type

The `prompt` block type is a special instruction block for Claude. It appears in the editor with a violet dashed border and is NOT rendered on the public site. Use it to leave instructions within the content for Claude to process.

- `{ "type": "prompt", "text": "Generate a comparison table of flood insurance costs by zone..." }`

## Revalidation

When `VITE_REVALIDATE_URL` is set in `.env`, the CMS will POST to that URL after saving a published post. This triggers ISR cache refresh on the public site so changes appear immediately.

For Next.js sites, set this to: `https://yourdomain.com/admin/api/revalidate`
