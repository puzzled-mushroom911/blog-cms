-- =============================================================
-- 010: Add workspace_id to existing tables + backfill
-- Adds workspace_id to blog_posts, blog_topics, seo_pages,
-- feedback, feedback_embeddings, preferences.
-- Backfills existing rows with a default workspace.
-- Updates RLS policies to scope by workspace membership.
-- =============================================================

-- Step 1: Add workspace_id columns as NULLABLE first
alter table blog_posts add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table blog_topics add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table seo_pages add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table feedback add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table feedback_embeddings add column if not exists workspace_id uuid references workspaces(id) on delete cascade;
alter table preferences add column if not exists workspace_id uuid references workspaces(id) on delete cascade;

-- Step 2: Backfill — assign existing rows to the first workspace found
-- (The app will create a default workspace for the existing user on first login)
do $$
declare
  default_ws uuid;
begin
  select id into default_ws from workspaces order by created_at asc limit 1;

  if default_ws is not null then
    update blog_posts set workspace_id = default_ws where workspace_id is null;
    update blog_topics set workspace_id = default_ws where workspace_id is null;
    update seo_pages set workspace_id = default_ws where workspace_id is null;
    update feedback set workspace_id = default_ws where workspace_id is null;
    update feedback_embeddings set workspace_id = default_ws where workspace_id is null;
    update preferences set workspace_id = default_ws where workspace_id is null;
  end if;
end $$;

-- Step 3: Set NOT NULL (only if a workspace exists — skip for fresh installs)
-- We use a DO block to conditionally apply the constraint
do $$
begin
  if exists (select 1 from workspaces limit 1) then
    alter table blog_posts alter column workspace_id set not null;
    alter table blog_topics alter column workspace_id set not null;
    alter table seo_pages alter column workspace_id set not null;
    alter table feedback alter column workspace_id set not null;
    alter table feedback_embeddings alter column workspace_id set not null;
    alter table preferences alter column workspace_id set not null;
  end if;
end $$;

-- Step 4: Add indexes
create index if not exists idx_blog_posts_workspace on blog_posts(workspace_id);
create index if not exists idx_blog_topics_workspace on blog_topics(workspace_id);
create index if not exists idx_seo_pages_workspace on seo_pages(workspace_id);
create index if not exists idx_feedback_workspace on feedback(workspace_id);
create index if not exists idx_feedback_embeddings_workspace on feedback_embeddings(workspace_id);
create index if not exists idx_preferences_workspace on preferences(workspace_id);

-- Step 5: Update RLS policies to scope by workspace membership
-- Helper: check if user is a member of a given workspace
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

-- Blog Posts
do $$ begin
  drop policy if exists "Auth users full access" on blog_posts;
  drop policy if exists "Public read published" on blog_posts;
  drop policy if exists "Workspace members full access" on blog_posts;
  drop policy if exists "Public read published posts" on blog_posts;
exception when others then null;
end $$;

create policy "Workspace members full access" on blog_posts
  for all using (is_workspace_member(workspace_id));

create policy "Public read published posts" on blog_posts
  for select using (status = 'published');

-- Blog Topics
do $$ begin
  drop policy if exists "Auth users full access" on blog_topics;
  drop policy if exists "Workspace members full access" on blog_topics;
exception when others then null;
end $$;

create policy "Workspace members full access" on blog_topics
  for all using (is_workspace_member(workspace_id));

-- SEO Pages
do $$ begin
  drop policy if exists "Auth users full access" on seo_pages;
  drop policy if exists "Workspace members full access" on seo_pages;
exception when others then null;
end $$;

create policy "Workspace members full access" on seo_pages
  for all using (is_workspace_member(workspace_id));

-- Feedback
do $$ begin
  drop policy if exists "Auth users full access" on feedback;
  drop policy if exists "Workspace members full access" on feedback;
exception when others then null;
end $$;

create policy "Workspace members full access" on feedback
  for all using (is_workspace_member(workspace_id));

-- Feedback Embeddings
do $$ begin
  drop policy if exists "Auth users full access" on feedback_embeddings;
  drop policy if exists "Workspace members full access" on feedback_embeddings;
exception when others then null;
end $$;

create policy "Workspace members full access" on feedback_embeddings
  for all using (is_workspace_member(workspace_id));

-- Preferences
do $$ begin
  drop policy if exists "Auth users full access" on preferences;
  drop policy if exists "Workspace members full access" on preferences;
exception when others then null;
end $$;

create policy "Workspace members full access" on preferences
  for all using (is_workspace_member(workspace_id));

-- Update query_feedback RPC to accept workspace_id
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
