/**
 * Shared MCP prompt definitions for both servers (stdio + HTTP).
 * Prompts appear in clients via prompts/list and guide users through workflows.
 */

// ── Prompt content ─────────────────────────────────────────────

const GETTING_STARTED = `# Getting Started with the Blog CMS

Welcome to the Blog CMS — a lightweight, AI-powered content management system built on Supabase. It gives you CRUD tools for blog posts and SEO pages, a topic research pipeline, SEO intelligence, and a style preference system that learns from your edits over time.

## What This CMS Does

- **Write blog posts** from YouTube transcripts (or from scratch) using structured content blocks
- **Research topics** with keyword data, SERP analysis, and competitive intelligence
- **Manage a content pipeline** — topics flow from idea -> researched -> approved -> writing -> written (advanced feature, toggled on in Settings)
- **Learn your voice** — the feedback loop captures your edits and applies them to future posts
- **Publish to your Supabase-powered site** — published posts are read directly from the DB by your public site (or via REST API)

## CMS Navigation

The CMS has 5 sidebar items:

- **Content** (/) — Unified feed of blog posts and SEO pages. Filter by status (Draft, In Review, Scheduled, Published) and type (Blog, SEO Page). Create new posts with the "+ New Post" button.
- **Calendar** (/calendar) — Monthly calendar view of scheduled content with quick-approve buttons on draft/review items.
- **Analytics** (/analytics) — Keyword opportunity maps, pipeline funnel, difficulty distribution, publishing velocity, top opportunities table.
- **Docs** (/docs) — In-app documentation: Getting Started, Prompts & Workflows, Database Setup, Feedback Loop, Connect Website, Customization, API Reference.
- **Settings** (/settings) — Database connection, content preferences, API keys, Content Pipeline toggle, site configuration.

**Content Pipeline** (/topics) — available when toggled on in Settings. Advanced topic research and keyword management with statuses: idea -> researched -> approved -> writing -> written.

### Post Editor Sidebar

Two tabs when editing a post:
- **Metadata** — title, slug, excerpt, category, tags, author, date, featured image, YouTube ID, keywords, meta description, sources, ai_reasoning
- **SEO** — AI reasoning display, keyword data (volume, difficulty, CPC), related keywords, People Also Ask, SERP features, content gaps (pulled from linked blog_topic)

## Three Ways to Use the CMS

### Workflow 1: Manual — "Write me a blog about X"

1. User tells Claude what to write
2. Claude generates the post content
3. Claude calls \`create_post\` with ALL fields:
   - title, slug, excerpt, content, meta_description, keywords, category, tags, author
   - youtube_id (if from a video), image (featured image URL)
   - sources (array of research sources used)
   - ai_reasoning (why this topic, target keyword, volume, difficulty, competitor gaps)
   - status: "draft"
4. Post appears in the **Content** feed as a Draft
5. User reviews, edits, and publishes from the CMS or Calendar

### Workflow 2: Collaborative — "What should we write about?"

1. Claude researches keywords using DataForSEO tools
2. Claude saves promising topics using \`create_topic\` with keyword data, research_data, and status "researched"
3. User reviews topics in the Content Pipeline (toggle on in Settings) and approves winners
4. Claude writes the approved topics, calling \`create_post\` with all fields (see Workflow 1 step 3)
5. After creating each post, Claude calls \`update_topic\` to set \`blog_post_id\` to the new post's ID, linking them together
6. User reviews posts in Content feed or Calendar and publishes

### Workflow 3: Automated — Hands-off content generation

1. Claude runs on a schedule (daily/weekly)
2. Claude researches and picks the best topics based on brand/market fit
3. Claude writes posts and saves them via \`create_post\` with all fields and status "draft"
4. Claude links posts to topics via \`update_topic\` with \`blog_post_id\`
5. Posts appear as Drafts — user just reviews and approves in the Content feed or Calendar (quick-approve buttons)

## Quick Start: Create Your First Blog Post

### 1. Check your workspace

Run the \`get_workspace_info\` tool to confirm your workspace is connected and see your current post/topic counts.

### 2. Set up your writing preferences

Use \`create_preference\` to add style rules that apply to all generated content. Categories:
- **tone** — voice and register (e.g., "Write in a direct, conversational tone")
- **structure** — content organization (e.g., "Lead with the answer in the first paragraph")
- **vocabulary** — word choice (e.g., "Never use the word 'utilize'")
- **formatting** — block types and layout (e.g., "Include a pros-cons block for comparison posts")

Use \`list_preferences\` to review your active rules at any time.

### 3. Create a blog post

Use \`create_post\` with all available fields. The content field takes an array of content blocks:

\`\`\`json
[
  {"type": "heading", "text": "Your H2 Heading"},
  {"type": "paragraph", "text": "Your paragraph text..."},
  {"type": "list", "items": ["Item 1", "Item 2"]},
  {"type": "callout", "title": "Pro Tip", "text": "Helpful advice..."}
]
\`\`\`

Supported block types: paragraph, heading, subheading, list, process-steps, callout, quote, info-box, image, table, stat-cards, pros-cons.

**Always include these fields when creating a post:** title, slug, excerpt, content, meta_description, keywords, category, tags, author, youtube_id (if applicable), image, sources, ai_reasoning, status.

The \`ai_reasoning\` field should explain: target keyword, search volume, keyword difficulty, competitor gaps, and why this topic is a good opportunity.

The \`sources\` field is an array of \`{url, title, type, note}\` objects documenting research sources used.

Posts start as "draft". When ready, use \`publish_post\` to go live.

### 4. Research topics for your pipeline

Use \`create_topic\` to save keyword research. Include primary_keyword, search_volume, keyword_difficulty, and research_data for a complete brief. Topics start as "researched" — approve them in the CMS when ready to write.

**Important:** After writing a blog post from a topic, always call \`update_topic\` with \`blog_post_id\` set to the new post's ID. This links the topic to its post and enables the SEO Intelligence panel in the editor.

### 5. Set up your knowledge base

For voice-matched content, set up a knowledge base with your YouTube transcripts and writing samples. See the \`setup-knowledge-base\` prompt for the full walkthrough.

## Available Prompts

Use these prompts for guided workflows:
- **generate-blog-post** — Turn a YouTube transcript into a full blog post
- **research-topic** — Research a keyword with DataForSEO and save to the pipeline
- **seo-review** — Pre-publish SEO quality check
- **setup-knowledge-base** — Set up your voice/style knowledge base
- **build-public-website** — Scaffold the reader-facing website

## Available Tools

**Posts:** list_posts, get_post, create_post, update_post, publish_post, delete_post
**Topics:** list_topics, get_topic, create_topic, update_topic
**Preferences:** list_preferences, create_preference
**Workspace:** get_workspace_info`;


