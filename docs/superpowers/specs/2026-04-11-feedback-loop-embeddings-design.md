# Feedback Loop + Vector Embeddings — The Learning Engine

**Date:** 2026-04-11
**Status:** Approved
**Phase:** 2 of 4 (Blog CMS roadmap)
**Goal:** Make AI-generated blog posts improve over time by capturing user edits as feedback, embedding them as vectors, and retrieving relevant past corrections during future content generation.

## Problem

The CMS generates blog posts via Claude Code, but each generation starts from scratch. If the user corrects tone, vocabulary, or structure in post #1, post #2 makes the same mistakes. There's no learning loop — the AI has no memory of what the user liked or disliked.

## Solution

Two feedback mechanisms that work together:

1. **Implicit edit tracking** — When the user edits AI-generated content blocks and saves, the CMS diffs the original against the edited version. Changed blocks become feedback entries that get embedded as vectors. At generation time, Claude Code retrieves the most relevant past corrections via semantic search and uses them as few-shot examples.

2. **Explicit preferences** — Persistent text rules (e.g., "never use the word vibrant," "lead with data") stored in a simple table. Loaded into every generation prompt as style directives.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        CMS (PostEditor)                      │
│                                                              │
│  1. User edits blocks inline (already works)                 │
│  2. User clicks Save                                         │
│  3. CMS diffs original_content vs content block-by-block     │
│  4. Changed blocks → INSERT into feedback table              │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                          │
│                                                              │
│  feedback table ──webhook──▶ Edge Function                   │
│                              (generate-feedback-embedding)   │
│                              Uses gte-small (native)         │
│                                        │                     │
│                                        ▼                     │
│                           feedback_embeddings table           │
│                           (pgvector, 384 dimensions)         │
│                                                              │
│  preferences table (simple text rules, no embedding)         │
│                                                              │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Claude Code (Generation Time)                │
│                                                              │
│  1. Query preferences WHERE active = true                    │
│  2. Generate embedding for the topic being written           │
│  3. query_feedback RPC → top 5-10 relevant past corrections  │
│  4. Include both as context in generation prompt             │
│  5. Generate blog post with accumulated style knowledge      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### blog_posts — Add column

```sql
ALTER TABLE blog_posts ADD COLUMN IF NOT EXISTS original_content JSONB DEFAULT NULL;
```

Set once on insert, never updated. `NULL` for posts that predate the feature (no feedback captured for those). When Claude Code inserts a new post, it sets `original_content = content`.

### feedback — Stores edit diffs

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, gen_random_uuid() |
| post_id | UUID | FK → blog_posts.id ON DELETE CASCADE |
| block_index | integer | Which block was edited |
| block_type | text | paragraph, heading, list, etc. |
| original_text | text | What the AI wrote |
| edited_text | text | What the user changed it to |
| context | text | Post title + surrounding blocks for retrieval context |
| created_at | timestamptz | Auto-set |

Index on `post_id` for fast lookups. RLS: authenticated users only.

### feedback_embeddings — Vector store

| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK, generated always as identity |
| feedback_id | UUID | FK → feedback.id ON DELETE CASCADE |
| content | text | The text that was embedded (formatted diff + context) |
| embedding | vector(384) | gte-small output, 384 dimensions |

HNSW index on embedding column (`vector_ip_ops`). RLS: authenticated users only.

### preferences — Global style rules

| Column | Type | Notes |
|--------|------|-------|
| id | UUID | PK, gen_random_uuid() |
| rule | text | The directive text |
| category | text | tone, structure, vocabulary, formatting |
| active | boolean | Default true. Can be toggled off without deleting |
| created_at | timestamptz | Auto-set |

RLS: authenticated users only.

## Feedback Capture Flow

Triggered on every save in PostEditor:

1. PostEditor loads a post → if `original_content` exists, hold it in a ref
2. User edits blocks inline (existing behavior, unchanged)
3. User clicks Save → before the existing save logic, run a diff:
   - For each block index, compare `original_content[i]` to `content[i]`
   - Extract the main text from each block by type:
     - `paragraph`, `heading`, `subheading`: compare `.text`
     - `list`: compare `.items` joined with `\n`
     - `callout`, `info-box`: compare `.text` (or `.content`)
     - `quote`: compare `.text`
     - `process-steps`: compare `.steps` mapped to `title: text` joined with `\n`
     - `table`: compare `JSON.stringify(rows)`
     - `pros-cons`: compare `.pros` + `.cons` joined
     - `stat-cards`, `image`: skip (not text-editable in the current UI)
   - If text changed → create a feedback entry
   - Skip identical blocks
   - Skip blocks that were added or removed (structural changes, not corrections)
4. Batch insert new feedback entries into the `feedback` table
5. Edge Function webhook picks up inserts and generates embeddings async

### What gets embedded

A formatted string with semantic context:

