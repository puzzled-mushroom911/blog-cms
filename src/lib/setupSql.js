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

-- =============================================================
-- Phase 2: Feedback Loop + Vector Embeddings
-- Adds: feedback, feedback_embeddings, preferences tables
-- Adds: original_content column to blog_posts
-- Adds: pgvector extension + HNSW index
-- Adds: query_feedback RPC function
-- =============================================================

-- Enable pgvector
create extension if not exists vector with schema extensions;

-- Add original_content to blog_posts
alter table blog_posts add column if not exists original_content jsonb default null;

-- Sources & AI reasoning (editorial transparency — CMS-only, not rendered on public site)
-- sources: [{url, title, type, note}] where type is "reddit", "youtube", "government", "news", "data", etc.
-- ai_reasoning: markdown explaining how the AI researched and structured the content
alter table blog_posts add column if not exists sources jsonb default '[]'::jsonb;
alter table blog_posts add column if not exists ai_reasoning text default '';

-- Feedback table — stores edit diffs
create table if not exists feedback (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references blog_posts(id) on delete cascade,
  block_index integer not null,
  block_type text not null,
  original_text text not null,
  edited_text text not null,
  context text not null default '',
  created_at timestamptz default now()
);

create index if not exists idx_feedback_post_id on feedback(post_id);

-- Feedback embeddings — vector store
create table if not exists feedback_embeddings (
  id bigint primary key generated always as identity,
  feedback_id uuid references feedback(id) on delete cascade,
  content text not null,
  embedding extensions.vector(384)
);

create index if not exists idx_feedback_embeddings_hnsw
  on feedback_embeddings using hnsw (embedding extensions.vector_ip_ops);

-- Preferences — global style rules
create table if not exists preferences (
  id uuid default gen_random_uuid() primary key,
  rule text not null,
  category text not null default 'tone' check (category in ('tone', 'structure', 'vocabulary', 'formatting')),
  active boolean default true,
  created_at timestamptz default now()
);

-- RLS
alter table feedback enable row level security;
alter table feedback_embeddings enable row level security;
alter table preferences enable row level security;

do $$ begin
  drop policy if exists "Auth users full access" on feedback;
  drop policy if exists "Auth users full access" on feedback_embeddings;
  drop policy if exists "Auth users full access" on preferences;
exception when others then null;
end $$;

create policy "Auth users full access" on feedback
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on feedback_embeddings
  for all using (auth.role() = 'authenticated');
create policy "Auth users full access" on preferences
  for all using (auth.role() = 'authenticated');

