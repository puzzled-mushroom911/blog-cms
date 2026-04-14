-- =============================================================
-- 009: Multi-Tenant Workspaces
-- Creates workspaces, workspace_members, and api_keys tables.
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

-- RLS
alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table api_keys enable row level security;

-- Workspaces: users can see workspaces they belong to
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

-- Workspace Members: users can see members of their workspaces
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

-- API Keys: workspace members can manage keys
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
