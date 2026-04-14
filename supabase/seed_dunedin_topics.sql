-- Dunedin keyword research — DataForSEO April 13, 2026
-- Run against the blog CMS Supabase project to populate the topic pipeline.
-- These are INSERT ... ON CONFLICT statements so they can be re-run safely.

-- 1. Dunedin FL Cost of Living (70/mo, LOW comp)
INSERT INTO blog_topics (
  title, primary_keyword, secondary_keywords,
  search_volume, keyword_difficulty, cpc, competition_level,
  status, research_data
) VALUES (
  'The Real Cost of Living in Dunedin FL (2026)',
  'dunedin fl cost of living',
  ARRAY['is dunedin florida a good place to live', 'living in dunedin florida', 'dunedin florida neighborhoods', 'best places to live in pinellas county'],
  70, 0, 0.51, 'low',
  'researched',
  '{
    "keyword_data": {
      "monthly_searches": [
        {"month": "2026-03", "volume": 70},
        {"month": "2026-02", "volume": 40},
        {"month": "2026-01", "volume": 90},
        {"month": "2025-12", "volume": 70},
        {"month": "2025-11", "volume": 50},
        {"month": "2025-10", "volume": 50},
        {"month": "2025-09", "volume": 40},
        {"month": "2025-08", "volume": 90},
        {"month": "2025-07", "volume": 50},
        {"month": "2025-06", "volume": 50},
        {"month": "2025-05", "volume": 70},
        {"month": "2025-04", "volume": 50}
      ],
      "competition_index": 0.03,
      "high_top_of_page_bid": null,
      "low_top_of_page_bid": null
    },
    "serp_results": [
      {"position": 1, "title": "Cost of Living in Dunedin, Florida - Payscale", "url": "https://www.payscale.com/cost-of-living-calculator/Florida-Dunedin", "domain": "payscale.com", "type": "organic"},
      {"position": 2, "title": "Dunedin, FL Cost of Living", "url": "https://www.bestplaces.net/cost_of_living/city/fl/dunedin", "domain": "bestplaces.net", "type": "organic"},
      {"position": 3, "title": "Moving to Dunedin, FL", "url": "https://livability.com/fl/dunedin", "domain": "livability.com", "type": "organic"},
      {"position": 4, "title": "Cost of Living in Dunedin, FL", "url": "https://www.erieri.com/cost-of-living/united-states/florida/dunedin", "domain": "erieri.com", "type": "organic"},
      {"position": 5, "title": "Cost of Living in Dunedin, FL: rent, food, transport [2026]", "url": "https://livingcost.org/cost/united-states/fl/dunedin", "domain": "livingcost.org", "type": "organic"},
      {"position": 6, "title": "Living in Dunedin FL: A Friendly Guide", "url": "https://busyinflorida.com/living-in-dunedin-fl/", "domain": "busyinflorida.com", "type": "organic"},
      {"position": 7, "title": "Cost Of Living in Dunedin, FL", "url": "https://www.areavibes.com/dunedin-fl/cost-of-living/", "domain": "areavibes.com", "type": "organic"}
    ],
    "serp_features": ["ai_overview", "people_also_ask", "video_carousel", "related_searches"],
    "people_also_ask": [
      "Is it expensive to live in Dunedin, FL?",
      "Can you live comfortably on $50,000 a year in Florida?",
      "Is Dunedin, Florida a good place to live?",
      "Which city in Florida has the lowest cost of living?",
      "Do hurricanes hit Dunedin, Florida?",
      "Can I retire in Florida on $3,000 a month?"
    ],
    "ai_overview": {
      "summary": "Dunedin FL offers a relatively affordable coastal lifestyle, with an overall cost of living roughly 3% lower than the national average. Housing costs 16-23% below national average. Higher utilities (+7%) and groceries (+6%).",
      "sources": ["payscale.com", "facebook.com", "youtube.com", "nextdoor.com"],
      "key_data_points": {
        "median_income": "$69,255",
        "median_home_value": "$367,088",
        "average_rent": "$1,581/mo",
        "minimum_family_income": "$78,480",
        "minimum_single_income": "$58,800"
      }
    },
    "video_carousel": [
      {"source": "Living in Tampa FL", "title": "Is Dunedin FL Right for You? Cost, Community & Where to Live"},
      {"source": "Paul Fontaine - St. Pete Tampa Real Estate", "title": "Top 10 PROS & CONS of LIVING IN DUNEDIN, FLORIDA"},
      {"source": "All About St Pete Florida", "title": "PROS & CONS Of Living In Dunedin Florida 2023"}
    ],
    "related_searches": [
      "Dunedin fl cost of living calculator",
      "Dunedin fl cost of living 2021",
      "Pros and cons of living in Dunedin FL",
      "Dunedin FL homes for sale"
    ],
    "content_gaps": [
      "SERP is entirely data aggregator sites — zero real estate agent or local expert content ranking",
      "No result breaks down costs by neighborhood or housing type within Dunedin",
      "AI Overview cites conflicting data (3% lower vs 16% higher) — opportunity for authoritative local breakdown",
      "No content covers insurance costs post-hurricane, which is the real cost driver for Dunedin buyers",
      "livinginstpetefl.com not ranking at all"
    ],
    "suggested_angles": [
      "Lead with real monthly cost breakdown for a typical Dunedin home purchase — mortgage, insurance, taxes, HOA, utilities",
      "Address the conflicting cost data directly — explain why different sources say different things",
      "Include post-hurricane insurance reality that data sites completely miss",
      "Compare Dunedin costs to neighboring towns (Clearwater, Palm Harbor, Safety Harbor) for relocation context",
      "Answer the $50K and $3K/month retirement PAA questions with specific Dunedin scenarios"
    ],
    "full_brief": "## SEO Brief: The Real Cost of Living in Dunedin FL (2026)\n\n### Target Keyword\n- Primary: dunedin fl cost of living — 70/mo, KD unknown, CPC $0.51\n- Secondary: is dunedin florida a good place to live (40/mo), living in dunedin florida (10/mo), best places to live in pinellas county (40/mo)\n\n### Search Intent\nInformational — people considering a move to Dunedin want to understand actual monthly expenses before committing.\n\n### SERP Landscape\nDominated by data aggregator sites (Payscale, BestPlaces, AreaVibes). No local expert content. Video carousel shows competitor YouTube channels. AI Overview present with conflicting data points.\n\n### People Also Ask\n- Is it expensive to live in Dunedin, FL?\n- Can you live comfortably on $50,000 a year in Florida?\n- Is Dunedin a good place to live?\n- Do hurricanes hit Dunedin?\n- Can I retire on $3,000 a month?\n\n### Competitor Gaps\n- All top results are generic data — no neighborhood-level breakdowns\n- No content addresses post-hurricane insurance cost increases\n- No buyer-focused perspective with real transaction data\n- Conflicting cost percentages across sources\n\n### Recommended Structure\n- H2: What Does It Actually Cost to Live in Dunedin FL?\n- H2: Housing Costs by Neighborhood\n- H2: Insurance After the Hurricanes — The Hidden Cost\n- H2: Utilities, Groceries, and Daily Expenses\n- H2: Can You Retire in Dunedin on $3,000/Month?\n- H2: Dunedin vs Clearwater vs Safety Harbor — Cost Comparison\n- H2: FAQ\n\n### Differentiation Strategy\nUse real buyer transaction data and local knowledge to provide specific numbers that data aggregators cannot. Address hurricane insurance costs that no current result covers."
  }'::jsonb
);

