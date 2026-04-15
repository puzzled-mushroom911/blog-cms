-- Migration 013: Fix overly permissive RLS policies
--
-- Problem: Several tables have policies that allow ANY authenticated user to
-- read/write data from ANY workspace. This breaks multi-tenant isolation.
--
-- Fix: Drop the permissive policies and replace with workspace-scoped ones.
-- The existing "Workspace members full access" policies remain unchanged.

-- ============================================================
-- 1. blog_posts — remove overly permissive authenticated policies
-- ============================================================

-- Keep: "Public read published posts" (anon users need this for the website)
-- Keep: "Workspace members full access" (correct — scoped to workspace)
-- Drop: The three permissive authenticated policies

drop policy if exists "Authenticated users can insert" on public.blog_posts;
drop policy if exists "Authenticated users can read all" on public.blog_posts;
drop policy if exists "Authenticated users can update" on public.blog_posts;

-- Replace with workspace-scoped insert policy
-- (needed for MCP/API writes — must specify a workspace_id they belong to)
create policy "Workspace members can insert posts" on public.blog_posts
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

-- ============================================================
-- 2. blog_topics — replace permissive policy
-- ============================================================

drop policy if exists "Authenticated users can manage topics" on public.blog_topics;

-- The existing "Workspace members full access" policy handles read/update/delete.
-- Add explicit insert policy for workspace members.
create policy "Workspace members can insert topics" on public.blog_topics
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

-- ============================================================
-- 3. seo_pages — replace permissive policy
-- ============================================================

drop policy if exists "Authenticated users can manage seo_pages" on public.seo_pages;

create policy "Workspace members can insert seo_pages" on public.seo_pages
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

-- ============================================================
-- 4. editorial_research — add workspace_id and scope policies
-- ============================================================

-- Add workspace_id column if not exists
do $$ begin
  alter table public.editorial_research
    add column workspace_id uuid references public.workspaces on delete set null;
exception when duplicate_column then null;
end $$;

drop policy if exists "Authenticated users can manage editorial_research" on public.editorial_research;

create policy "Workspace members full access" on public.editorial_research
  for all using (is_workspace_member(workspace_id));

create policy "Workspace members can insert research" on public.editorial_research
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

-- ============================================================
-- 5. cms_block_comments — scope through post's workspace
-- ============================================================

drop policy if exists "Authenticated users can manage comments" on public.cms_block_comments;

-- Scope through the post's workspace_id
create policy "Workspace members can manage comments" on public.cms_block_comments
  for all to authenticated
  using (
    post_id in (
      select id from blog_posts where is_workspace_member(workspace_id)
    )
  )
  with check (
    post_id in (
      select id from blog_posts where is_workspace_member(workspace_id)
    )
  );

-- ============================================================
-- 6. blog_post_relations — scope through post slugs
-- ============================================================

drop policy if exists "Authenticated can manage relations" on public.blog_post_relations;

-- Keep anon read for public site
-- Scope write access through from_slug belonging to user's workspace
create policy "Workspace members can manage relations" on public.blog_post_relations
  for all to authenticated
  using (
    from_slug in (
      select slug from blog_posts where is_workspace_member(workspace_id)
    )
  )
  with check (
    from_slug in (
      select slug from blog_posts where is_workspace_member(workspace_id)
    )
  );

-- ============================================================
-- 7. feedback — tighten insert policy
-- ============================================================

drop policy if exists "Authenticated can insert feedback" on public.feedback;

create policy "Workspace members can insert feedback" on public.feedback
  for insert to authenticated
  with check (is_workspace_member(workspace_id));

-- ============================================================
-- Done. All data is now scoped to workspace membership.
-- ============================================================
