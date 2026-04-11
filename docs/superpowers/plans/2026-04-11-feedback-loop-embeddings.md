# Feedback Loop + Vector Embeddings — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a learning engine to the blog CMS that captures user edits as feedback, embeds them as vectors, and retrieves relevant past corrections during future content generation.

**Architecture:** On save, the CMS diffs `original_content` against edited `content` block-by-block. Changed blocks get inserted into a `feedback` table. A Supabase Edge Function auto-generates embeddings via gte-small. A `preferences` table stores explicit style rules. Claude Code queries both at generation time via Supabase MCP.

**Tech Stack:** React 19, Vite 8, Supabase JS v2, pgvector, Supabase Edge Functions (Deno), gte-small embedding model, shadcn/ui, Tailwind CSS 4

---

## File Structure

**New files:**
| File | Responsibility |
|------|---------------|
| `supabase/migrations/008_feedback_loop.sql` | Standalone migration for Phase 2 tables (for users who run migrations manually) |
| `src/lib/feedback.js` | Block diff logic, text extraction by block type, feedback insert utility |
| `supabase/functions/generate-feedback-embedding/index.ts` | Deno Edge Function: webhook → gte-small → insert embedding |

**Modified files:**
| File | Change |
|------|--------|
| `src/lib/setupSql.js` | Add pgvector extension, feedback/feedback_embeddings/preferences tables, original_content column, query_feedback RPC, update REQUIRED_TABLES |
| `src/pages/PostEditor.jsx` | Store original_content in ref on load, call feedback capture on save |
| `src/pages/Settings.jsx` | Add Content Preferences CRUD section |
| `prompts/generate-blog-post.md` | Add feedback retrieval + preferences loading steps |
| `CLAUDE.md` | Document new tables |
| `README.md` | Add Edge Function deployment instructions |

---

### Task 1: Database Migration + Setup SQL

**Files:**
- Create: `supabase/migrations/008_feedback_loop.sql`
- Modify: `src/lib/setupSql.js`

- [ ] **Step 1: Create the standalone migration file**

Create `supabase/migrations/008_feedback_loop.sql`:

```sql
-- =============================================================
-- 008: Feedback Loop + Vector Embeddings (Phase 2)
-- Adds: feedback, feedback_embeddings, preferences tables
-- Adds: original_content column to blog_posts
-- Adds: pgvector extension + HNSW index
-- Adds: query_feedback RPC function
-- Safe to run multiple times (uses IF NOT EXISTS)
-- =============================================================

-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Add original_content to blog_posts
alter table blog_posts add column if not exists original_content jsonb default null;

-- Feedback table — stores edit diffs
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references blog_posts(id) on delete cascade,
  block_index integer not null,
  block_type text not null,
  original_text text not null,
  edited_text text not null,
  context text not null default '',
  created_at timestamptz default now()
);

create index if not exists idx_feedback_post_id on feedback(post_id);

-- Feedback embeddings — vector store
create table if not exists feedback_embeddings (
  id bigint primary key generated always as identity,
  feedback_id uuid references feedback(id) on delete cascade,
  content text not null,
  embedding extensions.vector(384)
);

create index if not exists idx_feedback_embeddings_hnsw
  on feedback_embeddings using hnsw (embedding extensions.vector_ip_ops);

-- Preferences — global style rules
create table if not exists preferences (
  id uuid default gen_random_uuid() primary key,
  rule text not null,
  category text not null default 'tone' check (category in ('tone', 'structure', 'vocabulary', 'formatting')),
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table feedback enable row level security;
alter table feedback_embeddings enable row level security;
alter table preferences enable row level security;

do $$ begin
  drop policy if exists "Auth users full access" on feedback;
  drop policy if exists "Auth users full access" on feedback_embeddings;
  drop policy if exists "Auth users full access" on preferences;
exception when others then null;
end $$;

create policy "Auth users full access" on feedback
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on feedback_embeddings
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on preferences
  for all using (auth.role() = 'authenticated');

-- RPC function for vector similarity search
create or replace function query_feedback(
  query_embedding extensions.vector(384),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fe.content,
    (1 - (fe.embedding <=> query_embedding))::float as similarity
  from feedback_embeddings fe
  where 1 - (fe.embedding <=> query_embedding) > match_threshold
  order by fe.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

- [ ] **Step 2: Update setupSql.js — add Phase 2 SQL to SETUP_SQL**

In `src/lib/setupSql.js`, add the following SQL after the existing RLS policies section (before the closing backtick of the template literal). This is the same SQL as the migration file, appended to the existing setup script:

```js
// Add this SQL to the end of the SETUP_SQL template literal, before the closing backtick:

