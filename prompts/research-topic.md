# Research a Blog Topic with DataForSEO

Research a keyword, pull competitive intelligence, and save the results to the `blog_topics` table in Supabase — ready for review and approval in the CMS.

## Quick Start

```
Research the keyword "moving to st pete florida" for the blog CMS.
Use the research-topic prompt.
```

Or with an optional working title:

```
Research the keyword "cost of living in st petersburg fl" with the working title
"The Real Cost of Living in St. Petersburg, FL (2026 Breakdown)".
Use the research-topic prompt.
```

## Prerequisites

- **DataForSEO MCP** must be configured in your Claude Code environment (`.mcp.json` or project settings). All `mcp__dataforseo__*` tools must be available.
- **Supabase MCP** must be configured with access to the blog CMS database. The `blog_topics` table must exist (see `CLAUDE.md` for schema).

---

## Step 1: Accept Input

Collect from the user:

| Input | Required | Notes |
|-------|----------|-------|
| **Primary keyword** | Yes | The exact keyword to research |
| **Working title** | No | If not provided, generate one after research |

---

## Step 2: Run DataForSEO Research

Call each tool in order. Use the results from earlier calls to inform later ones.

### 2a. Keyword Search Volume & CPC

Call `mcp__dataforseo__kw_data_google_ads_search_volume` with:
- **keywords**: `["<primary_keyword>"]`
- **location_name**: `"United States"`
- **language_code**: `"en"`

Extract from the response:
- `search_volume` (monthly average)
- `cpc` (cost per click — use `high_top_of_page_bid` as primary, also capture `low_top_of_page_bid`)
- `competition` (0.0-1.0 index)
- `competition_level` ("LOW", "MEDIUM", "HIGH" — normalize to lowercase)
- `monthly_searches` (array of month/volume pairs)

### 2b. Keyword Difficulty

Call `mcp__dataforseo__dataforseo_labs_bulk_keyword_difficulty` with:
- **keywords**: `["<primary_keyword>"]`
- **location_code**: `2840` (United States)
- **language_code**: `"en"`

Extract:
- `keyword_difficulty` (0-100 score)

### 2c. Related Keywords

Call `mcp__dataforseo__dataforseo_labs_google_keyword_ideas` with:
- **keywords**: `["<primary_keyword>"]`
- **location_code**: `2840` (United States)
- **language_code**: `"en"`
- **limit**: `50`
- **order_by**: `["keyword_data.keyword_info.search_volume,desc"]`

Filter the results to keywords with `search_volume > 50`. Keep the top 20.

For each, extract: keyword, search_volume, keyword_difficulty, cpc, competition_level.

### 2d. SERP Analysis

Call `mcp__dataforseo__serp_organic_live_advanced` with:
- **keyword**: `"<primary_keyword>"`
- **location_name**: `"United States"`
- **language_code**: `"en"`
- **depth**: `10`
- **calculate_rectangles**: `false`

Extract:
- Top 10 organic results: position, title, url, domain, description, type (organic, featured_snippet, etc.)
- SERP features present: featured_snippet, people_also_ask, local_pack, video, knowledge_graph, etc.
- People Also Ask questions (if present in the SERP items)

### 2e. SERP Competitors

Call `mcp__dataforseo__dataforseo_labs_google_serp_competitors` with:
- **keywords**: `["<primary_keyword>"]`
- **location_code**: `2840` (United States)
- **language_code**: `"en"`

Extract for each competitor domain:
- domain
- avg_position
- estimated_traffic (or relevant_serp_items)
- relevant_keywords count (or visibility)

### 2f. AI Search Volume (Optional)

If available, call `mcp__dataforseo__ai_optimization_keyword_data_search_volume` with:
- **keywords**: `["<primary_keyword>"]`
- **location_name**: `"United States"`
- **language_code**: `"en"`

Extract:
- ai_search_volume
- Any mentions of our domain (livinginstpetefl.com)
- Top mentioned domains

If this call fails or the tool is unavailable, set `ai_search_presence` to `null` in the output and continue.

---

## Step 3: Analyze and Synthesize

This step is YOUR analysis, not raw DataForSEO output. Use the data collected above to generate:

### content_gaps

Look at what the top 10 SERP results cover and identify 3-5 gaps:
- Topics none of the top results address well
- Questions from People Also Ask that no result fully answers
- Data or local specifics missing from generic national articles
- Angles relevant to Tampa Bay relocation buyers that competitors miss

### suggested_angles

