-- Fix: owners must be able to read their own workspace immediately after creation
-- (before they're added as a workspace_member)
create policy "Owner can view own workspace" on workspaces
  for select using (owner_id = auth.uid());
