# CMS UI Restructure — Design Spec

**Date:** 2026-04-15
**Status:** Approved
**Scope:** UI-only refactor of blog-cms (~/blog-cms/). No backend/API changes. Schema stays the same.

---

## Problem

The CMS has 8 sidebar items with overlapping concerns. Blog posts, SEO pages, and the approval queue are separate pages that look similar and blur together. The topic pipeline has 6 statuses while blog posts have 3 — confusing for users. The navigation feels chaotic despite serving technical Claude Code users who want depth, not simplicity.

## Goal

Reorganize the same features into a clearer information architecture. Reduce sidebar from 8 to 5 items. Surface more SEO intelligence per post. Keep all technical depth — this is an organization fix, not a feature reduction.

## Target Users

Technical users who run Claude Code. They understand APIs, MCP servers, and CLI tools. The problem isn't complexity — it's that the UI is disorganized and redundant.

---

## New Sidebar (5 items)

| # | Label | Icon | Replaces |
|---|-------|------|----------|
| 1 | **Content** | LayoutDashboard | Blog Posts + SEO Pages + HITL Queue |
| 2 | **Calendar** | CalendarDays | Calendar (enhanced with approve/schedule) |
| 3 | **Analytics** | BarChart3 | SEO Dashboard (expanded) |
| 4 | **Docs** | BookOpen | Docs (keep, deepen later) |
| 5 | **Settings** | Settings | Settings (add Pipeline toggle) |

**Removed from sidebar:**
- "Content Pipeline" → moved behind Settings toggle (advanced, off by default)
- "SEO Pages" → merged into Content with type badge
- "HITL Queue" → dissolved; "In Review" filter on Content IS the review queue

---

## Phase 1: Sidebar + Quick Wins

**Files changed:** `Layout.jsx`

1. Update NAV_ITEMS to 5 items: Content (/), Calendar (/calendar), Analytics (/analytics), Docs (/docs), Settings (/settings)
2. Keep routes for /topics and /approval alive but remove from sidebar (accessible via direct URL or Settings toggle)
3. Rename /seo route to /analytics

**Files changed:** `App.jsx`

1. Update route for SeoDashboard from `/seo` to `/analytics`
2. Keep old routes as redirects for bookmarks

---

## Phase 2: Unified Content Page

**New file:** `src/pages/Content.jsx` (replaces Dashboard.jsx as the index route)

### Layout