const GENERATE_BLOG_POST = `# Generate Blog Post from YouTube Transcript

## Setup
Before using this prompt, make sure you have:
1. Your YouTube video transcript (download via yt-dlp or copy from YouTube)
2. Your knowledge base set up (see setup-knowledge-base prompt)

## Voice & Style Context (if available)

Before writing, load your accumulated style knowledge from the CMS database. Skip this section if you haven't set up the feedback system yet.

### Step 1: Load your content preferences

Query your active style rules using the list_preferences tool.

If results are returned, treat them as binding style directives for this post. Group by category:
- **tone** rules govern voice and register
- **structure** rules govern content organization
- **vocabulary** rules govern word choice (e.g. banned words)
- **formatting** rules govern block types and layout

### Step 2: Load relevant past corrections

If the feedback Edge Function is deployed and embeddings exist, search for relevant past corrections. This requires generating an embedding for your topic. If you don't have embedding capability, skip this step and rely on the preferences from Step 1.

**Option A: Query the feedback table directly (no embeddings needed)**

\`\`\`sql
SELECT original_text, edited_text, block_type, context
FROM feedback
ORDER BY created_at DESC
LIMIT 20;
\`\`\`

Review recent corrections to understand the user's editing patterns.

**Option B: Semantic search (requires embeddings)**

If the feedback_embeddings table has data and you can generate a vector embedding for your topic description:

\`\`\`sql
SELECT content, similarity
FROM query_feedback(
  '<your_topic_embedding>'::vector,
  0.7,  -- similarity threshold
  10    -- max results
);
\`\`\`

If you have results, use them as style guidance. Each result shows what the AI originally wrote and what the user changed it to.

## How to Get Your Transcript

**Option A: yt-dlp (recommended)**
\`\`\`bash
brew install yt-dlp
yt-dlp --write-auto-sub --sub-lang en --skip-download -o "transcript" "https://youtube.com/watch?v=VIDEO_ID"
\`\`\`

**Option B: Copy from YouTube**
1. Open your video on YouTube
2. Click "..." below the video -> "Show transcript"
3. Copy the full transcript text

## The Prompt

\`\`\`
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
\`\`\`

## Block Format Reference

The CMS expects a JSON array of blocks. Supported types:

\`\`\`json
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
  {"type": "stat-cards", "cards": [{"number": "95%", "label": "Satisfaction", "sublabel": "2024 survey"}]},
  {"type": "process-steps", "steps": [{"title": "Step 1", "text": "Do this first"}]}
]
\`\`\`

## Saving to the CMS

After generating the content blocks, use the \`create_post\` tool to save the post with ALL fields:

- **title** — SEO-optimized title (50-60 characters)
- **slug** — URL-friendly slug derived from the title
- **excerpt** — 1-2 sentence summary for post cards and social sharing
- **content** — the JSON array of content blocks
- **meta_description** — SEO meta description (150-160 characters)
- **keywords** — primary and secondary keywords, comma-separated
- **category** — one of: General, How-To, Guide, Review, News, Tips, Case Study, Comparison
- **tags** — array of relevant tags
- **author** — author name
- **youtube_id** — the YouTube video ID if this post was generated from a transcript
- **image** — featured image URL
- **sources** — array of \`{url, title, type, note}\` objects documenting research sources (types: reddit, youtube, government, news, data, mls, local, other)
- **ai_reasoning** — explain how you researched and structured the content: target keyword, search volume, keyword difficulty, competitor gaps identified, and why this topic is a good SEO opportunity
- **status** — set to "draft" for review

## Linking to Topics

After creating the post, check if there is a matching topic in the pipeline (\`blog_topics\` table) for this keyword or title. If a matching topic exists:
1. Use \`update_topic\` to set \`blog_post_id\` to the new post's ID
2. Set the topic status to "written"

This links the topic to the post, enabling the SEO Intelligence panel in the editor sidebar (keyword data, related keywords, People Also Ask, SERP features, content gaps)`;


