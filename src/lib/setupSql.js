/**
 * Complete database setup SQL for the blog CMS.
 * Users copy this into the Supabase SQL Editor and run it once.
 */
export const SETUP_SQL = `
-- =============================================================
-- Blog CMS — Database Setup
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- Safe to run multiple times (uses IF NOT EXISTS)
-- =============================================================

-- 1. Blog Posts
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  slug text unique not null,
  title text not null,
  excerpt text not null default '',
  date date not null default current_date,
  read_time text not null default '5 min read',
  author text default 'Author',
  category text not null default 'General',
  tags text[] default '{}',
  youtube_id text,
  image text not null default '',
  meta_description text not null default '',
  keywords text default '',
  content jsonb default '[]'::jsonb,
  editor_notes jsonb default '[]'::jsonb,
  status text default 'draft' check (status in ('draft', 'needs-review', 'published')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blog_posts_status on blog_posts(status);
create index if not exists idx_blog_posts_date on blog_posts(date desc);
create index if not exists idx_blog_posts_slug on blog_posts(slug);

-- 2. Blog Topics (Content Pipeline)
create table if not exists blog_topics (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  primary_keyword text,
  secondary_keywords text[] default '{}',
  search_volume integer,
  keyword_difficulty integer,
  cpc numeric(10,2),
  competition_level text check (competition_level in ('low', 'medium', 'high')),
  status text default 'idea' check (status in ('idea', 'researched', 'approved', 'discarded', 'writing', 'written')),
  research_data jsonb default '{}'::jsonb,
  blog_post_id uuid references blog_posts(id) on delete set null,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_blog_topics_status on blog_topics(status);

-- 3. SEO Pages
create table if not exists seo_pages (
  id uuid default gen_random_uuid() primary key,
  slug text not null,
  page_type text not null,
  title text not null,
  h1 text default '',
  meta_description text default '',
  keywords text default '',
  status text default 'draft' check (status in ('draft', 'needs-review', 'published')),
  scheduled_date date,
  content jsonb default '[]'::jsonb,
  data jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_seo_pages_status on seo_pages(status);
create index if not exists idx_seo_pages_type on seo_pages(page_type);

-- 4. Updated-at trigger function
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply trigger to tables (drop first to make re-runnable)
drop trigger if exists blog_topics_updated_at on blog_topics;
create trigger blog_topics_updated_at
  before update on blog_topics
  for each row execute function update_updated_at();

drop trigger if exists seo_pages_updated_at on seo_pages;
create trigger seo_pages_updated_at
  before update on seo_pages
  for each row execute function update_updated_at();

drop trigger if exists blog_posts_updated_at on blog_posts;
create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function update_updated_at();

-- 5. Row Level Security
alter table blog_posts enable row level security;
alter table blog_topics enable row level security;
alter table seo_pages enable row level security;

-- Drop existing policies if re-running
do $$ begin
  drop policy if exists "Auth users full access" on blog_posts;
  drop policy if exists "Public read published" on blog_posts;
  drop policy if exists "Auth users full access" on blog_topics;
  drop policy if exists "Auth users full access" on seo_pages;
exception when others then null;
end $$;

create policy "Auth users full access" on blog_posts
  for all using (auth.role() = 'authenticated');
create policy "Public read published" on blog_posts
  for select using (status = 'published');

create policy "Auth users full access" on blog_topics
  for all using (auth.role() = 'authenticated');

create policy "Auth users full access" on seo_pages
  for all using (auth.role() = 'authenticated');
`.trim();

/**
 * List of tables the CMS requires. Used to verify setup completed.
 */
export const REQUIRED_TABLES = ['blog_posts', 'blog_topics', 'seo_pages'];
