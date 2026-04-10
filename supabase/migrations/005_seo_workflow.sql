-- 005_seo_workflow.sql
-- Adds scheduling, approval states, workflow routing, and editorial research tracking.

-- ── seo_pages: add scheduled_date and needs-review status ──────────────────

-- Add scheduled_date column (nullable — pages without a date are unscheduled)
alter table seo_pages add column if not exists scheduled_date date;

-- Expand status check to include 'needs-review'
alter table seo_pages drop constraint if exists seo_pages_status_check;
alter table seo_pages add constraint seo_pages_status_check
  check (status in ('draft', 'needs-review', 'published'));

-- Index for approval queue queries (needs-review pages by date)
create index if not exists idx_seo_pages_scheduled_date on seo_pages(scheduled_date);
create index if not exists idx_seo_pages_status_date on seo_pages(status, scheduled_date);

-- ── blog_topics: add workflow_type and seo_page FK ─────────────────────────

-- workflow_type distinguishes editorial (weekly deep blog) from programmatic (daily SEO pages)
alter table blog_topics add column if not exists workflow_type text
  default 'editorial' check (workflow_type in ('editorial', 'programmatic'));

-- For programmatic topics, link to the resulting seo_page (parallels blog_post_id for editorial)
alter table blog_topics add column if not exists seo_page_id uuid
  references seo_pages(id) on delete set null;

create index if not exists idx_blog_topics_workflow_type on blog_topics(workflow_type);

-- ── editorial_research: accumulates research throughout the week ───────────

create table if not exists editorial_research (
  id uuid default gen_random_uuid() primary key,
  source_type text not null check (source_type in ('podcast', 'youtube', 'web', 'dataforseo', 'rag', 'manual')),
  source_name text not null default '',
  source_url text default '',
  title text not null,
  summary text not null,
  raw_content text default '',
  tags text[] default '{}',
  relevance_score integer default 50 check (relevance_score between 0 and 100),
  used_in_post_id uuid references blog_posts(id) on delete set null,
  created_at timestamptz default now()
);

create index if not exists idx_editorial_research_source on editorial_research(source_type);
create index if not exists idx_editorial_research_created on editorial_research(created_at desc);
create index if not exists idx_editorial_research_unused on editorial_research(used_in_post_id) where used_in_post_id is null;

-- RLS: authenticated only (internal tool)
alter table editorial_research enable row level security;

create policy "Authenticated users can manage editorial_research" on editorial_research
  for all using (auth.role() = 'authenticated');