Generate 3-5 angles for how Living in St. Pete should approach this topic:
- What differentiates our content (local expertise, Aaron & Aubrey's personal experience, buyer-focused perspective)
- Which content gaps we can fill
- How to structure the post for featured snippet potential
- Tie-ins to YouTube content or other blog posts

### full_brief

Write a complete markdown SEO brief that a writer (or Claude in a future step) can use to draft the blog post. Include:

```markdown
## SEO Brief: [Title]

### Target Keyword
- Primary: [keyword] — [volume]/mo, KD [score], CPC $[amount]
- Secondary: [top 5-10 keywords from related_keywords]

### Search Intent
[What the searcher is actually trying to accomplish]

### SERP Landscape
[Summary of what's ranking, content types, SERP features present]

### People Also Ask
[List the PAA questions — these are subheading candidates]

### Competitor Gaps
[What the current top results miss or do poorly]

### Recommended Structure
[Suggested H2/H3 outline based on SERP analysis and content gaps]

### Differentiation Strategy
[How our post should be different from what's already ranking]

### Internal Linking Opportunities
[Suggest links to existing blog posts or website pages if known]
```

---

## Step 4: Assemble research_data JSONB

Build the complete research payload:

```json
{
  "keyword_data": {
    "monthly_searches": [
      {"month": "2026-01", "volume": 1200},
      {"month": "2026-02", "volume": 1400}
    ],
    "competition_index": 0.45,
    "high_top_of_page_bid": 2.50,
    "low_top_of_page_bid": 0.80
  },
  "related_keywords": [
    {
      "keyword": "relocating to st pete fl",
      "search_volume": 480,
      "keyword_difficulty": 32,
      "cpc": 1.75,
      "competition_level": "medium"
    }
  ],
  "serp_results": [
    {
      "position": 1,
      "title": "Moving to St. Pete: Everything You Need to Know",
      "url": "https://example.com/moving-to-st-pete",
      "domain": "example.com",
      "description": "A complete guide to relocating...",
      "type": "organic"
    }
  ],
  "serp_features": ["featured_snippet", "people_also_ask", "local_pack"],
  "people_also_ask": [
    "Is St. Petersburg FL a good place to live?",
    "What is the cost of living in St. Petersburg FL?",
    "Is St. Pete expensive to move to?"
  ],
  "competitors": [
    {
      "domain": "niche.com",
      "avg_position": 3.2,
      "estimated_traffic": 850,
      "relevant_keywords": 45
    }
  ],
  "ai_search_presence": {
    "ai_search_volume": 200,
    "mentions_our_site": false,
    "top_mentioned_domains": ["niche.com", "redfin.com"]
  },
  "content_gaps": [
    "No top result covers flood insurance implications for buyers",
    "Missing neighborhood-level cost breakdowns",
    "No content addresses remote worker relocation angle"
  ],
  "suggested_angles": [
    "Lead with real cost data by neighborhood — not city-wide averages",
    "Include flood zone and insurance costs that national sites ignore",
    "Frame around relocation buyer questions from our YouTube comments"
  ],
  "full_brief": "## SEO Brief\n\n..."
}
```

---

## Step 5: Set Typed Columns

Extract from the research and map to the `blog_topics` typed columns:

| Column | Source |
|--------|--------|
| `title` | User-provided working title, or generate one from the keyword + SERP analysis (SEO-optimized, 50-60 chars) |
| `primary_keyword` | The input keyword (lowercase, trimmed) |
| `secondary_keywords` | Top 5-10 from `related_keywords`, ordered by search volume descending |
| `search_volume` | From Step 2a (`search_volume`) |
| `keyword_difficulty` | From Step 2b (0-100 integer) |
| `cpc` | From Step 2a (`high_top_of_page_bid`) |
| `competition_level` | From Step 2a, normalized to lowercase: `low`, `medium`, or `high` |
| `status` | `'researched'` |
| `research_data` | The full JSONB object from Step 4 |

---

## Step 6: Save to Supabase

Use Supabase MCP tools to save the research.

### Check for existing topic

First, check if a topic with this primary_keyword already exists:

```sql
SELECT id, title, status FROM blog_topics
WHERE primary_keyword = '<primary_keyword>'
LIMIT 1;
```

### INSERT (new topic)

If no existing topic is found:

```sql
INSERT INTO blog_topics (
  title, primary_keyword, secondary_keywords,
  search_volume, keyword_difficulty, cpc, competition_level,
  status, research_data
) VALUES (
  '<title>',
  '<primary_keyword>',
  ARRAY['kw1', 'kw2', 'kw3'],
  <search_volume>,
  <keyword_difficulty>,
  <cpc>,
  '<competition_level>',
  'researched',
  '<research_data_json>'::jsonb
);
```

### UPDATE (existing topic)

If a topic with the same primary_keyword already exists, update it (preserve existing notes and status if the status is `approved` or later):

```sql
UPDATE blog_topics SET
  title = '<title>',
  secondary_keywords = ARRAY['kw1', 'kw2', 'kw3'],
  search_volume = <search_volume>,
  keyword_difficulty = <keyword_difficulty>,
  cpc = <cpc>,
  competition_level = '<competition_level>',
  research_data = '<research_data_json>'::jsonb
WHERE primary_keyword = '<primary_keyword>';
```

If the existing topic has `status = 'researched'` or `status = 'discarded'`, also reset the status:

```sql
UPDATE blog_topics SET
  status = 'researched',
  -- ... all other fields above
WHERE primary_keyword = '<primary_keyword>';
```

Do NOT overwrite status if it is `approved`, `writing`, or `written` — just update the research data.

---

## Step 7: Report Results

After saving, print a summary:

```
Topic saved to CMS: "<title>"

Keyword:        <primary_keyword>
Volume:         <search_volume>/mo
Difficulty:     <keyword_difficulty>/100
CPC:            $<cpc>
Competition:    <competition_level>
Secondary KWs:  <count> keywords saved

SERP Features:  <list>
PAA Questions:  <count> captured
Competitors:    <count> domains analyzed

Status: researched — ready for review in the CMS.
```

---

## Error Handling

- If a DataForSEO tool call fails, log the error and continue with the remaining tools. Partial research is better than no research.
- If Supabase MCP is unavailable, output the complete `research_data` JSON to the terminal so the user can manually insert it.
- If the keyword returns zero search volume, still save the research (the keyword may have long-tail value or be emerging). Add a note: `"Note: Zero search volume detected — keyword may be emerging or highly niche."`

## Batch Mode

To research multiple keywords in one session:

```
Research these keywords for the blog CMS:
1. "moving to st pete florida"
2. "cost of living st petersburg fl"
3. "best neighborhoods in st pete"

Use the research-topic prompt for each.
```

Run Step 2 through Step 6 for each keyword sequentially. Print a batch summary at the end showing all topics saved with their key metrics.
