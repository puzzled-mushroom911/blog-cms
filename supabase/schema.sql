-- Blog CMS — Complete Database Schema
-- Run this in your Supabase SQL Editor to set up everything the CMS needs.
-- https://github.com/puzzled-mushroom911/blog-cms

-- ============================================================
-- Extensions
-- ============================================================

create extension if not exists "pgvector" with schema extensions;

-- ============================================================
-- Helper Functions
-- ============================================================

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  NEW.updated_at = now();
  return NEW;
end;
$$;

-- ============================================================
-- 1. Profiles (auto-created on signup)
-- ============================================================

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text,
  avatar_url  text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "Anyone can read profiles"    on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function update_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (NEW.id, NEW.raw_user_meta_data->>'full_name')
  on conflict (id) do nothing;
  return NEW;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 2. Workspaces (multi-tenant)
-- ============================================================

create table public.workspaces (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  slug       text not null unique,
  owner_id   uuid not null references auth.users on delete cascade,
  settings   jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

alter table public.workspaces enable row level security;

create table public.workspace_members (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  user_id      uuid not null references auth.users on delete cascade,
  role         text not null default 'editor',
  created_at   timestamptz default now(),
  unique (workspace_id, user_id)
);

alter table public.workspace_members enable row level security;

-- Helper: check if the current user is a member of a workspace
create or replace function public.is_workspace_member(ws_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1 from workspace_members
    where workspace_id = ws_id and user_id = auth.uid()
  );
$$;

-- Workspace policies
create policy "Authenticated can create workspace" on public.workspaces
  for insert with check (auth.role() = 'authenticated');
create policy "Owner can view own workspace" on public.workspaces
  for select using (owner_id = auth.uid());
create policy "Members can view workspace" on public.workspaces
  for select using (is_workspace_member(id));
create policy "Owner can update workspace" on public.workspaces
  for update using (owner_id = auth.uid());

-- Workspace member policies
create policy "Members can view own memberships" on public.workspace_members
  for select using (user_id = auth.uid());
create policy "Owner can manage members" on public.workspace_members
  for all using (workspace_id in (
    select id from workspaces where owner_id = auth.uid()
  ));

-- ============================================================
-- 3. Blog Posts
-- ============================================================

create table public.blog_posts (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  title            text not null,
  excerpt          text not null,
  date             date not null,
  read_time        text not null,
  author           text not null default 'Author',
  category         text not null,
  tags             text[] not null default '{}',
  youtube_id       text,
  video_duration   text,
  image            text not null,
  meta_description text not null,
  keywords         text not null default '',
  content          jsonb not null default '[]',
  status           text not null default 'draft',
  editor_notes     jsonb default '[]',
  original_content jsonb,
  sources          jsonb default '[]',
  ai_reasoning     text default '',
  workspace_id     uuid references public.workspaces on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.blog_posts enable row level security;

create trigger blog_posts_updated_at before update on public.blog_posts
  for each row execute function update_updated_at();

-- Public can read published posts (for your website's anon key)
create policy "Public read published posts" on public.blog_posts
  for select using (status = 'published');
-- Workspace members get full access
create policy "Workspace members full access" on public.blog_posts
  for all using (is_workspace_member(workspace_id));
-- Authenticated users can insert (for Claude Code / MCP writes)
create policy "Authenticated users can insert" on public.blog_posts
  for insert to authenticated with check (true);
-- Authenticated users can read all posts (for CMS dashboard)
create policy "Authenticated users can read all" on public.blog_posts
  for select to authenticated using (true);
-- Authenticated users can update (for CMS editor)
create policy "Authenticated users can update" on public.blog_posts
  for update to authenticated with check (true);

-- ============================================================
-- 4. Blog Post Relations (internal linking)
-- ============================================================

create table public.blog_post_relations (
  id        serial primary key,
  from_slug text not null,
  to_slug   text not null,
  created_at timestamptz default now(),
  unique (from_slug, to_slug)
);

alter table public.blog_post_relations enable row level security;

create policy "Public can read relations" on public.blog_post_relations
  for select to anon using (true);
create policy "Authenticated can manage relations" on public.blog_post_relations
  for all to authenticated using (true) with check (true);

-- ============================================================
-- 5. Blog Topics (content pipeline)
-- ============================================================

create table public.blog_topics (
  id                  uuid primary key default gen_random_uuid(),
  title               text not null,
  primary_keyword     text not null,
  secondary_keywords  text[] default '{}',
  search_volume       integer default 0,
  keyword_difficulty  integer default 0,
  cpc                 numeric(10,2) default 0,
  competition_level   text default 'medium',
  status              text default 'researched',
  research_data       jsonb default '{}',
  blog_post_id        uuid references public.blog_posts on delete set null,
  seo_page_id         uuid,
  notes               text default '',
  workflow_type       text default 'editorial',
  workspace_id        uuid references public.workspaces on delete set null,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

alter table public.blog_topics enable row level security;

create trigger blog_topics_updated_at before update on public.blog_topics
  for each row execute function update_updated_at();

create policy "Authenticated users can manage topics" on public.blog_topics
  for all using (auth.role() = 'authenticated');
create policy "Workspace members full access" on public.blog_topics
  for all using (is_workspace_member(workspace_id));

-- ============================================================
-- 6. SEO Pages (programmatic pages)
-- ============================================================

create table public.seo_pages (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique,
  page_type        text not null,
  title            text not null,
  h1               text not null default '',
  meta_description text not null default '',
  keywords         text default '',
  data             jsonb default '{}',
  content          jsonb default '[]',
  internal_links   jsonb default '[]',
  status           text default 'draft',
  scheduled_date   date,
  workspace_id     uuid references public.workspaces on delete set null,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

alter table public.seo_pages enable row level security;

create trigger seo_pages_updated_at before update on public.seo_pages
  for each row execute function update_updated_at();

create policy "Public can read published seo_pages" on public.seo_pages
  for select using (status = 'published');
create policy "Authenticated users can manage seo_pages" on public.seo_pages
  for all using (auth.role() = 'authenticated');
create policy "Workspace members full access" on public.seo_pages
  for all using (is_workspace_member(workspace_id));

-- Add FK from blog_topics after seo_pages exists
alter table public.blog_topics
  add constraint blog_topics_seo_page_id_fkey
  foreign key (seo_page_id) references public.seo_pages on delete set null;

-- ============================================================
-- 7. Editorial Research
-- ============================================================

create table public.editorial_research (
  id              uuid primary key default gen_random_uuid(),
  source_type     text not null,
  source_name     text not null default '',
  source_url      text default '',
  title           text not null,
  summary         text not null,
  raw_content     text default '',
  tags            text[] default '{}',
  relevance_score integer default 50,
  used_in_post_id uuid references public.blog_posts on delete set null,
  created_at      timestamptz default now()
);

alter table public.editorial_research enable row level security;

create policy "Authenticated users can manage editorial_research" on public.editorial_research
  for all using (auth.role() = 'authenticated');

-- ============================================================
-- 8. CMS Block Comments (inline editorial comments)
-- ============================================================

create table public.cms_block_comments (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid references public.blog_posts on delete cascade,
  block_index  integer not null,
  comment_text text not null,
  status       text not null default 'open',
  created_by   uuid references auth.users on delete set null,
  created_at   timestamptz default now()
);

alter table public.cms_block_comments enable row level security;

create policy "Authenticated users can manage comments" on public.cms_block_comments
  for all to authenticated using (true) with check (true);

-- ============================================================
-- 9. Feedback (learning from your edits)
-- ============================================================

create table public.feedback (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid references public.blog_posts on delete set null,
  block_index   integer not null,
  block_type    text not null,
  original_text text not null,
  edited_text   text not null,
  context       text not null default '',
  workspace_id  uuid references public.workspaces on delete set null,
  created_at    timestamptz default now()
);

alter table public.feedback enable row level security;

create policy "Workspace members full access" on public.feedback
  for all using (is_workspace_member(workspace_id));
create policy "Authenticated can insert feedback" on public.feedback
  for insert to authenticated with check (true);

-- ============================================================
-- 10. Feedback Embeddings (vector search for style learning)
-- ============================================================

create table public.feedback_embeddings (
  id           bigint generated always as identity primary key,
  feedback_id  uuid references public.feedback on delete cascade,
  content      text not null,
  embedding    extensions.vector(384),
  workspace_id uuid references public.workspaces on delete set null
);

alter table public.feedback_embeddings enable row level security;

create policy "Workspace members full access" on public.feedback_embeddings
  for all using (is_workspace_member(workspace_id));

-- Semantic search function for feedback
create or replace function public.query_feedback(
  query_embedding extensions.vector,
  match_threshold float default 0.7,
  match_count int default 10,
  ws_id uuid default null
)
returns table (content text, similarity float) language plpgsql as $$
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

-- ============================================================
-- 11. Preferences (global style rules)
-- ============================================================

create table public.preferences (
  id           uuid primary key default gen_random_uuid(),
  rule         text not null,
  category     text not null default 'tone',
  active       boolean default true,
  workspace_id uuid references public.workspaces on delete set null,
  created_at   timestamptz default now()
);

alter table public.preferences enable row level security;

create policy "Workspace members full access" on public.preferences
  for all using (is_workspace_member(workspace_id));

-- ============================================================
-- 12. API Keys (for MCP server access)
-- ============================================================

create table public.api_keys (
  id           uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces on delete cascade,
  key_hash     text not null,
  key_prefix   text not null,
  name         text not null default 'Untitled key',
  last_used_at timestamptz,
  created_at   timestamptz default now()
);

alter table public.api_keys enable row level security;

create policy "Members can view keys" on public.api_keys
  for select using (workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));
create policy "Members can manage keys" on public.api_keys
  for all using (workspace_id in (
    select workspace_id from workspace_members where user_id = auth.uid()
  ));

-- ============================================================
-- Done! Your CMS database is ready.
-- ============================================================