-- 6. Enable pgvector
create extension if not exists vector with schema extensions;

-- 7. Add original_content to blog_posts
alter table blog_posts add column if not exists original_content jsonb default null;

-- 8. Feedback table
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references blog_posts(id) on delete cascade,
  block_index integer not null,
  block_type text not null,
  original_text text not null,
  edited_text text not null,
  context text not null default '',
  created_at timestamptz default now()
);

create index if not exists idx_feedback_post_id on feedback(post_id);

-- 9. Feedback embeddings (vector store)
create table if not exists feedback_embeddings (
  id bigint primary key generated always as identity,
  feedback_id uuid references feedback(id) on delete cascade,
  content text not null,
  embedding extensions.vector(384)
);

create index if not exists idx_feedback_embeddings_hnsw
  on feedback_embeddings using hnsw (embedding extensions.vector_ip_ops);

-- 10. Preferences
create table if not exists preferences (
  id uuid default gen_random_uuid() primary key,
  rule text not null,
  category text not null default 'tone' check (category in ('tone', 'structure', 'vocabulary', 'formatting')),
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS for new tables
alter table feedback enable row level security;
alter table feedback_embeddings enable row level security;
alter table preferences enable row level security;

do $$ begin
  drop policy if exists "Auth users full access" on feedback;
  drop policy if exists "Auth users full access" on feedback_embeddings;
  drop policy if exists "Auth users full access" on preferences;
exception when others then null;
end $$;

create policy "Auth users full access" on feedback
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on feedback_embeddings
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on preferences
  for all using (auth.role() = 'authenticated');

-- RPC: vector similarity search for feedback
create or replace function query_feedback(
  query_embedding extensions.vector(384),
  match_threshold float default 0.7,
  match_count int default 10
)
returns table (
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fe.content,
    (1 - (fe.embedding <=> query_embedding))::float as similarity
  from feedback_embeddings fe
  where 1 - (fe.embedding <=> query_embedding) > match_threshold
  order by fe.embedding <=> query_embedding
  limit match_count;
end;
$$;
```

- [ ] **Step 3: Update REQUIRED_TABLES in setupSql.js**

Change:
```js
export const REQUIRED_TABLES = ['blog_posts', 'blog_topics', 'seo_pages'];
```

To:
```js
export const REQUIRED_TABLES = ['blog_posts', 'blog_topics', 'seo_pages', 'feedback', 'feedback_embeddings', 'preferences'];
```

- [ ] **Step 4: Verify build**

Run: `npm run build`
Expected: Build succeeds (no code changes yet, just SQL strings and a new .sql file).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/008_feedback_loop.sql src/lib/setupSql.js
git commit -m "feat: Phase 2 database schema — feedback, embeddings, preferences tables"
```

---

### Task 2: Feedback Utility — Block Diffing + Insert

**Files:**
- Create: `src/lib/feedback.js`

- [ ] **Step 1: Create src/lib/feedback.js**

```js
/**
 * Feedback capture utility.
 *
 * Diffs original_content against edited content block-by-block.
 * Extracts text per block type and inserts changed blocks into
 * the feedback table. Deduplicates against existing feedback.
 */

/**
 * Extract the primary text content from a block based on its type.
 * Returns null for block types that aren't text-editable.
 */
export function extractBlockText(block) {
  if (!block) return null;

  switch (block.type) {
    case 'paragraph':
    case 'heading':
    case 'subheading':
      return block.text || '';

    case 'list':
      return (block.items || [])
        .map((item) => (typeof item === 'string' ? item : item.text || ''))
        .join('\n');

    case 'callout':
      return block.text || '';

    case 'info-box':
      return block.content || block.text || '';

    case 'quote':
      return block.text || '';

    case 'process-steps':
      return (block.steps || [])
        .map((step) => `${step.title}: ${step.text}`)
        .join('\n');

    case 'table':
      return JSON.stringify(block.rows || []);

    case 'pros-cons':
      return [
        ...(block.pros || []),
        ...(block.cons || []),
      ].join('\n');

    // Skip non-text blocks
    case 'stat-cards':
    case 'image':
    case 'prompt':
      return null;

    default:
      return null;
  }
}

/**
 * Diff original_content against current content block-by-block.
 * Returns an array of feedback entries (not yet inserted).
 *
 * Only compares blocks at the same index. Blocks that were added
 * or removed (length mismatch) are skipped — those are structural
 * changes, not style corrections.
 */
export function diffBlocks(originalContent, currentContent, postTitle) {
  if (!originalContent || !currentContent) return [];

  const minLength = Math.min(originalContent.length, currentContent.length);
  const entries = [];

  for (let i = 0; i < minLength; i++) {
    const orig = originalContent[i];
    const curr = currentContent[i];

    // Only compare blocks of the same type
    if (orig.type !== curr.type) continue;

    const origText = extractBlockText(orig);
    const currText = extractBlockText(curr);

    // Skip non-text blocks
    if (origText === null || currText === null) continue;

    // Skip identical blocks
    if (origText === currText) continue;

    entries.push({
      block_index: i,
      block_type: orig.type,
      original_text: origText,
      edited_text: currText,
      context: postTitle || '',
    });
  }

  return entries;
}

/**
 * Insert feedback entries into Supabase, deduplicating against
 * existing entries for the same post + block_index.
 *
 * For each entry, checks if the most recent feedback for that
 * (post_id, block_index) already has the same edited_text.
 * If so, skips it (no change since last capture).
 */
export async function captureFeedback(supabase, postId, originalContent, currentContent, postTitle) {
  const entries = diffBlocks(originalContent, currentContent, postTitle);
  if (entries.length === 0) return [];

  // Fetch existing feedback for this post to deduplicate
  const { data: existing } = await supabase
    .from('feedback')
    .select('block_index, edited_text, created_at')
    .eq('post_id', postId)
    .order('created_at', { ascending: false });

  // Build a map of most recent edited_text per block_index
  const latestByBlock = {};
  for (const row of (existing || [])) {
    if (!(row.block_index in latestByBlock)) {
      latestByBlock[row.block_index] = row.edited_text;
    }
  }

  // Filter out entries where the edited_text hasn't changed since last capture
  const newEntries = entries.filter((entry) => {
    const lastEdited = latestByBlock[entry.block_index];
    return lastEdited !== entry.edited_text;
  });

  if (newEntries.length === 0) return [];

  // Batch insert
  const rows = newEntries.map((entry) => ({
    post_id: postId,
    ...entry,
  }));

  const { data, error } = await supabase
    .from('feedback')
    .insert(rows)
    .select('id');

  if (error) {
    console.warn('Feedback capture failed:', error.message);
    return [];
  }

  return data || [];
}
```

- [ ] **Step 2: Verify build**

Run: `npm run build`
Expected: Build succeeds. The module is importable but not yet used.

- [ ] **Step 3: Commit**

```bash
git add src/lib/feedback.js
git commit -m "feat: feedback utility — block diffing and deduplication"
```

---

### Task 3: PostEditor Integration — Capture Feedback on Save

**Files:**
- Modify: `src/pages/PostEditor.jsx`

- [ ] **Step 1: Add import and ref for original content**

At the top of `src/pages/PostEditor.jsx`, add the import:

```js
import { captureFeedback } from '../lib/feedback';
```

Inside the `PostEditor` component, after the existing state declarations (after `const [editorNotes, setEditorNotes] = useState([]);`), add:

```js
const [originalContent, setOriginalContent] = useState(null);
```

- [ ] **Step 2: Store original_content when post loads**

In the `loadPost` function, after `setPost(data);` and before `setEditorNotes(...)`, add:

```js
    // Store the AI's original content for feedback diffing
    if (data.original_content) {
      setOriginalContent(data.original_content);
    }
```

- [ ] **Step 3: Add feedback capture to handleSave**

In the `handleSave` function, after the `setSaving(false);` line and inside the success branch (where `if (error)` is NOT true), add feedback capture. The success branch currently starts with `// Trigger site rebuild when a post is published`. Add feedback capture before that comment:

```js
      // Capture feedback from edits (async, non-blocking)
      if (originalContent) {
        captureFeedback(supabase, post.id, originalContent, post.content, post.title)
          .catch(() => {}); // Best-effort — don't block save
      }
```

- [ ] **Step 4: Add feedback capture to handlePublish**

In the `handlePublish` function, after `setPost(prev => ({ ...prev, status: 'published' }));` and before `triggerDeploy();`, add:

```js
      // Capture feedback from edits (async, non-blocking)
      if (originalContent) {
        captureFeedback(supabase, post.id, originalContent, post.content, post.title)
          .catch(() => {}); // Best-effort — don't block publish
      }
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Manual test**

Run: `npm run dev`

1. Open a post that has `original_content` set (or use the Supabase SQL editor to manually set `original_content = content` on an existing post)
2. Edit a paragraph block's text
3. Click Save
4. Check the `feedback` table in Supabase — a new row should appear with the original and edited text
5. Click Save again without changing anything — no duplicate row should be inserted

- [ ] **Step 7: Commit**

```bash
git add src/pages/PostEditor.jsx
git commit -m "feat: capture feedback on save — diff original_content vs edits"
```

---

### Task 4: Edge Function — Auto-Generate Embeddings

**Files:**
- Create: `supabase/functions/generate-feedback-embedding/index.ts`

- [ ] **Step 1: Create the Edge Function directory and file**

Create `supabase/functions/generate-feedback-embedding/index.ts`:

```ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const model = new Supabase.ai.Session('gte-small')

interface WebhookPayload {
  type: 'INSERT'
  table: string
  record: {
    id: string
    block_type: string
    original_text: string
    edited_text: string
    context: string
  }
}

Deno.serve(async (req) => {
  const payload: WebhookPayload = await req.json()
  const { id, block_type, original_text, edited_text, context } = payload.record

  // Format the text for embedding — includes topic context + the correction
  const content = [
    context ? `Post: ${context}` : '',
    `Block type: ${block_type}`,
    `Original: ${original_text}`,
    `Edited to: ${edited_text}`,
  ].filter(Boolean).join('\n')

  // Generate embedding using gte-small (runs natively, no API key)
  const embedding = await model.run(content, {
    mean_pool: true,
    normalize: true,
  })

  // Store in feedback_embeddings
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const { error } = await supabase
    .from('feedback_embeddings')
    .insert({
      feedback_id: id,
      content,
      embedding: JSON.stringify(embedding),
    })

  if (error) {
    console.error('Failed to store embedding:', error.message)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 })
})
```

- [ ] **Step 2: Commit**

Note: This function is deployed by the user separately via `supabase functions deploy`. It's not part of the CMS build.

```bash
git add supabase/functions/generate-feedback-embedding/index.ts
git commit -m "feat: Edge Function for auto-generating feedback embeddings"
```

---

### Task 5: Preferences UI — Settings Page

**Files:**
- Modify: `src/pages/Settings.jsx`

- [ ] **Step 1: Add imports and state**

At the top of `src/pages/Settings.jsx`, add to the existing imports:

```js
import { useState, useEffect } from 'react';
```

(Replace the existing `import { useState } from 'react';`)

Add new imports:

```js
import { useSupabase } from '../hooks/useSupabase';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, BookOpen, Power, PowerOff } from 'lucide-react';
```

Add to the existing lucide import (merge with the existing `Save, RotateCcw, Database, Unplug` import — add `Trash2, Plus, BookOpen, Power, PowerOff`).

- [ ] **Step 2: Add preferences state and data loading**

Inside the `Settings` component, after the existing `const connection = getStoredConnection();` line, add:

```js
  const supabase = useSupabase();
  const [preferences, setPreferences] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState('tone');
  const [addingRule, setAddingRule] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoadingPrefs(true);
    const { data } = await supabase
      .from('preferences')
      .select('*')
      .order('created_at', { ascending: true });
    setPreferences(data || []);
    setLoadingPrefs(false);
  }

  async function handleAddRule() {
    const trimmed = newRule.trim();
    if (!trimmed) return;
    setAddingRule(true);
    const { data, error } = await supabase
      .from('preferences')
      .insert({ rule: trimmed, category: newCategory })
      .select()
      .single();
    setAddingRule(false);
    if (error) {
      toast.error('Failed to add rule: ' + error.message);
    } else {
      setPreferences((prev) => [...prev, data]);
      setNewRule('');
      toast.success('Rule added');
    }
  }

  async function handleToggleRule(id, currentActive) {
    const { error } = await supabase
      .from('preferences')
      .update({ active: !currentActive })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update rule');
    } else {
      setPreferences((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
      );
    }
  }

  async function handleDeleteRule(id) {
    const { error } = await supabase
      .from('preferences')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete rule');
    } else {
      setPreferences((prev) => prev.filter((p) => p.id !== id));
      toast.success('Rule deleted');
    }
  }