const RESEARCH_TOPIC = `# Research a Blog Topic with DataForSEO

Research a keyword, pull competitive intelligence, and save the results to the blog_topics table — ready for review and approval in the CMS.

## Quick Start

\`\`\`
Research the keyword "moving to st pete florida" for the blog CMS.
\`\`\`

Or with an optional working title:

\`\`\`
Research the keyword "cost of living in st petersburg fl" with the working title
"The Real Cost of Living in St. Petersburg, FL (2026 Breakdown)".
\`\`\`

## Prerequisites

- **DataForSEO MCP** must be configured in your environment. All mcp__dataforseo__* tools must be available.
- **Supabase MCP** or the CMS MCP tools must be available for saving results.

## Step 1: Accept Input

Collect from the user:
- **Primary keyword** (required) — The exact keyword to research
- **Working title** (optional) — If not provided, generate one after research

## Step 2: Run DataForSEO Research

### 2a. Keyword Search Volume & CPC
Call kw_data_google_ads_search_volume with the keyword. Extract: search_volume, cpc, competition index, competition_level, monthly_searches.

### 2b. Keyword Difficulty
Call dataforseo_labs_bulk_keyword_difficulty. Extract: keyword_difficulty (0-100 score).

### 2c. Related Keywords
Call dataforseo_labs_google_keyword_ideas. Filter to keywords with search_volume > 50, keep top 20.

### 2d. SERP Analysis
Call serp_organic_live_advanced. Extract: top 10 organic results, SERP features, People Also Ask questions.

### 2e. SERP Competitors
Call dataforseo_labs_google_serp_competitors. Extract: domain, avg_position, estimated_traffic, relevant_keywords.

### 2f. AI Search Volume (Optional)
Call ai_optimization_keyword_data_search_volume if available. Extract: ai_search_volume, mentions of your domain, top mentioned domains.

## Step 3: Analyze and Synthesize

Generate:
- **content_gaps** — 3-5 gaps in what top results cover
- **suggested_angles** — 3-5 angles for differentiation
- **full_brief** — Complete markdown SEO brief with target keyword, search intent, SERP landscape, PAA questions, competitor gaps, recommended structure, differentiation strategy, and internal linking opportunities

## Step 4: Save to CMS

Use create_topic to save the research with all typed columns populated:
- title, primary_keyword, secondary_keywords, search_volume, keyword_difficulty, cpc, competition_level
- research_data as the full JSONB payload
- status: "researched"

## Step 5: Report Results

Print a summary showing: keyword, volume, difficulty, CPC, competition, secondary keyword count, SERP features, PAA count, competitor count, and status.

## Error Handling

- If a DataForSEO tool fails, log the error and continue with remaining tools
- If the CMS is unavailable, output the complete research_data JSON so the user can manually insert it
- If zero search volume, still save (keyword may be emerging). Add a note about it.`;


