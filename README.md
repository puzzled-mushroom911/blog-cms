# Blog CMS

<p align="center">
  <img src="https://moonify.ai/moonify-logo.svg" alt="Moonify" height="40">
  <br>
  <em>Built by the <a href="https://moonify.ai">Moonify.ai</a> team</em>
</p>

A lightweight content management system for reviewing and publishing AI-generated blog posts. Built for content creators who use Claude Code (or any AI) to turn YouTube transcripts into SEO-optimized blog posts.

**Stack:** React 19 + Vite + Tailwind CSS 4 + Supabase (all free tier)

## How It All Fits Together

This project has **two parts** that share one Supabase database:

```
┌─────────────────────┐         ┌─────────────────────┐
│     Blog CMS        │         │   Public Website     │
│   (this repo)       │         │  (you build this)    │
│                     │         │                      │
│  Write, review,     │         │  Readers see your    │
│  and publish posts  │────────▶│  published content   │
│                     │  same   │                      │
│  Admin interface    │Supabase │  Built with the      │
│  (login required)   │   DB    │  prompt in /prompts  │
└─────────────────────┘         └─────────────────────┘
```

1. **This repo (Blog CMS)** -- The admin tool. You log in, review AI-generated posts, edit metadata, and hit publish.
2. **Your public website** -- The reader-facing site. Use the prompt in `prompts/build-public-website.md` with Claude Co-Work or Claude Code to build it. It reads published posts from the same Supabase database using the anon key (no login needed).

Both projects use the same Supabase project. The CMS writes to the database (authenticated). The public site reads from it (anon key, RLS restricts to published posts only).

## What This Does

1. **You record a YouTube video** (you already do this)
2. **Claude Code turns your transcript into a blog post** (using the prompts in `/prompts`)
3. **You review it in this CMS** -- edit metadata, fix wording, check SEO
4. **You hit publish** -- your website pulls the content from Supabase

The CMS is the review layer between AI-generated content and your live website. It gives you a clean interface to manage post status (draft / needs review / published), edit metadata and SEO fields, and preview how content will look before it goes live.

## Two Ways to Get Started

### Option A: Use the Hosted Version (fastest)