-- 2. Things to Do in Dunedin FL (320/mo, HIGH comp)
INSERT INTO blog_topics (
  title, primary_keyword, secondary_keywords,
  search_volume, keyword_difficulty, cpc, competition_level,
  status, research_data
) VALUES (
  'Things to Do in Dunedin FL: A Relocation Buyer''s Guide',
  'things to do in dunedin florida',
  ARRAY['dunedin florida downtown', 'dunedin florida restaurants', 'dunedin florida breweries', 'dunedin causeway', 'honeymoon island dunedin'],
  320, 0, 0.97, 'high',
  'researched',
  '{
    "keyword_data": {
      "monthly_searches": [
        {"month": "2026-03", "volume": 480},
        {"month": "2026-02", "volume": 390},
        {"month": "2026-01", "volume": 390},
        {"month": "2025-12", "volume": 260},
        {"month": "2025-11", "volume": 170},
        {"month": "2025-10", "volume": 260},
        {"month": "2025-09", "volume": 260},
        {"month": "2025-08", "volume": 260},
        {"month": "2025-07", "volume": 260},
        {"month": "2025-06", "volume": 320},
        {"month": "2025-05", "volume": 320},
        {"month": "2025-04", "volume": 260}
      ],
      "competition_index": 1.0,
      "high_top_of_page_bid": 0.75,
      "low_top_of_page_bid": 0.09
    },
    "related_high_volume_keywords": [
      {"keyword": "dunedin florida restaurants", "search_volume": 8100, "competition": "low", "cpc": 0.57},
      {"keyword": "dunedin causeway", "search_volume": 3600, "competition": "low", "cpc": 0.40},
      {"keyword": "dunedin florida downtown", "search_volume": 3600, "competition": "low", "cpc": 1.38},
      {"keyword": "dunedin florida breweries", "search_volume": 50, "competition": "low", "cpc": 0.01}
    ],
    "content_gaps": [
      "Most things-to-do content is tourist-focused — no content frames activities through a relocation lens",
      "No content answers: what is there to do if you LIVE here year-round vs visiting for a weekend?",
      "Brewery and restaurant guides exist but none connect lifestyle to housing decisions",
      "Dunedin Causeway and Honeymoon Island content is travel-oriented, not resident-oriented"
    ],
    "suggested_angles": [
      "Frame as lifestyle content for relocation buyers — what does a typical week look like if you live in Dunedin?",
      "Capture the massive secondary keywords (restaurants 8,100/mo, downtown 3,600/mo, causeway 3,600/mo) with thorough subsections",
      "Include seasonal differences — what Dunedin is like in summer vs snowbird season",
      "Connect lifestyle to neighborhoods — live downtown for walkability, live near causeway for beach access"
    ]
  }'::jsonb
);

