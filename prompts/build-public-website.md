# Build Public Blog Website

> Use this prompt in Claude Co-Work (or Claude Code) to build the public-facing website that displays your published blog content. The CMS is where you write and review. This website is where readers find your content.

---

Build a neighborhood blog website that reads published content from a Supabase-powered CMS.

## What to Build

A public-facing blog website for a neighborhood/city — the kind a real estate agent or local business would use to attract relocation buyers. This site reads from the same Supabase database as the blog-cms-template CMS (https://github.com/puzzled-mushroom911/blog-cms-template).

The CMS is the admin tool where content gets created and approved. This website is the public reader that displays the published content.

## Tech Stack

- React 19 + Vite 8 + Tailwind CSS 4 (matches the CMS stack exactly)
- @supabase/supabase-js for data fetching
- react-router-dom v7 for routing
- framer-motion for subtle animations
- lucide-react for icons
- No SSR — this is a client-side SPA deployed to Vercel

## Pages to Build

1. **Home** — Hero section with neighborhood name + tagline, featured/latest posts grid (3-6 cards), categories section, CTA to browse all posts
2. **Blog Index** (`/blog`) — Filterable grid of all published posts. Filter by category. Search by title. Card shows: featured image, category badge, title, excerpt, date, read time
3. **Blog Post** (`/blog/:slug`) — Full article page that renders the JSONB content blocks. Sidebar with: author, date, read time, category, tags, table of contents (auto-generated from heading blocks), related posts
4. **Category Page** (`/blog/category/:category`) — Filtered blog index showing posts in one category
5. **About** — Placeholder page with editable content area
6. **Contact** (`/contact`) — Agent name, phone number, email, embedded booking calendar (iframe from `VITE_BOOKING_URL` env var), Google Maps embed of service area. Simple, clean layout — the goal is to make it dead easy to reach out.
7. **404** — Styled not-found page

## Supabase Data Model

The site reads from these tables (read-only via anon key — RLS only exposes published content):

### `blog_posts` table
- id: UUID
- slug: text (unique, used in URLs)
- title: text
- excerpt: text
- date: date
- read_time: text (e.g. "5 min read")
- author: text
- category: text
- tags: text[]
- youtube_id: text (nullable — embed YouTube video if present)
- image: text (featured image URL)
- meta_description: text
- keywords: text
- content: JSONB (array of content blocks — see below)
- status: text (only fetch where status = 'published')

### Content Block Types (blog_posts.content JSONB)

The `content` column is a JSON array of blocks. Build a `<ContentRenderer>` component that handles each type:

| Type | Fields | Render As |
|------|--------|-----------|
| `paragraph` | `text` | `<p>` |
| `heading` | `text` | `<h2>` with decorative left border |
| `subheading` | `text` | `<h3>` |
| `list` | `items[]` | `<ul>` with styled bullets |
| `callout` | `title`, `text` | Colored callout box |
| `quote` | `text`, `author` | `<blockquote>` |
| `image` | `src`, `alt`, `caption` | `<figure>` with optional caption |
| `table` | `headers[]`, `rows[][]` | Styled `<table>` |
| `pros-cons` | `pros[]`, `cons[]` | Side-by-side green/red cards |
| `info-box` | `title`, `text`, `variant` (blue or warning) | Colored info panel |
| `stat-cards` | `cards[{number, label, sublabel}]` | Stats grid |
| `process-steps` | `steps[{title, text}]` | Numbered step list |
| `prompt` | `text` | **DO NOT RENDER** — this is an internal CMS instruction block, skip it entirely |

## Supabase Connection

Create a `.env.example` with:
```
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SITE_NAME=Living in Kenwood
VITE_SITE_TAGLINE=Your guide to one of St. Pete's most charming neighborhoods
VITE_BOOKING_URL=https://your-booking-calendar-url
VITE_OG_IMAGE=https://your-site.com/og-image.jpg
VITE_CONTACT_EMAIL=you@example.com
VITE_CONTACT_PHONE=(555) 555-5555
```

Create `src/lib/supabase.js`:
```js
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
export { supabase }
```

All queries filter by `status = 'published'` and order by `date desc`.

## SEO & Social Sharing

The `index.html` must include proper meta and Open Graph tags using env vars:

```html
<title>%VITE_SITE_NAME% — %VITE_SITE_TAGLINE%</title>
<meta name="description" content="%VITE_SITE_TAGLINE%">
<meta property="og:title" content="%VITE_SITE_NAME%">
<meta property="og:description" content="%VITE_SITE_TAGLINE%">
<meta property="og:type" content="website">
<meta property="og:image" content="%VITE_OG_IMAGE%">
<meta name="twitter:card" content="summary_large_image">
```

For individual blog posts, dynamically update `document.title` and meta description in the `BlogPost` component using the post's title and `meta_description` field.

## Design Direction

This is a neighborhood lifestyle blog, not a corporate site. Think editorial magazine meets local guide. The design should feel:

- Clean and airy — generous whitespace, readable typography
- Warm and inviting — a color palette that feels local and approachable (think warm neutrals with one bold accent)
- Photo-forward — large featured images on cards and hero
- Modern editorial — inspired by sites like The Infatuation, Curbed, or Apartment Therapy
- Mobile-first — looks great on phones since most traffic comes from YouTube descriptions

Apply strong typographic hierarchy. Blog posts should be a pleasure to read — max-width content area (~720px), comfortable line height, good paragraph spacing.

## File Structure

```
src/
├── main.jsx
├── App.jsx
├── index.css
├── lib/
│   └── supabase.js
├── components/
│   ├── Layout.jsx          (header + footer + nav)
│   ├── ContentRenderer.jsx (renders JSONB blocks)
│   ├── PostCard.jsx        (blog card for grids)
│   ├── TableOfContents.jsx (auto-generated from headings)
│   └── CategoryBadge.jsx
├── pages/
│   ├── Home.jsx
│   ├── BlogIndex.jsx
│   ├── BlogPost.jsx
│   ├── CategoryPage.jsx
│   ├── About.jsx
│   ├── Contact.jsx
│   └── NotFound.jsx
└── hooks/
    └── usePosts.js         (Supabase query hooks)
```