No cloning, no installs. Use the hosted CMS at **[cms.moonify.ai](https://cms.moonify.ai)**.

<a name="getting-started-hosted"></a>

1. **Create a free Supabase project** at [supabase.com](https://supabase.com/)
2. **Run the database schema** -- In your Supabase SQL Editor, paste and run [`supabase/schema.sql`](https://github.com/puzzled-mushroom911/blog-cms/blob/main/supabase/schema.sql)
3. **Create a CMS user** -- In Supabase > Authentication > Users, click "Add user", enter your email/password, check "Auto Confirm User"
4. **Connect** -- Go to [cms.moonify.ai](https://cms.moonify.ai), paste your Supabase Project URL and anon key, and sign in
5. **Start generating content** -- Install [Claude Code](https://claude.ai/download) and use the prompts in the `prompts/` folder to generate blog posts from your YouTube transcripts

That's it. Your content lives in your own Supabase project -- the hosted CMS just reads and writes to it.

### Option B: Self-Host (full control)

Clone the repo and run it yourself. Follow the setup instructions below.

## Prerequisites

- **Node.js 18+** -- [Download here](https://nodejs.org/) (free)
- **Supabase account** -- [Sign up here](https://supabase.com/) (free tier is plenty)
- **Claude Code** (optional but recommended) -- [Get it here](https://claude.ai/download)

## Self-Host Setup (5 minutes)

### 1. Clone the repo

```bash
git clone https://github.com/puzzled-mushroom911/blog-cms.git
cd blog-cms
```

### 2. Install dependencies

```bash
npm install
```

### 3. Create a Supabase project

1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **New Project**
3. Give it a name (e.g., "blog-cms") and set a database password
4. Wait for it to finish setting up (~1 minute)

### 4. Run the database schema

One file creates everything the CMS needs -- tables, RLS policies, functions, and triggers:

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy and paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql)
4. Click **Run** -- it should return "Success. No rows returned."

That single file creates 12 tables: profiles, workspaces, workspace_members, blog_posts, blog_post_relations, blog_topics, seo_pages, editorial_research, cms_block_comments, feedback, feedback_embeddings, preferences, and api_keys.

### 5. Create your CMS user

You need a Supabase Auth user to log into the CMS:

1. In your Supabase dashboard, go to **Authentication** > **Users**
2. Click **Add user** > **Create new user**
3. Enter your email and a password
4. Check "Auto Confirm User"
5. Click **Create user**

### 6. Configure environment variables

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

1. Go to **Settings** > **API** in your Supabase dashboard
2. Copy your **Project URL** and **anon/public key**
3. Paste them into `.env`:

```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

### 7. Start the dev server

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) and sign in with the user you created in step 5.

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

## Three Ways to Use the CMS

### 1. Manual — "Just Write"

Tell Claude what to write. It creates a blog post with all fields populated — SEO metadata, sources, AI reasoning — and saves it as a draft. Open the Content feed, review it, publish.

### 2. Collaborative — "Research First"

Ask Claude to research keywords with DataForSEO before writing. Review the research in the Content Pipeline (toggle on in Settings), approve topics, then tell Claude to write. The SEO Intelligence panel in the editor shows all the keyword data alongside your content.

### 3. Automated — "Full Autopilot"

Set Claude on a schedule to research and write posts weekly. Drafts appear in the Content feed with full SEO data. Quick-approve from the Calendar or review in the editor. Claude learns from your edits over time.

## How to Use with Claude Code

This is the recommended workflow for turning YouTube videos into blog posts:

### Generate a blog post

```bash
# 1. Download your video transcript
yt-dlp --write-auto-sub --sub-lang en --skip-download -o "transcript" "https://youtube.com/watch?v=YOUR_VIDEO_ID"

# 2. Ask Claude Code to generate a blog post
# (Use the prompt template in prompts/generate-blog-post.md)
```

### Insert it into Supabase

Claude Code can insert the post directly via SQL, or you can paste the JSON into the Supabase Table Editor:

```sql
insert into blog_posts (slug, title, excerpt, content, status, meta_description, category, author)
values (
  'your-post-slug',
  'Your SEO-Optimized Title Here',
  'A compelling excerpt for the post list...',
  '[{"type":"paragraph","text":"Your content here..."}]'::jsonb,
  'needs-review',
  'Your 150-160 character meta description',
  'General',
  'Your Name'
);
```

### Review in the CMS

1. Open the CMS -- your new post appears in the unified **Content feed** with a status badge (Draft, In Review, etc.) and a type badge (blue "Blog" or violet "SEO Page")
2. Click it to open the post editor
3. Review the rendered content preview on the left
4. Use the **Metadata** tab on the right to edit title, slug, excerpt, category, tags, author, featured image, and meta description
5. Switch to the **SEO** tab to see the **SEO Intelligence panel** -- AI reasoning, keyword data (volume, difficulty, CPC), related keywords, People Also Ask questions, SERP features, and content gaps from linked research topics
6. Make inline text edits by clicking on any content block
7. Change status to "Published" when ready
8. Hit Save

### SEO review before publishing

Use the prompt in `prompts/seo-review.md` to have Claude Code audit the post for SEO quality before you publish.

## MCP Server (for AI Assistants)

The CMS includes an MCP server that lets Claude Desktop, Claude Code, or any MCP-compatible AI assistant manage your blog posts and topics directly.

### Install in Claude Desktop

Add this to your Claude Desktop config (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "blog-cms": {
      "command": "npx",
      "args": ["-y", "github:puzzled-mushroom911/blog-cms"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "your-service-role-key"
      }
    }
  }
}
```

### Available MCP tools

| Tool | Description |
|------|-------------|
| `list_posts` | List blog posts, optionally filter by status |
| `get_post` | Get a post by ID or slug (includes full content) |
| `create_post` | Create a new blog post with content blocks |
| `update_post` | Partial update — only include fields to change |
| `publish_post` | Set a post to "published" |
| `list_topics` | List research pipeline topics |
| `get_topic` | Get a topic with full research data |
| `create_topic` | Create a topic with keyword data |
| `update_topic` | Update topic status, notes, or research data |
| `list_preferences` | List active writing style rules |
| `create_preference` | Add a new style preference |
| `get_workspace_info` | Workspace name, settings, and stats |

### What about the prompts?

The prompt templates in `prompts/` are **not served by the MCP server**. They are reference files you use directly with Claude Code or paste into Claude. The MCP server provides data access tools; the prompts provide content generation workflows.

## Customization

### Brand settings

Edit `src/config.js` defaults, or use the **Settings** page in the CMS to configure:

- Site/brand name
- Website URL
- Default author
- Blog path prefix
- YouTube channel URL

Settings are saved to localStorage so they persist across sessions.

### Categories

Edit the `CATEGORY_OPTIONS` array in `src/components/MetadataSidebar.jsx` to match your content topics:

```js
const CATEGORY_OPTIONS = [
  'Neighborhoods',
  'Market Update',
  'Home Buying',
  'Lifestyle',
  // Add your own...
];
```

### Deploy hook

To automatically rebuild your website when you publish a post:

1. Create a deploy hook in your hosting provider (Vercel, Netlify, etc.)
2. Add it to your `.env` file:
   ```
   VITE_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
   ```
3. Now when you save a post with status "Published", it triggers a rebuild

## Block Types Reference

The CMS renders these JSON block types. Use them when generating content with Claude Code:

| Type | Fields | Description |
|------|--------|-------------|
| `paragraph` | `text` | Regular paragraph |
| `heading` | `text` | H2 heading with blue left border |
| `subheading` | `text` | H3 subheading |
| `list` | `items[]` | Bulleted list |
| `callout` | `title`, `text` | Blue callout box |
| `quote` | `text`, `attribution` | Block quote |
| `image` | `src`, `alt`, `caption` | Image with optional caption |
| `table` | `headers[]`, `rows[][]` | Data table |
| `pros-cons` | `pros[]`, `cons[]`, `prosTitle?`, `consTitle?` | Side-by-side pros and cons |
| `info-box` | `content`, `variant?` | Info or warning box (variant: `"warning"` for amber, default is blue) |
| `stat-cards` | `cards[{number, label, sublabel?}]` | Statistics grid |
| `process-steps` | `steps[{title, text}]` | Numbered steps |
| `prompt` | `text` | Internal instruction for Claude (NOT rendered on public site) |

## Project Structure

```
blog-cms/
├── README.md                    # This file
├── package.json                 # Dependencies
├── vite.config.js               # Vite + Tailwind config
├── .env.example                 # Environment variables template
├── index.html                   # HTML entry point
├── supabase/
│   └── schema.sql               # Complete database setup (run once in Supabase SQL Editor)
├── prompts/
│   ├── generate-blog-post.md    # Prompt: transcript to blog post
│   ├── seo-review.md            # Prompt: SEO audit before publishing
│   ├── setup-knowledge-base.md  # Guide: set up your voice/style KB
│   └── build-public-website.md  # Prompt: build the public-facing site
└── src/
    ├── main.jsx                 # Entry point
    ├── App.jsx                  # Routes
    ├── index.css                # Tailwind imports
    ├── config.js                # Brand configuration
    ├── lib/
    │   └── supabase.js          # Supabase client
    ├── contexts/
    │   └── AuthContext.jsx      # Auth state management
    ├── pages/
    │   ├── Login.jsx            # Email/password login
    │   ├── Content.jsx          # Unified content feed (blog posts + SEO pages)
    │   ├── PostEditor.jsx       # Content preview + metadata + SEO intelligence
    │   ├── Analytics.jsx        # Keyword research insights + publishing velocity
    │   ├── Calendar.jsx         # Content calendar with approve actions
    │   ├── Topics.jsx           # Content Pipeline (advanced, toggle in Settings)
    │   └── Settings.jsx         # Brand/site configuration + pipeline toggle
    └── components/
        ├── Layout.jsx           # Sidebar navigation (5 items)
        ├── ProtectedRoute.jsx   # Auth guard
        ├── ContentCard.jsx      # Unified content card (blog + SEO)
        ├── SeoIntelligence.jsx  # SEO research panel in editor
        ├── ContentRenderer.jsx  # Block type renderer
        ├── MetadataSidebar.jsx  # Post metadata + SEO fields
        └── StatusBadge.jsx      # Status label component
```

## Building Your Public Website

The CMS stores content in Supabase. You need a separate public-facing website that reads from the same database to display published posts.

**Option 1: Use the Claude Co-Work prompt (recommended)**

Open `prompts/build-public-website.md` and paste it into a new Claude Co-Work session (or Claude Code). It builds a complete blog website -- home page, blog index, post pages, contact page -- that connects to your Supabase database using the anon key.

**Option 2: Build your own**

Your public site just needs to query Supabase with the anon key:

```js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

// Get all published posts
const { data: posts } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('status', 'published')
  .order('date', { ascending: false })

// Get a single post by slug
const { data: post } = await supabase
  .from('blog_posts')
  .select('*')
  .eq('slug', 'your-post-slug')
  .eq('status', 'published')
  .single()
```

The RLS policies ensure that unauthenticated (anon) requests can only read published posts, while authenticated users (you in the CMS) can read and edit everything.

## FAQ

**Can I use this without Claude Code?**
Yes. You can write blog posts manually and paste the JSON blocks into Supabase, or use any AI tool to generate the content. The CMS is just a review/publishing interface.

**Do I need to pay for Supabase?**
No. The free tier includes 500MB of database storage, 50,000 monthly active users for auth, and unlimited API requests. That is far more than a blog CMS needs.

**Can multiple people use it?**
Yes. Create additional users in Supabase Auth. All authenticated users have full access to all posts.

**How do I deploy the CMS?**
Run `npm run build` and deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.). It is a client-side app -- no server needed.

## License

MIT