```
┌─────────────────────────────────────────────────┐
│ Content                                         │
│ Manage all your blog posts and SEO pages        │
├─────────────────────────────────────────────────┤
│ [Stats row: Total | Drafts | In Review |        │
│  Scheduled | Published]                         │
├─────────────────────────────────────────────────┤
│ [Search] [All|Draft|In Review|Scheduled|         │
│  Published] [All Types ▾] [Sort ▾]             │
├─────────────────────────────────────────────────┤
│ ┌─ Content Card ────────────────────────────┐   │
│ │ [Blog] Published  "Real Cost of Buying.." │   │
│ │ Apr 10 · 8 min · 2,450 words  [Edit][View]│   │
│ ├───────────────────────────────────────────┤   │
│ │ [SEO Page] Draft  "Moving from Chicago.." │   │
│ │ moving-from · Apr 12        [Edit][View]  │   │
│ ├───────────────────────────────────────────┤   │
│ │ [Blog] In Review  "Safety Harbor vs..."   │   │
│ │ Apr 12 · 10 min · 3,100 words [Edit]      │   │
│ └───────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Data Source

Query both `blog_posts` and `seo_pages` tables. Normalize into a common shape:

```js
{
  id, title, slug, status, date, type, // 'blog' | 'seo'
  // Blog-specific:
  category, read_time, image, word_count, tags,
  // SEO-specific:
  page_type, h1,
  // Shared:
  meta_description, created_at, updated_at
}
```

### Status Mapping (UI display only — DB values unchanged)

| DB Status (blog_posts) | Display Status |
|------------------------|---------------|
| `draft` | Draft |
| `needs-review` | In Review |
| `published` (future date) | Scheduled |
| `published` (past/today date) | Published |

| DB Status (seo_pages) | Display Status |
|----------------------|---------------|
| `draft` | Draft |
| `needs-review` | In Review |
| `published` (with scheduled_date > today) | Scheduled |
| `published` | Published |

No DB migration needed. StatusBadge already handles the scheduled logic.

### Content Card Component

**New file:** `src/components/ContentCard.jsx`

Unified card that renders both blog posts and SEO pages. Shows:
- **Type badge**: "Blog" (blue-50/blue-700) or "SEO Page" (violet-50/violet-700)
- **Status badge**: existing StatusBadge component
- **Title**: clickable, navigates to editor
- **Metadata row**: date, read_time (blog), word_count (blog), page_type (SEO)
- **Thumbnail**: image if blog post has one
- **Quick actions**: Edit (pencil), View on site (external link)
- **SEO indicator** (new): small colored dot showing keyword opportunity strength if research data exists
  - Green dot: KD < 30 AND volume > 500 (strong opportunity)
  - Yellow dot: KD 30-60 OR volume 200-500 (moderate)
  - No dot: no keyword data

Reuses existing PostCard and SeoPageCard patterns but unified.

### Type Filter

Dropdown or toggle: "All Types" | "Blog Posts" | "SEO Pages"

### Empty State

Same helpful 3-step onboarding from existing Dashboard empty state, but updated copy:
1. "Connect Claude Code" — shows MCP config snippet
2. "AI generates content" — drafts appear here automatically
3. "Review and publish" — edit, approve, schedule

### "New Post" Button

Header row includes a "New Post" button that:
1. Creates a blank `blog_posts` row with status `draft`, title "Untitled Post", today's date
2. Navigates to `/posts/{id}` editor

---

## Phase 3: SEO Intelligence Panel

**Files changed:** `src/pages/PostEditor.jsx`, new component `src/components/SeoIntelligence.jsx`

### Where It Appears

In the PostEditor, alongside the existing MetadataSidebar. Two approaches:
- **Tabs on the right panel**: "Metadata" | "SEO Intelligence" — user toggles between them
- This keeps the editor layout unchanged while adding the new panel

### Data Source

1. Check if the blog post has a linked topic: query `blog_topics` WHERE `blog_post_id = post.id`
2. If found, pull `research_data`, `search_volume`, `keyword_difficulty`, `cpc`, `competition_level`
3. Also show `blog_posts.ai_reasoning` field

### Panel Contents

```
┌─ SEO Intelligence ──────────────────┐
│                                      │
│ ★ AI Reasoning                       │
│ "This topic targets 'cost of living  │
│ tampa bay' with 1,800/mo searches    │
│ and a difficulty of 42. Your site    │
│ has no competing content for this    │
│ keyword, making it a strong gap..."  │
│                                      │
│ ─────────────────────────────────    │
│                                      │
│ Keyword Data                         │
│ ┌──────────┬──────────┬──────────┐  │
│ │ 1,800/mo │ KD 42    │ $1.90    │  │
│ │ Volume   │ Diff.    │ CPC      │  │
│ └──────────┴──────────┴──────────┘  │
│                                      │
│ Competition: Medium                  │
│                                      │
│ ─────────────────────────────────    │
│                                      │
│ Related Keywords                     │
│ • tampa bay cost of living 2026      │
│   880/mo · KD 35                     │
│ • is tampa expensive                 │
│   590/mo · KD 28                     │
│                                      │
│ ─────────────────────────────────    │
│                                      │
│ People Also Ask                      │
│ • "Is Tampa Bay affordable?"         │
│ • "What salary do you need in Tampa?"│
│                                      │
│ ─────────────────────────────────    │
│                                      │
│ SERP Features                        │
│ [featured_snippet] [people_also_ask] │
│ [local_pack]                         │
│                                      │
│ Content Gaps                         │
│ • No competitor covers insurance     │
│   costs alongside COL data           │
│ • Missing: commute cost analysis     │
└──────────────────────────────────────┘
```

### When No Research Data

If no linked topic or empty research_data:
- Show muted message: "No SEO research data linked to this post."
- If ai_reasoning exists, still show that section.

---

## Phase 4: Settings — Content Pipeline Toggle

**Files changed:** `src/pages/Settings.jsx`, `src/config.js`

### New Config Key

```js
defaults = {
  ...existing,
  showContentPipeline: false, // off by default
};
```

### Settings UI

New section in Settings between "Content Preferences" and "API Keys":

```
┌─ Content Pipeline (Advanced) ───────┐
│ ☐ Show Content Pipeline              │
│                                      │
│ Enable the topic research pipeline   │
│ in the sidebar. This shows keyword   │
│ research stages (ideas, researched,  │
│ approved, writing, complete) for     │
│ users who want to manually manage    │
│ their content strategy.              │
│                                      │
│ When disabled, Claude automatically  │
│ picks the best topics based on your  │
│ brand and market area.               │
└──────────────────────────────────────┘
```

### Sidebar Behavior

In `Layout.jsx`, conditionally show "Content Pipeline" nav item based on config:

```jsx
const config = getConfig();
const navItems = [
  { to: '/', label: 'Content', icon: LayoutDashboard, end: true },
  ...(config.showContentPipeline ? [{ to: '/topics', label: 'Content Pipeline', icon: Lightbulb }] : []),
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/docs', label: 'Docs', icon: BookOpen },
  { to: '/settings', label: 'Settings', icon: Settings },
];
```

The /topics route stays alive regardless — direct URL access always works.

---

## Phase 5: Calendar Enhancement

**Files changed:** `src/pages/Calendar.jsx`, `src/components/CalendarGrid.jsx`

### Changes

1. Add approve/publish quick actions to calendar items
2. Calendar items for "Draft" or "In Review" posts show a small approve button
3. Clicking an item navigates to the editor (already partially works via CalendarGrid)
4. Add scheduled blog posts to the calendar (currently only fetches from fetchCalendarItems which may be SEO-only — verify and include blog_posts with future dates)

---

## Phase 6: Analytics Enhancement

**Files changed:** `src/pages/SeoDashboard.jsx` (renamed to `src/pages/Analytics.jsx`)

### Keep
- Keyword Opportunity Map (scatter chart)
- Pipeline Funnel (bar chart)
- Difficulty Distribution (donut)
- Pipeline Summary cards
- Top Opportunities table

### Add
- **Publishing Velocity**: simple bar chart showing posts published per week over last 8 weeks (query blog_posts where status = published, group by week)
- **Content Mix**: pie chart of blog posts vs SEO pages (published count)
- Rename page title from "SEO Dashboard" to "Analytics"
- Subtitle: "Content performance and keyword research insights"

---

## Files Impacted Summary

| File | Action |
|------|--------|
| `src/components/Layout.jsx` | Edit sidebar nav items |
| `src/App.jsx` | Update routes |
| `src/pages/Content.jsx` | **NEW** — unified content feed |
| `src/components/ContentCard.jsx` | **NEW** — unified content card |
| `src/components/SeoIntelligence.jsx` | **NEW** — SEO panel for editor |
| `src/pages/PostEditor.jsx` | Add SEO Intelligence tab to sidebar |
| `src/pages/Settings.jsx` | Add Pipeline toggle |
| `src/config.js` | Add showContentPipeline default |
| `src/pages/SeoDashboard.jsx` | Rename to Analytics.jsx, add charts |
| `src/pages/Calendar.jsx` | Add approve actions |
| `src/components/CalendarGrid.jsx` | Add quick action buttons |
| `src/components/StatusBadge.jsx` | No changes needed (already handles all statuses) |
| `src/lib/setupSql.js` | No changes (schema stays the same) |
| `CLAUDE.md` | Update to reflect new navigation |
| `README.md` | Update feature descriptions |

### No changes needed
- Supabase tables/schema (no migration)
- MCP server (api/mcp.js, bin/mcp-server.js)
- Auth flow (AuthContext, ConnectionContext, WorkspaceContext)
- ContentRenderer, BlockNotes, MetadataSidebar
- PostCard.jsx, TopicCard.jsx (kept for Pipeline view)
- SeoPageCard.jsx (kept for Pipeline view)
- Connect.jsx, Setup.jsx, CreateWorkspace.jsx
- All docs pages (src/pages/docs/*)
- lib/feedback.js, lib/seoPages.js, lib/supabase.js
- supabase/migrations/* (no new migrations)

---

## Testing Plan

1. **Content page**: verify both blog posts and SEO pages appear, filters work, type toggle works, search works, stats are accurate
2. **Content card**: verify blog and SEO page cards render correctly with appropriate badges and metadata
3. **New Post button**: verify creates a draft and navigates to editor
4. **SEO Intelligence panel**: verify data loads from linked topic, handles missing data gracefully
5. **Settings toggle**: verify Content Pipeline appears/disappears from sidebar
6. **Calendar**: verify approve actions work, blog posts with future dates appear
7. **Analytics**: verify new charts render, data is accurate
8. **Old routes**: verify /topics, /seo-pages, /approval still work via direct URL
9. **Existing functionality**: verify PostEditor, ContentRenderer, feedback loop, WordPress publishing all still work
10. **Dev server**: `npm run dev` starts without errors
11. **Build**: `npm run build` completes without errors
