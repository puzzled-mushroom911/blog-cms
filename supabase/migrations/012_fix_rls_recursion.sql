-- Fix infinite recursion in workspace/workspace_members policies
-- Problem: workspaces SELECT → subquery on workspace_members → workspace_members SELECT → subquery on workspace_members → ∞

-- 1. Fix workspace_members: just check user_id directly (no subquery needed)
drop policy if exists "Members can view members" on workspace_members;
create policy "Members can view own memberships" on workspace_members
  for select using (user_id = auth.uid());

-- 2. Fix workspaces: use SECURITY DEFINER function (bypasses RLS on inner query)
drop policy if exists "Members can view workspace" on workspaces;
create policy "Members can view workspace" on workspaces
  for select using (is_workspace_member(id));
