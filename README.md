# Blog CMS

A lightweight, human-in-the-loop content management system for reviewing and publishing AI-generated blog posts and SEO pages. Built for small business owners whose teams may not use AI directly — Claude Code (or any AI tool) creates content, and your team reviews and approves it before it goes live.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/puzzled-mushroom911/blog-cms)

**Stack:** React 19 + Vite + Tailwind CSS 4 + Supabase (all free tier)

## What This Does

This CMS sits between AI-generated content and your live website. Claude Code (or any AI) inserts posts and pages with a `needs-review` status. Your team reviews, edits, and approves them in a clean interface before anything goes live.

1. **AI generates content** — Claude Code researches topics, writes blog posts, and builds SEO pages, inserting them directly into Supabase with `needs-review` status
2. **Your team reviews it** — open the CMS, see a queue of everything waiting for approval, edit metadata, check SEO, leave inline notes
3. **Approve and publish** — click Publish and your website rebuilds automatically via deploy hook

## Features

- Blog post management with 13 content block types
- Topic and keyword research pipeline with SEO data fields
- Programmatic SEO page management (5 default page types, fully customizable)
- Approval queue for daily human-in-the-loop review
- Content calendar with unified blog and SEO page view
- Inline editorial notes on individual content blocks
- Image upload and Pexels stock photo search
- Deploy hook integration (Vercel, Netlify, and any webhook-based host)
- Settings page for categories, page types, and brand config — no code changes needed

## Prerequisites

