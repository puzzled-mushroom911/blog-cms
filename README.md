# Blog CMS

A lightweight content management system for reviewing and publishing AI-generated blog posts. Built for content creators who use Claude Code (or any AI) to turn YouTube transcripts into SEO-optimized blog posts.

**Stack:** React 19 + Vite + Tailwind CSS 4 + Supabase (all free tier)

## What This Does

1. **You record a YouTube video** (you already do this)
2. **Claude Code turns your transcript into a blog post** (using the prompts in `/prompts`)
3. **You review it in this CMS** -- edit metadata, fix wording, check SEO
4. **You hit publish** -- your website pulls the content from Supabase

The CMS is the review layer between AI-generated content and your live website. It gives you a clean interface to manage post status (draft / needs review / published), edit metadata and SEO fields, and preview how content will look before it goes live.

## Prerequisites

- **Node.js 18+** -- [Download here](https://nodejs.org/) (free)
- **Supabase account** -- [Sign up here](https://supabase.com/) (free tier is plenty)
- **Claude Code** (optional but recommended) -- [Get it here](https://claude.ai/download)

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

### 4. Run the database migration

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy the contents of `supabase/migrations/001_blog_posts.sql` and paste it in
4. Click **Run** (you should see "Success. No rows returned")

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

1. Open the CMS dashboard -- your new post appears with a "Needs Review" badge
2. Click it to open the editor
3. Review the rendered content preview
4. Edit metadata in the sidebar (title, slug, category, SEO fields)
5. Make inline text edits by clicking on any text block
6. Change status to "Published" when ready
7. Hit Save

### SEO review before publishing

Use the prompt in `prompts/seo-review.md` to have Claude Code audit the post for SEO quality before you publish.

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
| `pros-cons` | `pros[]`, `cons[]` | Side-by-side pros and cons |
| `info-box` | `content`, `variant?` | Info or warning box |
| `stat-cards` | `cards[{number, label, sublabel?}]` | Statistics grid |
| `process-steps` | `steps[{title, text}]` | Numbered steps |

## Project Structure

```
blog-cms/
├── README.md                    # This file
├── package.json                 # Dependencies
├── vite.config.js               # Vite + Tailwind config
├── .env.example                 # Environment variables template
├── index.html                   # HTML entry point
├── supabase/
│   └── migrations/
│       └── 001_blog_posts.sql   # Database schema
├── prompts/
│   ├── generate-blog-post.md    # Prompt: transcript to blog post
│   ├── seo-review.md            # Prompt: SEO audit before publishing
│   └── setup-knowledge-base.md  # Guide: set up your voice/style KB
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
    │   ├── Dashboard.jsx        # Post list + stats + filters
    │   ├── PostEditor.jsx       # Content preview + metadata editor
    │   └── Settings.jsx         # Brand/site configuration
    └── components/
        ├── Layout.jsx           # Sidebar navigation
        ├── ProtectedRoute.jsx   # Auth guard
        ├── PostCard.jsx         # Post preview card
        ├── ContentRenderer.jsx  # Block type renderer
        ├── MetadataSidebar.jsx  # Post metadata + SEO fields
        └── StatusBadge.jsx      # Status label component
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
Yes. You can write blog posts manually and paste the JSON blocks into Supabase, or use any AI tool to generate the content. The CMS is just a review/publishing interface.

**Do I need to pay for Supabase?**
No. The free tier includes 500MB of database storage, 50,000 monthly active users for auth, and unlimited API requests. That is far more than a blog CMS needs.

**Can multiple people use it?**
Yes. Create additional users in Supabase Auth. All authenticated users have full access to all posts.

**How do I deploy the CMS?**
Run `npm run build` and deploy the `dist/` folder to any static host (Vercel, Netlify, Cloudflare Pages, etc.). It is a client-side app -- no server needed.

## License

MIT