const SEO_REVIEW = `# SEO Review

Use this to review a blog post before changing its status to "published" in the CMS.

## The Prompt

\`\`\`
Review this blog post for SEO quality. Check:

- Title length (50-60 chars)
- Meta description (150-160 chars)
- Heading structure (one H1, logical H2/H3 hierarchy)
- Internal links (at least 2-4 to related content)
- Image alt text (descriptive, keyword-relevant)
- FAQ section for featured snippet potential
- Schema markup recommendations
- Keyword density (natural, not stuffed)
- Content freshness (are dates and data current?)
- Answer-first formatting (lead with the key takeaway)
- Readability (short paragraphs, scannable structure)

Provide:
1. A score out of 10
2. What's working well
3. Specific fixes needed (with examples)
4. Quick wins for improvement

Blog post content:
[PASTE OR REFERENCE POST]
\`\`\`

## Quick SEO Checklist

Before publishing any post, verify:

- [ ] Title is 50-60 characters
- [ ] Meta description is 150-160 characters
- [ ] Slug is clean and keyword-rich (no dates or filler words)
- [ ] Featured image has a descriptive filename and alt text
- [ ] At least 2 internal links to other posts on your site
- [ ] At least 1 external link to a credible source
- [ ] FAQ section with 3-5 questions (helps win featured snippets)
- [ ] Content leads with the answer (not a long preamble)
- [ ] All data and statistics are current
- [ ] Read time is accurate

## Using with the CMS

1. Use get_post to fetch the post by ID or slug
2. Review the title, meta_description, and content blocks
3. Run this SEO review prompt against the content
4. Use update_post to apply fixes
5. Use publish_post when the review passes`;


