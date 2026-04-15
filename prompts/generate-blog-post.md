# Generate Blog Post from YouTube Transcript

## Setup
Before using this prompt, make sure you have:
1. Your YouTube video transcript (download via yt-dlp or copy from YouTube)
2. Your knowledge base set up (see setup-knowledge-base.md)

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

If the feedback Edge Function is deployed and embeddings exist, search for relevant past corrections. This requires generating an embedding for your topic — if you don't have embedding capability, skip this step and rely on the `preferences` rules from Step 1.

**Option A: Query the feedback table directly (no embeddings needed)**

```sql
SELECT original_text, edited_text, block_type, context
FROM feedback
ORDER BY created_at DESC
LIMIT 20;
```

Review recent corrections to understand the user's editing patterns.

**Option B: Semantic search (requires embeddings)**

If the `feedback_embeddings` table has data and you can generate a vector embedding for your topic description:

```sql
SELECT content, similarity
FROM query_feedback(
  '<your_topic_embedding>'::vector,
  0.7,  -- similarity threshold
  10    -- max results
);
```

If you have results, use them as style guidance. Each result shows:
- What the AI originally wrote
- What the user changed it to

Pattern: "When writing about [topic], the user changed [original] to [edited]."

Apply these corrections to similar content in the new post.

## How to Get Your Transcript

**Option A: yt-dlp (recommended)**
```bash
# Install yt-dlp if you haven't
brew install yt-dlp

# Download auto-generated subtitles as text
yt-dlp --write-auto-sub --sub-lang en --skip-download -o "transcript" "https://youtube.com/watch?v=VIDEO_ID"
```

**Option B: Copy from YouTube**
1. Open your video on YouTube
2. Click "..." below the video → "Show transcript"
3. Copy the full transcript text

## The Prompt

Use this with Claude Code (paste in your terminal or use as a prompt file):

```
Write a blog post based on this YouTube transcript.
Use my knowledge base for voice and style reference.
Apply any content preferences and past corrections loaded above.

Requirements:
- 1,500-2,500 words
- SEO-optimized title (50-60 characters)
- Meta description (150-160 characters)
- Include FAQ section (3-5 questions) with schema markup
- Add 2-4 internal links to related content on my site
- Use my authentic voice from the transcript
- Lead with the answer in the first paragraph
- Include specific data points and statistics
- Structure with clear H2/H3 headings
- Output as JSON blocks matching the CMS block format:
  [{"type": "heading", "text": "..."}, {"type": "paragraph", "text": "..."}, ...]

Here's the transcript:
[PASTE TRANSCRIPT]
```

## Block Format Reference

The CMS expects a JSON array of blocks. Here are the supported types:

```json
[
  {"type": "heading", "text": "Your H2 Heading"},
  {"type": "subheading", "text": "Your H3 Subheading"},
  {"type": "paragraph", "text": "Regular paragraph text..."},
  {"type": "list", "items": ["Item 1", "Item 2", "Item 3"]},
  {"type": "callout", "title": "Pro Tip", "text": "Callout text..."},
  {"type": "quote", "text": "Quote text", "attribution": "Source"},
  {"type": "image", "src": "https://...", "alt": "Description", "caption": "Optional caption"},
  {"type": "table", "headers": ["Col 1", "Col 2"], "rows": [["A", "B"], ["C", "D"]]},
  {"type": "pros-cons", "pros": ["Pro 1", "Pro 2"], "cons": ["Con 1", "Con 2"]},
  {"type": "info-box", "content": "Important info here..."},
  {"type": "info-box", "variant": "warning", "content": "Warning text..."},
  {"type": "stat-cards", "cards": [{"number": "95%", "label": "Satisfaction", "sublabel": "2024 survey"}]},
  {"type": "process-steps", "steps": [{"title": "Step 1", "text": "Do this first"}]}
]
```

## Inserting into Supabase

After generating the content, insert a complete blog post with ALL fields populated:

### Step 1: Check for a linked topic

If this post was written from a researched topic in the content pipeline, find it:

```sql
SELECT id, title, primary_keyword, search_volume, keyword_difficulty, cpc, competition_level,
       research_data
FROM blog_topics
WHERE primary_keyword ILIKE '%<keyword>%'
   OR title ILIKE '%<post_title>%'
LIMIT 1;
```

