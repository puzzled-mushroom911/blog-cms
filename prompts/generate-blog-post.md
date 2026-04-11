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

After Claude generates the JSON, you can insert it directly:

```sql
insert into blog_posts (slug, title, excerpt, content, status, meta_description, category, author)
values (
  'your-post-slug',
  'Your Post Title',
  'A brief excerpt...',
  '[{"type": "paragraph", "text": "..."}]'::jsonb,
  'draft',
  'Your meta description here',
  'General',
  'Your Name'
);
```

Or use the Supabase dashboard Table Editor to paste the JSON into the `content` column.