const SETUP_KNOWLEDGE_BASE = `# Setting Up Your Knowledge Base

Your knowledge base is what makes AI-generated content sound like YOU, not a robot. It gives Claude context about your voice, expertise, and the topics you cover.

## Step 1: Gather Your Content Sources

Collect anything that captures your authentic voice:
- YouTube video transcripts (your best source of natural voice)
- Email templates and client communications
- Voice notes and brainstorming recordings (transcribe them first)
- Previous blog posts or articles you've written
- Social media posts in your voice

## Step 2: Create a Knowledge Base Folder

\`\`\`bash
mkdir -p ~/knowledge_bases/your_content
\`\`\`

## Step 3: Add Your Transcripts

Drop your transcript files into the folder. The more content Claude has to reference, the better it can match your voice.

**Downloading YouTube transcripts in bulk:**
\`\`\`bash
yt-dlp --write-auto-sub --sub-lang en --skip-download \\
  -o "~/knowledge_bases/your_content/%(title)s" \\
  "https://youtube.com/@yourchannel" \\
  --playlist-end 10
\`\`\`

**Tip:** Name files descriptively so you can reference specific topics:
\`\`\`
~/knowledge_bases/your_content/
  how-to-buy-first-home.txt
  neighborhood-guide-downtown.txt
  market-update-q1-2026.txt
  client-faq-responses.txt
\`\`\`

## Step 4: Configure Claude Code

Add this to your project's CLAUDE.md file (or your global ~/.claude/CLAUDE.md):

\`\`\`markdown
# Content Sources
- Knowledge base: ~/knowledge_bases/your_content/
- YouTube channel: [YOUR CHANNEL URL]
- Brand voice: [DESCRIBE YOUR VOICE]
  Examples: "direct and conversational", "professional but warm",
  "data-driven with personal anecdotes", "casual and relatable"
\`\`\`

Now when you tell Claude to "use my knowledge base" or "match my voice," it knows where to look.

## Step 5: Test It

Try generating a short paragraph to verify the voice match:

\`\`\`
Read my transcripts in ~/knowledge_bases/your_content/ and write
a 100-word paragraph about [YOUR TOPIC] in my voice. Match my
speaking style, not generic AI writing.
\`\`\`

Compare the output to your actual content. If it's close, you're set. If not, add more transcript examples.

## Step 6: Set CMS Preferences

Use the create_preference tool to codify your voice rules:
- Tone preferences (e.g., "direct and conversational")
- Structure preferences (e.g., "lead with the answer")
- Vocabulary rules (e.g., "never say utilize")
- Formatting rules (e.g., "include callout blocks for pro tips")

These preferences are applied automatically when generating blog posts.

## Advanced: Vector Database (Optional)

For larger knowledge bases with semantic search:

1. Install ChromaDB: \`pip install chromadb sentence-transformers\`
2. Create an import script that chunks your transcripts and stores them as embeddings
3. Claude can then search by meaning, not just keywords

This is optional. For most creators, the simple folder approach works great.`;