If a topic is found, you'll link the post to it in Step 3.

### Step 2: Insert the blog post

Include ALL fields — do not skip any:

```sql
INSERT INTO blog_posts (
  slug, title, excerpt, content, original_content, status,
  meta_description, keywords, category, tags, author, date,
  read_time, youtube_id, image, sources, ai_reasoning
) VALUES (
  'your-post-slug',
  'Your SEO-Optimized Title (50-60 chars)',
  'A compelling 1-2 sentence excerpt for the post list...',
  '<content_json>'::jsonb,
  '<content_json>'::jsonb,  -- same as content on first insert (used for feedback diffing)
  'draft',
  'Your 150-160 character meta description with primary keyword',
  'primary keyword, secondary keyword 1, secondary keyword 2',
  'Guide',  -- one of: General, How-To, Guide, Review, News, Tips, Case Study, Comparison
  ARRAY['tag1', 'tag2', 'tag3'],
  'Author Name',
  CURRENT_DATE,
  '<N> min read',  -- estimate based on word count / 200
  'dQw4w9WgXcQ',  -- YouTube video ID if post is based on a video (just the ID, not full URL). NULL if not from a video.
  'https://images.pexels.com/...',  -- featured image URL. Search Pexels if needed.
  '[{"url": "https://source1.com", "title": "Source Title", "type": "government", "note": "Used for tax rate data"}]'::jsonb,
  'Explain in 2-4 sentences WHY this post was written: what keyword it targets, the search volume and difficulty, what gap it fills vs competitors, and why it is a good opportunity for this brand.'
) RETURNING id;
```

**Field requirements:**

| Field | Required | Notes |
|-------|----------|-------|
| `slug` | Yes | Lowercase, hyphens, no special chars. Include year if timely. |
| `title` | Yes | 50-60 characters, include primary keyword |
| `excerpt` | Yes | 1-2 sentences, compelling summary for the post card |
| `content` | Yes | JSON array of content blocks (see Block Format Reference) |
| `original_content` | Yes | Set to same value as `content` on first insert |
| `status` | Yes | Always `'draft'` on first insert |
| `meta_description` | Yes | 150-160 characters, include primary keyword naturally |
| `keywords` | Yes | Comma-separated: primary keyword + 3-5 secondary keywords |
| `category` | Yes | One of: General, How-To, Guide, Review, News, Tips, Case Study, Comparison |
| `tags` | Yes | Array of 3-6 relevant tags |
| `author` | Yes | From workspace config or user profile |
| `date` | Yes | CURRENT_DATE or a future date if scheduling |
| `read_time` | Yes | Estimate: word count / 200, format as "N min read" |
| `youtube_id` | If applicable | The 11-character YouTube video ID if this post is based on a video transcript. Extract from the YouTube URL. NULL if not from a video. |
| `image` | Recommended | Featured image URL. Use Pexels API if available (key in Settings). |
| `sources` | Recommended | JSON array of research sources used: `[{"url": "...", "title": "...", "type": "...", "note": "..."}]`. Types: reddit, youtube, government, news, data, mls, local, other |
| `ai_reasoning` | Yes | 2-4 sentences explaining the SEO rationale: target keyword, volume, difficulty, competitor gaps, and why this is a good opportunity. This appears in the SEO Intelligence panel. |

### Step 3: Link to the research topic

If you found a topic in Step 1, link the new post to it:

```sql
-- Get the new post ID from the RETURNING clause above
UPDATE blog_topics
SET blog_post_id = '<new_post_id>', status = 'written'
WHERE id = '<topic_id>';
```

This connection is what powers the SEO Intelligence panel in the CMS — it shows the keyword data, related keywords, People Also Ask questions, SERP features, and content gaps alongside the post.

### Step 4: Verify

After inserting, confirm the post appears in the CMS:

```sql
SELECT id, title, slug, status, category,
       youtube_id IS NOT NULL as has_video,
       sources IS NOT NULL as has_sources,
       ai_reasoning IS NOT NULL as has_reasoning,
       (SELECT COUNT(*) FROM blog_topics WHERE blog_post_id = blog_posts.id) as linked_topics
FROM blog_posts
WHERE slug = '<your-post-slug>';
```

All fields should be populated. The post will appear in the CMS Content feed with a "Draft" badge, ready for review.