```

- [ ] **Step 3: Add the Content Preferences card to the JSX**

In the return JSX, after the closing `</div>` of the "Database Connection" card (the one with the `<Database>` icon, ending around `</div>` before the brand settings card), add:

```jsx
      {/* Content Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-violet-600" />
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Content Preferences</h2>
            <p className="text-xs text-slate-500">Style rules for AI-generated content. Loaded into every generation prompt.</p>
          </div>
        </div>

        {loadingPrefs ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading preferences...
          </div>
        ) : (
          <>
            {/* Existing rules */}
            {preferences.length > 0 ? (
              <div className="space-y-2 mb-4">
                {preferences.map((pref) => (
                  <div
                    key={pref.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      pref.active
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${pref.active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        {pref.rule}
                      </p>
                      <Badge variant="secondary" className="mt-1.5 text-[10px]">
                        {pref.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleToggleRule(pref.id, pref.active)}
                        title={pref.active ? 'Disable rule' : 'Enable rule'}
                      >
                        {pref.active ? (
                          <Power className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <PowerOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteRule(pref.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                No rules yet. Add rules like &quot;Never use the word vibrant&quot; or &quot;Lead with data, not adjectives.&quot;
              </p>
            )}

            {/* Add new rule */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRule.trim()) handleAddRule();
                  }}
                  placeholder="e.g. Never use the word vibrant"
                />
              </div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-9 px-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="tone">Tone</option>
                <option value="structure">Structure</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="formatting">Formatting</option>
              </select>
              <Button
                size="sm"
                onClick={handleAddRule}
                disabled={!newRule.trim() || addingRule}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </>
        )}
      </div>
```

- [ ] **Step 4: Add Loader2 to the lucide import if not already present**

Check the existing lucide import. It currently imports `Save, RotateCcw, Database, Unplug`. Update it to:

```js
import { Save, RotateCcw, Database, Unplug, Trash2, Plus, BookOpen, Power, PowerOff, Loader2 } from 'lucide-react';
```

- [ ] **Step 5: Verify build**

Run: `npm run build`
Expected: Build succeeds.

- [ ] **Step 6: Manual test**

Run: `npm run dev`

1. Go to Settings page
2. The "Content Preferences" card should appear below the Database Connection card
3. Add a rule: "Never use the word vibrant" with category "vocabulary"
4. The rule appears in the list with a badge
5. Toggle the rule off — it grays out with strikethrough
6. Toggle it back on
7. Delete the rule
8. Check the `preferences` table in Supabase — it should reflect all actions

- [ ] **Step 7: Commit**

```bash
git add src/pages/Settings.jsx
git commit -m "feat: Content Preferences UI — add, toggle, delete style rules"
```

---

### Task 6: Update Prompt Template

**Files:**
- Modify: `prompts/generate-blog-post.md`

- [ ] **Step 1: Add feedback and preferences steps to the prompt**

At the top of `prompts/generate-blog-post.md`, after the `## Setup` section (before `## How to Get Your Transcript`), add a new section:

```markdown
## Voice & Style Context (if available)

Before writing, load your accumulated style knowledge from the CMS database. Skip this section if you don't have Supabase MCP access or haven't set up the feedback system yet.

### Step 1: Load your content preferences

Query your active style rules:
```sql
SELECT rule, category FROM preferences WHERE active = true ORDER BY category;
```

If results are returned, treat them as binding style directives for this post. Group by category:
- **tone** rules govern voice and register
- **structure** rules govern content organization
- **vocabulary** rules govern word choice (e.g. banned words)
- **formatting** rules govern block types and layout

### Step 2: Load relevant past corrections

Generate a brief description of the topic you're about to write (1-2 sentences), then search for relevant feedback:

```sql
SELECT content, similarity
FROM query_feedback(
  (SELECT embedding FROM ... ), -- your topic description embedded
  0.7,  -- similarity threshold
  10    -- max results
);
```

If you have results, use them as style guidance. Each result shows:
- What the AI originally wrote
- What the user changed it to

Pattern: "When writing about [topic], the user changed [original] to [edited]."

Apply these corrections to similar content in the new post.
```

- [ ] **Step 2: Update the main prompt section**

In the `## The Prompt` section, update the prompt text to reference the style context. Add this line after `Use my knowledge base for voice and style reference.`:

```
Apply any content preferences and past corrections loaded above.
```

- [ ] **Step 3: Commit**

```bash
git add prompts/generate-blog-post.md
git commit -m "feat: update blog prompt template with feedback retrieval steps"
```

---

### Task 7: Documentation Updates

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

- [ ] **Step 1: Update CLAUDE.md with new tables**

In `CLAUDE.md`, after the existing `### `blog_topics`` table documentation, add:

```markdown
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
```

- [ ] **Step 2: Update CLAUDE.md with feedback workflow**

After the existing `### Checking for changes` section, add:

```markdown
### Feedback loop — learning from user edits

When the user edits a blog post in the CMS and saves, the system automatically:
1. Diffs `original_content` against the current `content` block-by-block
2. Inserts changed blocks into the `feedback` table
3. An Edge Function generates vector embeddings for each feedback entry

When generating new blog posts, query `preferences` for active style rules and use `query_feedback` RPC for relevant past corrections. See `prompts/generate-blog-post.md` for the full workflow.
```

- [ ] **Step 3: Update README.md with Edge Function deployment**

In `README.md`, after the `### 7. Start the dev server` section, add:

```markdown
### 8. Deploy the feedback Edge Function (optional)

The feedback system captures your edits to learn your writing style over time. The Edge Function generates vector embeddings automatically.

```bash
# Install the Supabase CLI if you haven't
npm install -g supabase

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy generate-feedback-embedding

# Create a database webhook to trigger the function
# In Supabase Dashboard → Database → Webhooks → Create new
# Table: feedback
# Events: INSERT
# Function: generate-feedback-embedding
```

**Note:** The CMS works without this step. Feedback entries will be stored but won't have embeddings until the function is deployed. You can deploy it at any time.
```

- [ ] **Step 4: Update the migration table in README.md**

In the migration table in the Setup section, add a row:

```
| `008_feedback_loop.sql` | Feedback system + vector embeddings |
```

- [ ] **Step 5: Commit**

```bash
git add CLAUDE.md README.md
git commit -m "docs: document Phase 2 feedback tables, preferences, and Edge Function setup"
```

---

### Task 8: Final Verification

**Files:**
- All files — final review pass

- [ ] **Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no warnings about missing imports.

- [ ] **Step 2: Start dev server and test end-to-end**

Run: `npm run dev`

Test checklist:
- [ ] Settings page loads, Content Preferences card is visible
- [ ] Can add a preference rule with a category
- [ ] Can toggle a rule on/off
- [ ] Can delete a rule
- [ ] Open a blog post in the editor
- [ ] Edit a text block, click Save
- [ ] Check `feedback` table in Supabase — new row with original + edited text
- [ ] Save again without changes — no duplicate feedback row
- [ ] Setup page still works (check tables includes new tables)

- [ ] **Step 3: Commit any fixes**

```bash
git add -A && git commit -m "fix: Phase 2 polish — fix any remaining issues"
```

---

## Self-Review Checklist

1. **Spec coverage:**
   - Database schema (feedback, feedback_embeddings, preferences, original_content column) → Task 1
   - Feedback capture flow (diff on save, deduplication) → Task 2 + Task 3
   - Edge Function (gte-small embedding generation) → Task 4
   - RPC function (query_feedback) → Task 1 (in migration SQL)
   - Preferences UI → Task 5
   - Prompt template update → Task 6
   - Setup integration (setupSql.js update) → Task 1
   - Documentation (CLAUDE.md, README.md) → Task 7
   - All spec sections covered.

2. **Placeholder scan:** No TBD/TODO items. All code is complete.

3. **Type consistency:**
   - `extractBlockText()` and `diffBlocks()` in Task 2 match the block type list from the spec
   - `captureFeedback()` parameter order is consistent between Task 2 (definition) and Task 3 (usage)
   - `preferences` table columns match between Task 1 (SQL) and Task 5 (UI reads/writes)
   - `feedback` table columns match between Task 1 (SQL), Task 2 (insert), and Task 4 (webhook payload)
