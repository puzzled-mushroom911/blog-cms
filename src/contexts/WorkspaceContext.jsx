import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { useConnection } from './ConnectionContext';
import { setWorkspaceSettings } from '../config';

const WorkspaceContext = createContext(null);

export function WorkspaceProvider({ children }) {
  const { user } = useAuth();
  const { supabase, connected } = useConnection();
  const [workspace, setWorkspace] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadWorkspace = useCallback(async () => {
    if (!supabase || !user) {
      setWorkspace(null);
      setLoading(false);
      return;
    }

    setLoading(true);

    // Find workspaces the user belongs to
    const { data: memberships, error: memberError } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id);

    if (memberError || !memberships || memberships.length === 0) {
      // No workspace found — try creating a default one (self-host migration)
      const defaultWs = await ensureDefaultWorkspace(supabase, user);
      setWorkspace(defaultWs);
      setWorkspaceSettings(defaultWs?.settings ?? null);
      setLoading(false);
      return;
    }

    // Load the first workspace (multi-workspace switching comes later)
    const { data: ws, error: wsError } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', memberships[0].workspace_id)
      .single();

    if (wsError || !ws) {
      setWorkspace(null);
      setWorkspaceSettings(null);
    } else {
      setWorkspace({ ...ws, role: memberships[0].role });
      setWorkspaceSettings(ws.settings);
    }

    setLoading(false);
  }, [supabase, user]);

  useEffect(() => {
    if (connected && user) {
      loadWorkspace();
    } else {
      setWorkspace(null);
      setWorkspaceSettings(null);
      setLoading(false);
    }
  }, [connected, user, loadWorkspace]);

  return (
    <WorkspaceContext.Provider value={{ workspace, workspaceId: workspace?.id ?? null, loading, reload: loadWorkspace }}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspace must be used within WorkspaceProvider');
  return context;
}

/**
 * For self-host users upgrading from single-tenant: create a default workspace
 * and assign existing data to it.
 */
async function ensureDefaultWorkspace(supabase, user) {
  // Generate a unique slug from the user's ID
  const shortId = user.id.split('-')[0];
  const slug = `workspace-${shortId}`;

  const { data: ws, error: createError } = await supabase
    .from('workspaces')
    .insert({
      name: 'My Workspace',
      slug,
      owner_id: user.id,
    })
    .select()
    .single();

  if (createError) {
    // Workspace might already exist — try to find it
    const { data: existing } = await supabase
      .from('workspaces')
      .select('*')
      .eq('owner_id', user.id)
      .limit(1)
      .single();

    if (existing) {
      // Ensure membership exists
      await supabase
        .from('workspace_members')
        .upsert({
          workspace_id: existing.id,
          user_id: user.id,
          role: 'owner',
        }, { onConflict: 'workspace_id,user_id' });

      return { ...existing, role: 'owner' };
    }
    return null;
  }

  // Add membership
  await supabase
    .from('workspace_members')
    .insert({
      workspace_id: ws.id,
      user_id: user.id,
      role: 'owner',
    });

  return { ...ws, role: 'owner' };
}