-- 3. Downtown Dunedin Living Guide (3,600/mo parent keyword, LOW comp)
INSERT INTO blog_topics (
  title, primary_keyword, secondary_keywords,
  search_volume, keyword_difficulty, cpc, competition_level,
  status, research_data
) VALUES (
  'Downtown Dunedin: What It''s Like to Live on Main Street (2026)',
  'dunedin florida downtown',
  ARRAY['living in dunedin florida', 'dunedin florida restaurants', 'dunedin florida breweries', 'things to do in dunedin florida'],
  3600, 0, 1.38, 'low',
  'researched',
  '{
    "keyword_data": {
      "monthly_searches": [
        {"month": "2026-03", "volume": 5400},
        {"month": "2026-02", "volume": 4400},
        {"month": "2026-01", "volume": 3600},
        {"month": "2025-12", "volume": 3600},
        {"month": "2025-11", "volume": 2900},
        {"month": "2025-10", "volume": 2900},
        {"month": "2025-09", "volume": 2400},
        {"month": "2025-08", "volume": 2900},
        {"month": "2025-07", "volume": 2900},
        {"month": "2025-06", "volume": 2900},
        {"month": "2025-05", "volume": 3600},
        {"month": "2025-04", "volume": 3600}
      ],
      "competition_index": 0.24,
      "high_top_of_page_bid": 2.84,
      "low_top_of_page_bid": 0.36
    },
    "content_gaps": [
      "Search intent is mixed — visitors looking for what to do vs potential residents exploring the area",
      "No content frames downtown Dunedin as a place to LIVE, only visit",
      "Housing options near downtown (condos, historic homes, walkable neighborhoods) not covered",
      "No content addresses parking, noise, walkability scores, or daily life logistics"
    ],
    "suggested_angles": [
      "Position as the definitive guide to living in/near downtown Dunedin — not just visiting",
      "Cover walkability, housing types and price ranges within walking distance of Main Street",
      "Include the brewery scene, Pinellas Trail access, and weekend market as lifestyle draws",
      "Address the trade-offs: older housing stock, smaller lots, noise on weekends, tourist traffic in season"
    ]
  }'::jsonb
);