- **Node.js 18+** — [Download here](https://nodejs.org/) (free)
- **Supabase account** — [Sign up here](https://supabase.com/) (free tier is plenty)
- **Claude Code** (optional but recommended) — [Get it here](https://claude.ai/download)

## Setup (5 minutes)

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

### 4. Run the database migrations

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Run each migration file in order — copy the contents of each file, paste it in, and click **Run**:

```
supabase/migrations/001_blog_posts.sql
supabase/migrations/002_blog_topics.sql
supabase/migrations/003_editor_notes.sql
supabase/migrations/004_seo_pages.sql
supabase/migrations/005_seo_workflow.sql
supabase/migrations/006_flexible_page_types.sql
```

Run all six in order. Each should return "Success. No rows returned."

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

## How to Use with Claude Code

This is the core workflow: Claude Code acts as the content creator, your team acts as the editor.

### Research and insert topics

Claude Code can research keywords and insert them into the topic pipeline:

```sql
insert into blog_topics (title, primary_keyword, secondary_keywords, search_volume, keyword_difficulty, status)
values (
  'Working title here',
  'primary keyword',
  array['secondary keyword 1', 'secondary keyword 2'],
  1200,
  35,
  'researched'
);
```

Topics appear in the CMS Topics view for your team to approve or discard before any writing begins.

### Generate blog posts

Claude Code can insert blog posts directly into Supabase with `needs-review` status:

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

### Generate SEO pages

Claude Code can also generate programmatic SEO pages and insert them into `seo_pages` with `needs-review` status. These appear in the SEO Pages view for review.

### Review in the CMS

1. Open the Approval Queue — all content with `needs-review` status appears here
2. Click any item to open the editor
3. Review the rendered content preview
4. Edit metadata in the sidebar (title, slug, category, SEO fields)
5. Make inline text edits by clicking any text block
6. Leave inline notes on specific content blocks for the AI to address
7. Change status to "Published" when ready and hit Save

## Customization

### Brand settings

Use the **Settings** page in the CMS to configure:

- Site and brand name
- Website URL
- Default author
- Blog path prefix
- Deploy hook URL

Settings are saved to localStorage and persist across sessions. You can also edit defaults directly in `src/config.js`.

### Categories and page types

Categories and SEO page types are now editable from the **Settings** page — no code changes needed. Add, rename, or remove options to match your content niche.

### Deploy hook

To automatically rebuild your website when you publish content:

1. Create a deploy hook in your hosting provider (Vercel, Netlify, etc.)
2. Add it to your `.env` file:
   ```
   VITE_DEPLOY_HOOK_URL=https://api.vercel.com/v1/integrations/deploy/...
   ```
3. Now when you save content with status "Published", the CMS triggers a rebuild

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
| `pros-cons` | `pros[]`, `cons[]` | Side-by-side pros and cons |
| `info-box` | `content`, `variant?` | Info or warning box |
| `stat-cards` | `cards[{number, label, sublabel?}]` | Statistics grid |
| `process-steps` | `steps[{title, text}]` | Numbered steps |
| `prompt` | `text` | AI instruction block — visible only in the editor, not rendered on the public site |

## Project Structure

```
blog-cms/
├── README.md                        # This file
├── package.json                     # Dependencies
├── vite.config.js                   # Vite + Tailwind config
├── .env.example                     # Environment variables template
├── index.html                       # HTML entry point
├── supabase/
│   └── migrations/
│       ├── 001_blog_posts.sql       # Core blog posts schema
│       ├── 002_blog_topics.sql      # Topic research pipeline
│       ├── 003_editor_notes.sql     # Inline editorial notes
│       ├── 004_seo_pages.sql        # SEO pages schema
│       ├── 005_seo_workflow.sql     # SEO approval workflow
│       └── 006_flexible_page_types.sql  # Configurable page types
├── prompts/
│   ├── generate-blog-post.md        # Prompt: transcript to blog post
│   ├── seo-review.md                # Prompt: SEO audit before publishing
│   └── setup-knowledge-base.md     # Guide: set up your voice/style KB
└── src/
    ├── main.jsx                     # Entry point
    ├── App.jsx                      # Routes
    ├── index.css                    # Tailwind imports
    ├── config.js                    # Brand configuration
    ├── lib/
    │   ├── supabase.js              # Supabase client
    │   └── seoPages.js              # SEO pages data helpers
    ├── contexts/
    │   └── AuthContext.jsx          # Auth state management
    ├── pages/
    │   ├── Login.jsx                # Email/password login
    │   ├── Dashboard.jsx            # Post list + stats + filters
    │   ├── PostEditor.jsx           # Content preview + metadata editor
    │   ├── Topics.jsx               # Topic research pipeline list
    │   ├── TopicDetail.jsx          # Individual topic research view
    │   ├── SeoPages.jsx             # SEO pages list
    │   ├── SeoPageEditor.jsx        # SEO page editor
    │   ├── ApprovalQueue.jsx        # Daily review queue (blog + SEO)
    │   ├── Calendar.jsx             # Unified content calendar
    │   └── Settings.jsx             # Brand, categories, page types config
    └── components/
        ├── Layout.jsx               # Sidebar navigation
        ├── ProtectedRoute.jsx       # Auth guard
        ├── PostCard.jsx             # Blog post preview card
        ├── TopicCard.jsx            # Topic research card
        ├── SeoPageCard.jsx          # SEO page preview card
        ├── CalendarGrid.jsx         # Calendar view component
        ├── ContentRenderer.jsx      # Block type renderer
        ├── MetadataSidebar.jsx      # Post metadata + SEO fields
        ├── BlockNotes.jsx           # Inline editorial notes UI
        ├── ImageUpload.jsx          # Image upload component
        ├── PexelsSearch.jsx         # Pexels stock photo search
        └── StatusBadge.jsx          # Status label component
```

## Connecting to Your Website

The CMS stores content in Supabase. Your website reads from the same database to display published posts.

**Fetching published posts (example):**

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
Yes. You can write blog posts manually and paste the JSON blocks into Supabase, or use any AI tool to generate the content. The CMS is just a review and publishing interface.

**Is this only for real estate?**
No. It works for any content niche. Customize your categories and SEO page types directly from the Settings page — no code changes needed.

**What is the approval workflow?**
AI creates content with `needs-review` status → your team reviews it in the CMS → clicks Publish or Approve → the site rebuilds automatically via deploy hook.

**Do I need to pay for Supabase?**
No. The free tier includes 500MB of database storage, 50,000 monthly active users for auth, and unlimited API requests. That is far more than a blog CMS needs.

**Can multiple people use it?**
Yes. Create additional users in Supabase Auth. All authenticated users have full access to all posts.

**How do I deploy the CMS itself?**
Click the Deploy to Vercel button at the top of this README, or run `npm run build` and deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.). It is a client-side app — no server needed.

## License

MIT