-- RPC function for vector similarity search
create or replace function query_feedback(
  query_embedding extensions.vector(384),
  match_threshold float default 0.7,
  match_count int default 10,
  ws_id uuid default null
)
returns table (
  content text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    fe.content,
    (1 - (fe.embedding <=> query_embedding))::float as similarity
  from feedback_embeddings fe
  where 1 - (fe.embedding <=> query_embedding) > match_threshold
    and (ws_id is null or fe.workspace_id = ws_id)
  order by fe.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- =============================================================
-- Phase 3: Multi-Tenant Workspaces
-- Adds: workspaces, workspace_members, api_keys tables
-- Adds: workspace_id to all content tables
-- Updates: RLS policies for workspace scoping
-- =============================================================

-- Workspaces
create table if not exists workspaces (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_workspaces_owner on workspaces(owner_id);
create index if not exists idx_workspaces_slug on workspaces(slug);

-- Workspace Members
create table if not exists workspace_members (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'editor' check (role in ('owner', 'editor', 'viewer')),
  created_at timestamptz default now(),
  unique (workspace_id, user_id)
);

create index if not exists idx_workspace_members_user on workspace_members(user_id);
create index if not exists idx_workspace_members_workspace on workspace_members(workspace_id);

-- API Keys
create table if not exists api_keys (
  id uuid default gen_random_uuid() primary key,
  workspace_id uuid not null references workspaces(id) on delete cascade,
  key_hash text not null,
  key_prefix text not null,
  name text not null default 'Untitled key',
  last_used_at timestamptz,
  created_at timestamptz default now()
);

create index if not exists idx_api_keys_workspace on api_keys(workspace_id);
create index if not exists idx_api_keys_hash on api_keys(key_hash);

-- Add workspace_id to existing content tables
alter table blog_posts add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table blog_topics add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table seo_pages add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table feedback add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table feedback_embeddings add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table preferences add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

create index if not exists idx_blog_posts_workspace on blog_posts(workspace_id);
create index if not exists idx_blog_topics_workspace on blog_topics(workspace_id);
create index if not exists idx_seo_pages_workspace on seo_pages(workspace_id);
create index if not exists idx_feedback_workspace on feedback(workspace_id);
create index if not exists idx_feedback_embeddings_workspace on feedback_embeddings(workspace_id);
create index if not exists idx_preferences_workspace on preferences(workspace_id);

-- RLS for new tables
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table api_keys enable row level security;

-- Helper function for workspace membership check
create or replace function is_workspace_member(ws_id uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Workspaces policies
do $$ begin
  drop policy if exists "Members can view workspace" on workspaces;
  drop policy if exists "Owner can update workspace" on workspaces;
  drop policy if exists "Authenticated can create workspace" on workspaces;
exception when others then null;
end $$;

create policy "Members can view workspace" on workspaces
  for select using (
    id in (select workspace_id from workspace_members where user_id = auth.uid())
  );
create policy "Owner can update workspace" on workspaces
  for update using (owner_id = auth.uid());
create policy "Authenticated can create workspace" on workspaces
  for insert with check (auth.role() = 'authenticated');

-- Workspace Members policies
do $$ begin
  drop policy if exists "Members can view members" on workspace_members;
  drop policy if exists "Owner can manage members" on workspace_members;
exception when others then null;
end $$;

create policy "Members can view members" on workspace_members
  for select using (
    workspace_id in (select workspace_id from workspace_members wm where wm.user_id = auth.uid())
  );
create policy "Owner can manage members" on workspace_members
  for all using (
    workspace_id in (select id from workspaces where owner_id = auth.uid())
  );

-- API Keys policies
do $$ begin
  drop policy if exists "Members can view keys" on api_keys;
  drop policy if exists "Members can manage keys" on api_keys;
exception when others then null;
end $$;

create policy "Members can view keys" on api_keys
  for select using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );
create policy "Members can manage keys" on api_keys
  for all using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

-- Update content table RLS to scope by workspace
do $$ begin
  drop policy if exists "Auth users full access" on blog_posts;
  drop policy if exists "Public read published" on blog_posts;
  drop policy if exists "Auth users full access" on blog_topics;
  drop policy if exists "Auth users full access" on seo_pages;
  drop policy if exists "Auth users full access" on feedback;
  drop policy if exists "Auth users full access" on feedback_embeddings;
  drop policy if exists "Auth users full access" on preferences;
exception when others then null;
end $$;

create policy "Workspace members full access" on blog_posts
  for all using (is_workspace_member(workspace_id));
create policy "Public read published posts" on blog_posts
  for select using (status = 'published');

create policy "Workspace members full access" on blog_topics
  for all using (is_workspace_member(workspace_id));

create policy "Workspace members full access" on seo_pages
  for all using (is_workspace_member(workspace_id));

create policy "Workspace members full access" on feedback
  for all using (is_workspace_member(workspace_id));

create policy "Workspace members full access" on feedback_embeddings
  for all using (is_workspace_member(workspace_id));

create policy "Workspace members full access" on preferences
  for all using (is_workspace_member(workspace_id));
`.trim();

/**
 * List of tables the CMS requires. Used to verify setup completed.
 */
export const REQUIRED_TABLES = ['blog_posts', 'blog_topics', 'seo_pages', 'feedback', 'feedback_embeddings', 'preferences', 'workspaces', 'workspace_members', 'api_keys'];