```
Post: "Best Neighborhoods in St. Pete for Families"
Block type: paragraph
Original: "This vibrant Tampa Bay community offers world-class dining and entertainment options that will leave you breathless."
Edited to: "Tampa Bay has solid restaurant options, but the best spots are tucked into specific neighborhoods."
```

This format captures both the topic context and the style correction, so it retrieves well for similar topics.

### Deduplication

On save, only insert feedback for blocks that changed since the last feedback capture for that post+block combination. Compare against the most recent feedback entry for that `(post_id, block_index)` pair — if the `edited_text` matches the current block text, skip it.

## Edge Function: generate-feedback-embedding

**Trigger:** Supabase database webhook on `INSERT` to `feedback` table.

**Logic:**
1. Receive webhook payload (new feedback row)
2. Format embeddable text: `"Post: {context}\nBlock type: {block_type}\nOriginal: {original_text}\nEdited to: {edited_text}"`
3. Run `gte-small` via `new Supabase.ai.Session('gte-small')` — native, no API key
4. Insert into `feedback_embeddings` with the feedback_id, formatted content, and embedding vector

### RPC Function: query_feedback

A Postgres function for vector similarity search:

```sql
CREATE OR REPLACE FUNCTION query_feedback(
  query_embedding vector(384),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10
)
RETURNS TABLE (
  content text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    fe.content,
    1 - (fe.embedding <=> query_embedding) AS similarity
  FROM feedback_embeddings fe
  WHERE 1 - (fe.embedding <=> query_embedding) > match_threshold
  ORDER BY fe.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

Claude Code calls this via Supabase MCP's `execute_sql` or `.rpc()` to retrieve relevant past corrections.

## Preferences UI

**Location:** New section in the existing Settings page (`src/pages/Settings.jsx`), below the "Database Connection" card.

**Components:**
- Card titled "Content Preferences"
- List of existing rules, each showing:
  - Rule text
  - Category badge (tone / structure / vocabulary / formatting)
  - Active/inactive toggle
  - Delete button (trash icon)
- "Add Rule" row at the bottom: text input + category select + add button

**Data flow:** Reads/writes directly to the `preferences` table via Supabase. No localStorage — preferences live in the database so they persist across devices and are queryable by Claude Code at generation time.

## Prompt Template Update

The `prompts/generate-blog-post.md` file gets two new steps at the top:

**Step 1: Load preferences**
```
Query the preferences table for all active rules:
SELECT rule, category FROM preferences WHERE active = true ORDER BY category

Include these as style directives for the post.
```

**Step 2: Load relevant feedback**
```
Generate an embedding for the topic you're about to write about,
then call the query_feedback RPC to find the 5-10 most relevant past corrections.

Use these as few-shot examples:
- "When writing about [context], I originally wrote [original] but the user preferred [edited]"
```

Both queries work via Supabase MCP, which Claude Code already has access to.

## Setup Integration

### Setup SQL (setupSql.js)

Add the new tables, pgvector extension, RPC function, and `original_content` column to the existing `SETUP_SQL` string. Update `REQUIRED_TABLES` to include `feedback`, `feedback_embeddings`, and `preferences`.

### Edge Function Deployment

The Edge Function is not auto-deployed by the setup wizard (it requires `supabase` CLI access). Two approaches for the user:

1. **Docs approach:** Add a section to the README: "Deploy the feedback Edge Function" with `supabase functions deploy generate-feedback-embedding`
2. **Health check:** Add a status indicator in Settings that shows whether the Edge Function is responding. If not deployed, feedback entries will accumulate but won't be embedded until the function is deployed — the system degrades gracefully.

### Existing Posts

Posts created before Phase 2 will have `original_content = NULL`. No feedback is captured for these. This is acceptable — the system starts learning from the next post forward.

## Files to Create

| File | Purpose |
|------|---------|
| `supabase/functions/generate-feedback-embedding/index.ts` | Edge Function for auto-embedding |
| `supabase/migrations/008_feedback_loop.sql` | Migration for all Phase 2 tables |
| `src/lib/feedback.js` | Diff logic + feedback insert utility |

## Files to Modify

| File | Change |
|------|--------|
| `src/lib/setupSql.js` | Add Phase 2 tables, pgvector extension, RPC function, original_content column |
| `src/pages/PostEditor.jsx` | Load original_content, run diff on save, insert feedback |
| `src/pages/Settings.jsx` | Add Content Preferences section |
| `prompts/generate-blog-post.md` | Add feedback retrieval + preferences steps |
| `CLAUDE.md` | Document new tables (feedback, feedback_embeddings, preferences) |
| `README.md` | Add Edge Function deployment instructions |

## What's NOT in This Phase

- No auto-generation UI in the CMS — posts are still generated via Claude Code in the terminal
- No feedback analytics or dashboard — no charts, just the raw capture + retrieval loop
- No public-facing changes — all admin/CMS side
- No changes to existing editor workflow — inline editing is unchanged, feedback capture is invisible (happens on save)
- No WordPress integration (Phase 3)
- No DataForSEO integration (Phase 4)
