-- Blog topics table
-- Stores researched blog topic ideas with keyword data and SEO research.
-- Topics are created by Claude during research sessions and reviewed/approved in the CMS.

create table blog_topics (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  primary_keyword text not null,
  secondary_keywords text[] default '{}',
  search_volume integer default 0,
  keyword_difficulty integer default 0,
  cpc numeric(10,2) default 0,
  competition_level text default 'medium' check (competition_level in ('low', 'medium', 'high')),
  status text default 'researched' check (status in ('researched', 'approved', 'discarded', 'writing', 'written')),
  research_data jsonb default '{}'::jsonb,
  blog_post_id uuid references blog_posts(id) on delete set null,
  notes text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Indexes for common queries
create index idx_blog_topics_status on blog_topics(status);
create index idx_blog_topics_search_volume on blog_topics(search_volume desc);
create index idx_blog_topics_keyword_difficulty on blog_topics(keyword_difficulty);

-- Auto-update updated_at on row change
create or replace function update_blog_topics_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger blog_topics_updated_at
  before update on blog_topics
  for each row execute function update_blog_topics_updated_at();

-- Row Level Security
alter table blog_topics enable row level security;

-- Authenticated users (you / team) can do everything
create policy "Authenticated users can manage topics" on blog_topics
  for all using (auth.role() = 'authenticated');

-- No public access — topics are internal only
