# DataForSEO Integration — Design Spec

> **Goal:** Enrich the blog-cms topic pipeline with real keyword research data from DataForSEO, displayed in the CMS with a dedicated SEO dashboard.

## Scope

1. **Data model** — Expand `research_data` JSONB on `blog_topics` to hold structured DataForSEO output. No migration needed (JSONB is flexible).
2. **TopicDetail UI** — Enhance the existing topic detail page to render richer DataForSEO data: monthly search trends, related keywords table, SERP results, People Also Ask, competitor domains.
3. **SEO Dashboard** — New `/seo` page with charts: keyword opportunity scatter, pipeline funnel, difficulty distribution, top opportunities table. Uses Recharts.
4. **Prompt template** — `prompts/research-topic.md` tells Claude Code how to research topics using DataForSEO MCP tools and insert structured results.

## Out of Scope

- No Edge Function for DataForSEO (users run research via Claude Code)
- No "Research" button in the CMS UI
- No WordPress publishing
- No changes to `blog_posts` or feedback system

## Data Model

### Typed columns (unchanged)

The existing typed columns on `blog_topics` stay as-is. They power sorting/filtering on the Topics list page:

- `search_volume` (integer)
- `keyword_difficulty` (integer)
- `cpc` (numeric)
- `competition_level` (text: low/medium/high)

Claude Code populates these from DataForSEO results when inserting/updating topics.

### research_data JSONB (expanded)

```json
{
  "keyword_data": {
    "monthly_searches": [
      { "month": "2026-03", "volume": 1200 },
      { "month": "2026-02", "volume": 1100 }
    ],
    "competition_index": 0.45,
    "high_top_of_page_bid": 3.50,
    "low_top_of_page_bid": 1.20
  },
  "related_keywords": [
    {
      "keyword": "best neighborhoods st pete",
      "search_volume": 880,
      "keyword_difficulty": 35,
      "cpc": 2.10,
      "competition_level": "medium"
    }
  ],
  "serp_results": [
    {
      "position": 1,
      "title": "Top 10 Neighborhoods in St. Pete",
      "url": "https://example.com/neighborhoods",
      "domain": "example.com",
      "description": "...",
      "type": "organic"
    }
  ],
  "serp_features": ["featured_snippet", "people_also_ask", "local_pack"],
  "people_also_ask": [
    "What are the best neighborhoods in St Pete?",
    "Is St Petersburg FL a good place to live?"
  ],
  "competitors": [
    {
      "domain": "example.com",
      "avg_position": 3.2,
      "estimated_traffic": 450,
      "relevant_keywords": 12
    }
  ],
  "ai_search_presence": {
    "ai_search_volume": 320,
    "mentions_our_site": false,
    "top_mentioned_domains": ["domain1.com", "domain2.com"]
  },
  "content_gaps": [
    "No competitor covers flood zone impact on neighborhoods",
    "Missing drive-time analysis from downtown"
  ],
  "suggested_angles": [
    "Neighborhood guide with flood zone overlay — zero competition",
    "Drive-time map from downtown to each neighborhood"
  ],
  "full_brief": "## SEO Brief\n\nMarkdown-formatted research brief..."
}
```

Backward compatible — existing topics with the old structure still render fine. New fields are additive.

## TopicDetail UI Enhancements

### Monthly Search Trend
- Small sparkline or bar chart below the Search Volume metric card
- Reads `research_data.keyword_data.monthly_searches`
- 12 bars showing volume trend
- Uses Recharts BarChart (tiny, inline)

### Related Keywords Table
- New section after Secondary Keywords
- Table columns: Keyword, Volume, Difficulty, CPC, Competition
- Reads `research_data.related_keywords`
- Sortable by clicking column headers
- Falls back to existing `secondary_keywords` tags if no related_keywords data

### SERP Results
- Replaces the text-only SERP overview section
- Shows SERP feature badges at top (featured_snippet, local_pack, people_also_ask, etc.) from `research_data.serp_features`
- Lists top 10 results with position number, title, domain, and clickable URL
- Reads `research_data.serp_results`
- Falls back to existing `serp_overview` text if no serp_results data

### People Also Ask
- List of PAA questions from `research_data.people_also_ask`
- Displayed as a simple styled list
- Only shown when data exists

### Competitors Table
- Shows domain-level competition data from `research_data.competitors`
- Columns: Domain, Avg Position, Est. Traffic, Relevant Keywords
- Falls back to existing `competitor_analysis` (what_they_cover/what_they_miss) format if no new-format data

## SEO Dashboard (new page)

### Route: `/seo`

New sidebar nav item between Topics and Settings.

### Charts (Recharts)

**1. Keyword Opportunity Scatter**
- X axis: keyword_difficulty (0-100)
- Y axis: search_volume
- Each dot = one topic
- Color-coded by status (idea=indigo, researched=violet, approved=sky, writing=orange, written=emerald)
- Tooltip shows topic title, volume, difficulty
- Top-left quadrant highlighted as "opportunity zone"

**2. Pipeline Funnel**
- Horizontal bar chart
- Bars: idea → researched → approved → writing → written
- Count of topics at each stage
- Color matches existing stat cards on Topics page

**3. Difficulty Distribution**
- Donut chart with three segments: Easy (0-30), Medium (31-60), Hard (61-100)
- Shows count and percentage in each segment

**4. Top Opportunities Table**
- Topics sorted by opportunity score: `search_volume / max(keyword_difficulty, 1)`
- Columns: Title, Primary Keyword, Volume, Difficulty, Score, Status
- Top 10 shown
- Links to TopicDetail page

### Data Source

All charts read from `blog_topics` table — single query on page load. No new tables or columns needed.

## Prompt Template

### File: `prompts/research-topic.md`

Instructs Claude Code to:

1. Accept a primary keyword (and optional secondary keywords)
2. Call DataForSEO MCP tools in this order:
   - `kw_data_google_ads_search_volume` — search volume, CPC, competition
   - `dataforseo_labs_bulk_keyword_difficulty` — difficulty score
   - `dataforseo_labs_google_keyword_ideas` — related keywords (top 20, filtered to volume > 50)
   - `serp_organic_live_advanced` — live SERP results, features, People Also Ask
   - `dataforseo_labs_google_serp_competitors` — competing domains
   - `ai_optimization_keyword_data_search_volume` — AI search volume (optional, skip if not needed)
3. Assemble results into the `research_data` JSONB structure above
4. Generate `content_gaps`, `suggested_angles`, and `full_brief` by analyzing the raw data
5. INSERT into `blog_topics` (or UPDATE if topic exists) with both typed columns and research_data
6. Location default: "United States" (configurable in prompt)

## New Dependency

- `recharts` — React charting library for the SEO Dashboard

## File Changes

| File | Change |
|------|--------|
| `src/pages/TopicDetail.jsx` | Add search trend sparkline, related keywords table, SERP results, PAA, competitors table |
| `src/pages/SeoDashboard.jsx` | New page: scatter, funnel, donut, opportunities table |
| `src/components/Layout.jsx` | Add SEO nav item to sidebar |
| `src/App.jsx` | Add `/seo` route |
| `prompts/research-topic.md` | New prompt template for Claude Code + DataForSEO workflow |
| `CLAUDE.md` | Document expanded research_data schema |
| `package.json` | Add recharts dependency |
