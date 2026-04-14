/**
 * Site configuration
 *
 * In multi-tenant mode, config is stored in workspaces.settings JSONB.
 * In self-host mode (no workspace), falls back to localStorage.
 *
 * Every component reads config through getConfig() so overrides
 * take effect immediately without redeploying.
 */

// ---- EDIT THESE FOR YOUR BRAND ----
const defaults = {
  siteName: 'My Blog CMS',
  siteUrl: '',
  defaultAuthor: 'Author',
  cmsTitle: 'Moonify',
  blogPathPrefix: '/blog',
  youtubeChannel: '',
  pexelsApiKey: '',
  categories: ['General', 'How-To', 'Guide', 'Review', 'News', 'Tips'],
  pageTypes: [
    { value: 'landing', label: 'Landing Page', color: 'bg-blue-50 text-blue-700' },
    { value: 'comparison', label: 'Comparison', color: 'bg-purple-50 text-purple-700' },
    { value: 'guide', label: 'Guide', color: 'bg-amber-50 text-amber-700' },
  ],
};

const STORAGE_KEY = 'blog-cms-config';

// In-memory cache for workspace settings (avoids re-reading localStorage on every call)
let _workspaceSettings = null;

/**
 * Returns the merged config: defaults overridden by workspace settings or localStorage.
 */
export function getConfig() {
  if (_workspaceSettings) {
    return { ...defaults, ..._workspaceSettings };
  }
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    return { ...defaults, ...saved };
  } catch {
    return { ...defaults };
  }
}

/**
 * Persist user overrides to localStorage.
 * Only saves keys that differ from defaults so the object stays small.
 */
export function saveConfig(values) {
  const overrides = {};
  for (const key of Object.keys(defaults)) {
    if (values[key] !== undefined && values[key] !== defaults[key]) {
      overrides[key] = values[key];
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(overrides));
}

/**
 * Load workspace settings into the in-memory cache.
 * Called by WorkspaceContext after loading the workspace.
 */
export function setWorkspaceSettings(settings) {
  _workspaceSettings = settings && Object.keys(settings).length > 0 ? settings : null;
}

/**
 * Save config to workspace.settings JSONB in Supabase.
 * Returns the saved settings object.
 */
export async function saveWorkspaceConfig(supabase, workspaceId, values) {
  const overrides = {};
  for (const key of Object.keys(defaults)) {
    if (values[key] !== undefined && values[key] !== defaults[key]) {
      overrides[key] = values[key];
    }
  }

  const { error } = await supabase
    .from('workspaces')
    .update({ settings: overrides })
    .eq('id', workspaceId);

  if (error) throw error;

  // Update in-memory cache
  _workspaceSettings = Object.keys(overrides).length > 0 ? overrides : null;
  return overrides;
}

export { defaults as configDefaults };

// For backward-compat: default export returns the live config object
export default getConfig();