const BUILD_PUBLIC_WEBSITE = `# Build Public Blog Website

Build a neighborhood blog website that reads published content from a Supabase-powered CMS.

## What to Build

A public-facing blog website for a neighborhood/city — the kind a real estate agent or local business would use to attract relocation buyers. This site reads from the same Supabase database as the blog CMS.

The CMS is the admin tool where content gets created and approved. This website is the public reader that displays the published content.

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4
- @supabase/supabase-js for data fetching
- react-router-dom v7 for routing
- framer-motion for subtle animations
- lucide-react for icons
- No SSR — client-side SPA deployed to Vercel

## Pages to Build

1. **Home** — Hero section with neighborhood name + tagline, featured/latest posts grid (3-6 cards), categories section, CTA to browse all posts
2. **Blog Index** (/blog) — Filterable grid of all published posts. Filter by category. Search by title. Card shows: featured image, category badge, title, excerpt, date, read time
3. **Blog Post** (/blog/:slug) — Full article page that renders the JSONB content blocks. Sidebar with: author, date, read time, category, tags, table of contents (auto-generated from heading blocks), related posts
4. **Category Page** (/blog/category/:category) — Filtered blog index showing posts in one category
5. **About** — Placeholder page with editable content area
6. **Contact** (/contact) — Agent name, phone, email, embedded booking calendar, Google Maps embed of service area
7. **404** — Styled not-found page

## Content Block Types

The content column is a JSON array of blocks. Build a ContentRenderer component that handles each type:

| Type | Fields | Render As |
|------|--------|-----------|
| paragraph | text | <p> |
| heading | text | <h2> with decorative left border |
| subheading | text | <h3> |
| list | items[] | <ul> with styled bullets |
| callout | title, text | Colored callout box |
| quote | text, author | <blockquote> |
| image | src, alt, caption | <figure> with optional caption |
| table | headers[], rows[][] | Styled <table> |
| pros-cons | pros[], cons[] | Side-by-side green/red cards |
| info-box | title, text, variant | Colored info panel |
| stat-cards | cards[{number, label, sublabel}] | Stats grid |
| process-steps | steps[{title, text}] | Numbered step list |
| prompt | text | DO NOT RENDER — internal CMS instruction block |

## Supabase Connection

Create a .env file with:
- VITE_SUPABASE_URL — your Supabase project URL
- VITE_SUPABASE_ANON_KEY — your Supabase anon key
- VITE_SITE_NAME — your site name
- VITE_SITE_TAGLINE — your tagline
- VITE_BOOKING_URL — booking calendar URL
- VITE_CONTACT_EMAIL and VITE_CONTACT_PHONE

All queries filter by status = 'published' and order by date desc.

## Design Direction

Clean and airy, warm and inviting, photo-forward, modern editorial, mobile-first. Think editorial magazine meets local guide. Blog posts should be a pleasure to read — max-width content area (~720px), comfortable line height, good paragraph spacing.`;


// ── Registration ───────────────────────────────────────────────

const PROMPTS = [
  {
    name: 'getting-started',
    title: 'Getting Started',
    description: 'Full onboarding walkthrough — what this CMS does, how to create your first blog post, set up preferences, and use the content pipeline.',
    content: GETTING_STARTED,
  },
  {
    name: 'generate-blog-post',
    title: 'Generate Blog Post',
    description: 'Turn a YouTube transcript into a full blog post with voice matching, SEO optimization, and CMS content blocks.',
    content: GENERATE_BLOG_POST,
  },
  {
    name: 'research-topic',
    title: 'Research Topic',
    description: 'Research a keyword with DataForSEO — pull search volume, difficulty, SERP analysis, and competitive intelligence, then save to the topic pipeline.',
    content: RESEARCH_TOPIC,
  },
  {
    name: 'seo-review',
    title: 'SEO Review',
    description: 'Pre-publish SEO quality check — title, meta description, headings, internal links, keyword usage, and readability.',
    content: SEO_REVIEW,
  },
  {
    name: 'setup-knowledge-base',
    title: 'Setup Knowledge Base',
    description: 'Set up your voice and style knowledge base from YouTube transcripts and writing samples so AI-generated content matches your voice.',
    content: SETUP_KNOWLEDGE_BASE,
  },
  {
    name: 'build-public-website',
    title: 'Build Public Website',
    description: 'Scaffold the public-facing reader website that displays published blog content from the CMS database.',
    content: BUILD_PUBLIC_WEBSITE,
  },
];

/**
 * Registers all CMS prompts on the given McpServer instance.
 *
 * @param {import('@modelcontextprotocol/sdk/server/mcp.js').McpServer} server
 */
export function registerAllPrompts(server) {
  for (const { name, title, description, content } of PROMPTS) {
    server.registerPrompt(name, { title, description }, () => ({
      messages: [
        {
          role: 'user',
          content: { type: 'text', text: content },
        },
      ],
    }));
  }
}
