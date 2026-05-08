# Blog CMS

<p align="center">
  <img src="https://moonify.ai/moonify-logo.svg" alt="Moonify" height="40">
  <br>
  <em>Built by the <a href="https://github.com/puzzled-mushroom911/blog-cms">Moonify.ai</a> team</em>
</p>

A **local-first** content management system for AI-generated blog posts. Runs on your machine, uses your Supabase, talks to your Claude Code. No vendor lock-in, no SaaS subscription, no telemetry — your content lives on your laptop and in your database.

**Stack:** React 19 + Vite + Tailwind CSS 4 + Supabase (your project, free tier)

## Why local-first?

The agent era is local-first. Your AI tools (Claude Code, Cursor, Claude Desktop) run on your machine; your CMS shouldn't be one more SaaS login away. Blog CMS gives you:

- **Your data, your machine.** Supabase is your project. The UI is your local dev server. Your content is plain markdown on disk you can `git diff`.
- **Composable with your stack.** The MCP server is bundled in. Claude Code, Claude Desktop, or any MCP client can read and write your CMS. Edit posts in Cursor, Obsidian, or Vim — they're real markdown files.
- **No upgrade pressure, no API limits, no surprises.** You own the version, you own the schedule, you own the runway.

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

## Get Started

```bash
git clone https://github.com/puzzled-mushroom911/blog-cms.git
cd blog-cms
npm install
npx blog-cms init     # interactive Supabase + .env + (optional) Claude Desktop MCP
npm run dev           # CMS at http://localhost:5173
```

Open `http://localhost:5173` and sign in. That's it — you're running the whole CMS locally.

The `init` flow asks for four things from your Supabase dashboard (Settings → API + Settings → Database): **Project URL**, **anon key**, **service_role key**, **DB password**. It applies the full schema, creates your first user, writes `.env`, and (optionally) installs the MCP server into your Claude Desktop config so Claude can read and write your CMS directly.

### Prerequisites

- **Node.js 18+** -- [Download here](https://nodejs.org/) (free)
- **Supabase account** -- [Sign up here](https://supabase.com/) (free tier; or run a self-hosted Supabase)
- **Claude Code** (optional but recommended) -- [Get it here](https://claude.ai/download)

## Headless Mode (CLI + Markdown Sync)

Once initialized, `blog-cms` works as a proper command-line tool. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in your env (or have them in `.env`) and run any of:

```bash
npx blog-cms list                              # list posts (--status, --limit, --type=posts|topics)
npx blog-cms get my-post-slug --format=md      # fetch one post as markdown
npx blog-cms publish my-post-slug              # promote to published
npx blog-cms unpublish my-post-slug            # demote to draft

npx blog-cms pull ./content                    # export every post as ./content/<slug>.md
npx blog-cms push ./content/my-post.md         # upsert one markdown file as a post
npx blog-cms sync ./content                    # two-way sync between dir and Supabase
```

Markdown files use **YAML frontmatter** for metadata (slug, title, status, tags, etc.) and standard markdown for prose. Structured blocks (callouts, stat cards, pros/cons) round-trip via fenced code blocks tagged with their type, e.g. \`\`\`cms:callout. This means you can edit posts in any editor (Cursor, Obsidian, Vim) and `git diff` your content like any other source file.

### Optional: deploy the feedback Edge Function

The feedback system captures your edits to learn your writing style over time. The Edge Function generates vector embeddings automatically. The CMS works without this step — feedback entries just won't have embeddings until you deploy it.

```bash
npm install -g supabase
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy generate-feedback-embedding
```

Then in Supabase Dashboard → Database → Webhooks → Create new: Table `feedback`, Events `INSERT`, Function `generate-feedback-embedding`.

### Manual install (if you'd rather not use `npx blog-cms init`)

If you prefer to set things up by hand: run [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL Editor, create an Auth user (Authentication → Users → Add user with "Auto Confirm" checked), then `cp .env.example .env` and paste your Project URL and anon key into `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`. `npm run dev` starts the CMS.

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

**Is there a hosted version?**
A hosted instance runs at [cms.moonify.ai](https://cms.moonify.ai) for people who want to try the CMS without running anything locally. It uses the same code in this repo and reads/writes your own Supabase project (we don't see your data either way). The recommended path is local — you get more out of the markdown sync, the MCP server, and the agentic workflow when the CMS lives on your machine.

## License

MIT