-- 4. Dunedin After the Hurricanes (10/mo but $7.28 CPC — highest buyer intent)
INSERT INTO blog_topics (
  title, primary_keyword, secondary_keywords,
  search_volume, keyword_difficulty, cpc, competition_level,
  status, research_data
) VALUES (
  'Dunedin Florida After the Hurricanes: What Buyers Need to Know (2026)',
  'dunedin florida hurricane damage',
  ARRAY['dunedin florida flooding', 'dunedin causeway', 'is dunedin florida a good place to live'],
  10, 0, 7.28, 'low',
  'researched',
  '{
    "keyword_data": {
      "monthly_searches": [
        {"month": "2026-03", "volume": 10},
        {"month": "2026-02", "volume": 10},
        {"month": "2026-01", "volume": 10},
        {"month": "2025-12", "volume": 10},
        {"month": "2025-11", "volume": 10},
        {"month": "2025-10", "volume": 10}
      ],
      "competition_index": 0.08,
      "cpc_note": "$7.28 CPC is highest of all Dunedin keywords — indicates strong commercial/buyer intent despite low volume"
    },
    "people_also_ask": [
      "Do hurricanes hit Dunedin, Florida?",
      "Is Dunedin in a flood zone?",
      "How bad was hurricane damage in Dunedin?"
    ],
    "serp_notes": {
      "dunedin_gov_ranking": "dunedin.gov ranks in PAA results with marina rebuild updates — official city source",
      "paa_appears_in": "This question appears as PAA in multiple Dunedin keyword SERPs"
    },
    "content_gaps": [
      "No comprehensive content covers Dunedin hurricane recovery status for prospective buyers",
      "Dunedin Marina rebuild is a major ongoing story with no buyer-focused coverage",
      "Flood zone and insurance cost implications after Helene/Milton not addressed anywhere",
      "No content helps buyers understand which Dunedin neighborhoods were most/least affected"
    ],
    "suggested_angles": [
      "Lead with current recovery status — what has been rebuilt, what is still in progress",
      "Map which neighborhoods/areas were impacted vs unaffected",
      "Cover the insurance reality: what buyers should expect for premiums in different flood zones",
      "Use Aaron''s firsthand hurricane experience as a trust-building differentiator",
      "Include Dunedin Causeway and marina updates as key recovery milestones"
    ]
  }'::jsonb
);

-- 5. Dunedin Florida Homes for Sale — Market Guide (1,900/mo, MEDIUM comp)
INSERT INTO blog_topics (
  title, primary_keyword, secondary_keywords,
  search_volume, keyword_difficulty, cpc, competition_level,
  status, research_data
) VALUES (
  'Dunedin Florida Real Estate: The Buyer''s Market Guide (2026)',
  'dunedin florida homes for sale',
  ARRAY['dunedin florida real estate', 'dunedin florida waterfront homes', 'dunedin florida neighborhoods'],
  1900, 0, 0.49, 'medium',
  'researched',
  '{
    "keyword_data": {
      "monthly_searches": [
        {"month": "2026-03", "volume": 2900},
        {"month": "2026-02", "volume": 2900},
        {"month": "2026-01", "volume": 2400},
        {"month": "2025-12", "volume": 1900},
        {"month": "2025-11", "volume": 1900},
        {"month": "2025-10", "volume": 1600},
        {"month": "2025-09", "volume": 1600},
        {"month": "2025-08", "volume": 2900},
        {"month": "2025-07", "volume": 1600},
        {"month": "2025-06", "volume": 1600},
        {"month": "2025-05", "volume": 1600},
        {"month": "2025-04", "volume": 1600}
      ],
      "competition_index": 0.43,
      "high_top_of_page_bid": 0.74,
      "low_top_of_page_bid": 0.03,
      "trend_note": "Strong upward trend — volume nearly doubled from 1,600 to 2,900 between late 2025 and early 2026"
    },
    "related_keywords": [
      {"keyword": "dunedin florida real estate", "search_volume": 390, "competition": "medium", "cpc": 0.33},
      {"keyword": "dunedin florida neighborhoods", "search_volume": 10, "competition": "low"},
      {"keyword": "dunedin florida schools", "search_volume": 10, "competition": "low"}
    ],
    "content_gaps": [
      "SERP will be dominated by Zillow, Realtor.com, Redfin — hard to outrank on transactional intent",
      "Opportunity is in the informational layer: what should buyers KNOW about the Dunedin market",
      "No agent content covers neighborhood-by-neighborhood pricing or housing stock characteristics",
      "No content addresses the older housing stock issue — most Dunedin homes are pre-1990"
    ],
    "suggested_angles": [
      "Don''t try to be a listings page — instead be the guide people read BEFORE searching listings",
      "Cover what $300K, $400K, $500K+ gets you in different Dunedin neighborhoods",
      "Address the old housing stock reality: what to inspect, insurance implications, renovation costs",
      "Include neighborhood profiles: downtown, Dunedin Isles, Skycrest, Scottish Highlands",
      "Tie to YouTube content and offer to help buyers navigate the Dunedin market"
    ]
  }'::jsonb
);

-- 6. UPDATE existing Dunedin Pros & Cons topic with SERP research data
UPDATE blog_topics SET
  search_volume = 10,
  competition_level = 'medium',
  secondary_keywords = ARRAY['moving to dunedin florida', 'is dunedin florida a good place to live', 'living in dunedin florida', 'dunedin vs clearwater'],
  research_data = '{
    "keyword_data": {
      "monthly_searches": [
        {"month": "2026-03", "volume": 10},
        {"month": "2026-02", "volume": 10},
        {"month": "2026-01", "volume": 10},
        {"month": "2025-12", "volume": 10},
        {"month": "2025-11", "volume": 10},
        {"month": "2025-10", "volume": 10}
      ],
      "competition_index": 0.56
    },
    "serp_results": [
      {"position": 1, "title": "Looking to Move to Dunedin : r/DunedinFlorida", "url": "https://www.reddit.com/r/DunedinFlorida/comments/1m7aw2u/looking_to_move_to_dunedin/", "domain": "reddit.com", "type": "organic"},
      {"position": 2, "title": "ULTIMATE Moving to Dunedin FL Guide", "url": "https://2collegebrothers.com/blog/living-in-moving-to-dunedin-fl/", "domain": "2collegebrothers.com", "type": "organic"},
      {"position": 3, "title": "Moving to Dunedin, FL", "url": "https://livability.com/fl/dunedin", "domain": "livability.com", "type": "organic"},
      {"position": 4, "title": "Moving to Dunedin, FL from east coast", "url": "https://www.facebook.com/groups/1478198666908140/posts/1919756416085694/", "domain": "facebook.com", "type": "organic"},
      {"position": 5, "title": "Should You Live in Dunedin Florida?", "url": "https://livingintampafl.com/should-you-live-in-dunedin-florida/", "domain": "livingintampafl.com", "type": "organic"},
      {"position": 6, "title": "Live in Dunedin Florida in 2023", "url": "https://www.realestate-palmharbor.com/blog/dunedin-living-in-2023/", "domain": "realestate-palmharbor.com", "type": "organic"},
      {"position": 7, "title": "Dunedin, FL - Niche", "url": "https://www.niche.com/places-to-live/dunedin-pinellas-fl/", "domain": "niche.com", "type": "organic"}
    ],
    "serp_features": ["people_also_ask", "video_carousel", "perspectives", "related_searches"],
    "people_also_ask": [
      "Is Dunedin a good place to live in Florida?",
      "Do hurricanes hit Dunedin, Florida?",
      "Is Dunedin a LGBTQ friendly area?",
      "What is the racial makeup of Dunedin Florida?"
    ],
    "video_carousel": [
      {"source": "Living in Tampa FL", "title": "Is Dunedin FL Right for You? Cost, Community & Where to Live"},
      {"source": "Living in Tampa FL", "title": "Living in Dunedin Pros and Cons 2024"},
      {"source": "LIVING IN TAMPA FLORIDA", "title": "Why Dunedin is the Most Unexpected Town You''ll Fall in Love With"},
      {"source": "LIVING IN TAMPA FLORIDA", "title": "Why Dunedin Is Florida''s Best Place To Live!"}
    ],
    "related_searches": [
      "Pros and cons of moving to dunedin florida",
      "Moving to dunedin florida reddit",
      "Dunedin FL homes for sale",
      "Dunedin FL cost of living",
      "Dunedin homes for sale"
    ],
    "content_gaps": [
      "No top result addresses hurricane recovery or flood zone impact for Dunedin buyers",
      "Video carousel dominated by Living in Tampa FL — Living in St. Pete has no presence",
      "Reddit and Facebook UGC dominate — quality blog post could crack top 5",
      "No result covers Dunedin from a relocation buyer perspective with real data",
      "livinginstpetefl.com not ranking at all for this keyword"
    ],
    "suggested_angles": [
      "Lead with honest pros and cons from Aaron''s local expertise — address hurricane damage, walkability, brewery scene",
      "Include cost breakdown by neighborhood — downtown vs outskirts pricing",
      "Answer the PAA questions directly for featured snippet potential",
      "Embed Living in St. Pete Dunedin video to capture video carousel crossover traffic"
    ]
  }'::jsonb
WHERE primary_keyword = 'dunedin florida pros and cons';

-- 7. UPDATE existing Clearwater vs Dunedin topic with keyword data
UPDATE blog_topics SET
  search_volume = 10,
  cpc = 0,
  competition_level = 'low',
  secondary_keywords = ARRAY['dunedin vs clearwater', 'dunedin vs safety harbor', 'best places to live in pinellas county'],
  research_data = jsonb_set(
    COALESCE(research_data, '{}'::jsonb),
    '{keyword_volumes}',
    '{
      "dunedin vs clearwater": {"search_volume": 10, "competition": "low", "trending_up": true},
      "best places to live in pinellas county": {"search_volume": 40, "competition": "low", "cpc": 1.17},
      "clearwater vs dunedin": {"note": "No Google Ads data returned — may be too niche for volume tracking"}
    }'::jsonb
  )
WHERE primary_keyword = 'clearwater vs dunedin';
