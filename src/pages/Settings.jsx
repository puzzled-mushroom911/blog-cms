import { useState, useEffect } from 'react';
import { getConfig, saveConfig, saveWorkspaceConfig } from '../config';
import { toast } from 'sonner';
import { Save, RotateCcw, Database, Unplug, Trash2, Plus, BookOpen, Power, PowerOff, Loader2, Key, Copy, CheckCircle, Eye, EyeOff, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnection } from '../contexts/ConnectionContext';
import { useWorkspace } from '../contexts/WorkspaceContext';
import { useNavigate } from 'react-router-dom';
import { getStoredConnection } from '../lib/supabase';
import { useSupabase } from '../hooks/useSupabase';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

export default function Settings() {
  const [values, setValues] = useState(getConfig);
  const { disconnect } = useConnection();
  const { workspaceId } = useWorkspace();
  const navigate = useNavigate();
  const connection = getStoredConnection();

  const supabase = useSupabase();
  const [preferences, setPreferences] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState('tone');
  const [addingRule, setAddingRule] = useState(false);

  // API Keys state
  const [apiKeys, setApiKeys] = useState([]);
  const [loadingKeys, setLoadingKeys] = useState(true);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingKey, setCreatingKey] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);
  const [copiedKey, setCopiedKey] = useState(false);

  useEffect(() => {
    loadPreferences();
    loadApiKeys();
  }, []);

  async function loadPreferences() {
    setLoadingPrefs(true);
    let query = supabase
      .from('preferences')
      .select('*')
      .order('created_at', { ascending: true });
    if (workspaceId) query = query.eq('workspace_id', workspaceId);
    const { data } = await query;
    setPreferences(data || []);
    setLoadingPrefs(false);
  }

  async function handleAddRule() {
    const trimmed = newRule.trim();
    if (!trimmed) return;
    setAddingRule(true);
    const row = { rule: trimmed, category: newCategory };
    if (workspaceId) row.workspace_id = workspaceId;
    const { data, error } = await supabase
      .from('preferences')
      .insert(row)
      .select()
      .single();
    setAddingRule(false);
    if (error) {
      toast.error('Failed to add rule: ' + error.message);
    } else {
      setPreferences((prev) => [...prev, data]);
      setNewRule('');
      toast.success('Rule added');
    }
  }

  async function handleToggleRule(id, currentActive) {
    const { error } = await supabase
      .from('preferences')
      .update({ active: !currentActive })
      .eq('id', id);
    if (error) {
      toast.error('Failed to update rule');
    } else {
      setPreferences((prev) =>
        prev.map((p) => (p.id === id ? { ...p, active: !currentActive } : p))
      );
    }
  }

  async function handleDeleteRule(id) {
    const { error } = await supabase
      .from('preferences')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete rule');
    } else {
      setPreferences((prev) => prev.filter((p) => p.id !== id));
      toast.success('Rule deleted');
    }
  }

  async function loadApiKeys() {
    if (!workspaceId) { setLoadingKeys(false); return; }
    setLoadingKeys(true);
    const { data } = await supabase
      .from('api_keys')
      .select('id, key_prefix, name, last_used_at, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    setApiKeys(data || []);
    setLoadingKeys(false);
  }

  async function handleCreateApiKey() {
    const name = newKeyName.trim() || 'Untitled key';
    setCreatingKey(true);

    // Generate key: sk_live_ + 32 hex chars
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    const fullKey = `sk_live_${hex}`;
    const prefix = fullKey.slice(0, 16);

    // Hash the key with SHA-256
    const encoder = new TextEncoder();
    const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(fullKey));
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const { data, error } = await supabase
      .from('api_keys')
      .insert({ workspace_id: workspaceId, key_hash: keyHash, key_prefix: prefix, name })
      .select()
      .single();

    setCreatingKey(false);
    if (error) {
      toast.error('Failed to create key: ' + error.message);
    } else {
      setApiKeys(prev => [data, ...prev]);
      setNewlyCreatedKey(fullKey);
      setNewKeyName('');
      toast.success('API key created');
    }
  }

  async function handleDeleteApiKey(id) {
    const { error } = await supabase
      .from('api_keys')
      .delete()
      .eq('id', id);
    if (error) {
      toast.error('Failed to delete key');
    } else {
      setApiKeys(prev => prev.filter(k => k.id !== id));
      toast.success('Key deleted');
    }
  }

  async function handleCopyNewKey() {
    if (!newlyCreatedKey) return;
    await navigator.clipboard.writeText(newlyCreatedKey);
    setCopiedKey(true);
    toast.success('Key copied to clipboard');
    setTimeout(() => setCopiedKey(false), 3000);
  }

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    if (workspaceId) {
      try {
        await saveWorkspaceConfig(supabase, workspaceId, values);
        toast.success('Settings saved to workspace');
      } catch (err) {
        toast.error('Failed to save: ' + err.message);
        return;
      }
    } else {
      saveConfig(values);
      toast.success('Settings saved');
    }
  }

  function handleReset() {
    localStorage.removeItem('blog-cms-config');
    setValues(getConfig());
    toast.success('Settings reset to defaults');
  }

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          Configure your brand and site details.{' '}
          {workspaceId ? 'Changes are saved to your workspace.' : 'Changes are saved to your browser.'}
        </p>
      </div>

      {/* Database Connection */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-emerald-600" />
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Database Connection</h2>
            <p className="text-xs text-slate-500">Connected to your Supabase project</p>
          </div>
        </div>
        <div className="bg-slate-50 rounded-lg px-4 py-3 mb-4">
          <p className="text-xs text-slate-400 mb-0.5">Project URL</p>
          <p className="text-sm text-slate-700 font-mono">{connection?.url || 'Unknown'}</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (window.confirm('Disconnect from this database? You will be signed out and redirected to the connection page.')) {
              disconnect();
              navigate('/connect');
            }
          }}
        >
          <Unplug className="w-3.5 h-3.5" />
          Disconnect
        </Button>
      </div>

      {/* Content Preferences */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <BookOpen className="w-5 h-5 text-violet-600" />
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Content Preferences</h2>
            <p className="text-xs text-slate-500">Style rules for AI-generated content. Loaded into every generation prompt.</p>
          </div>
        </div>

        {loadingPrefs ? (
          <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading preferences...
          </div>
        ) : (
          <>
            {/* Existing rules */}
            {preferences.length > 0 ? (
              <div className="space-y-2 mb-4">
                {preferences.map((pref) => (
                  <div
                    key={pref.id}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                      pref.active
                        ? 'bg-white border-slate-200'
                        : 'bg-slate-50 border-slate-100 opacity-60'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${pref.active ? 'text-slate-700' : 'text-slate-400 line-through'}`}>
                        {pref.rule}
                      </p>
                      <Badge variant="secondary" className="mt-1.5 text-[10px]">
                        {pref.category}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => handleToggleRule(pref.id, pref.active)}
                        title={pref.active ? 'Disable rule' : 'Enable rule'}
                      >
                        {pref.active ? (
                          <Power className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <PowerOff className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteRule(pref.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400 mb-4">
                No rules yet. Add rules like &quot;Never use the word vibrant&quot; or &quot;Lead with data, not adjectives.&quot;
              </p>
            )}

            {/* Add new rule */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Input
                  type="text"
                  value={newRule}
                  onChange={(e) => setNewRule(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newRule.trim()) handleAddRule();
                  }}
                  placeholder="e.g. Never use the word vibrant"
                />
              </div>
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                className="h-9 px-2 text-xs border border-slate-200 rounded-md bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="tone">Tone</option>
                <option value="structure">Structure</option>
                <option value="vocabulary">Vocabulary</option>
                <option value="formatting">Formatting</option>
              </select>
              <Button
                size="sm"
                onClick={handleAddRule}
                disabled={!newRule.trim() || addingRule}
              >
                <Plus className="w-3.5 h-3.5" />
                Add
              </Button>
            </div>
          </>
        )}
      </div>

      {/* Content Pipeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Lightbulb className="w-5 h-5 text-indigo-600" />
          <div>
            <h2 className="font-semibold text-slate-900 text-sm">Content Pipeline</h2>
            <p className="text-xs text-slate-500">Advanced topic research and keyword management</p>
          </div>
        </div>
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={values.showContentPipeline}
            onChange={() => handleChange('showContentPipeline', !values.showContentPipeline)}
            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
          />
          <span className="text-sm text-slate-700">Show Content Pipeline in sidebar</span>
        </label>
        <p className="text-xs text-slate-400 mt-2">
          When enabled, adds the Content Pipeline to the sidebar for manual topic research, keyword analysis, and content planning. When disabled, Claude automatically selects the best topics for your market.
        </p>
      </div>

      {/* API Keys */}
      {workspaceId && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Key className="w-5 h-5 text-amber-600" />
            <div>
              <h2 className="font-semibold text-slate-900 text-sm">API Keys</h2>
              <p className="text-xs text-slate-500">Keys for the REST API and MCP server. Scoped to this workspace.</p>
            </div>
          </div>

          {/* Newly created key banner */}
          {newlyCreatedKey && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
              <p className="text-xs font-semibold text-emerald-800 mb-1">
                Save this key — you won't see it again
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs bg-white px-3 py-1.5 rounded border border-emerald-200 text-emerald-900 font-mono break-all">
                  {newlyCreatedKey}
                </code>
                <Button variant="outline" size="sm" onClick={handleCopyNewKey}>
                  {copiedKey ? <CheckCircle className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedKey ? 'Copied' : 'Copy'}
                </Button>
              </div>
              <div className="mt-3 pt-3 border-t border-emerald-200">
                <p className="text-xs font-semibold text-emerald-800 mb-1.5">
                  Claude Code MCP config
                </p>
                <p className="text-[11px] text-emerald-700 mb-2">
                  Add this to <code className="bg-white px-1 rounded">~/.claude/mcp.json</code> to give Claude Code full CMS access:
                </p>
                <pre className="text-[11px] bg-white p-3 rounded border border-emerald-200 text-emerald-900 font-mono overflow-x-auto whitespace-pre">{JSON.stringify({
  mcpServers: {
    'moonify-cms': {
      type: 'streamable-http',
      url: `${window.location.origin}/api/mcp`,
      headers: { Authorization: `Bearer ${newlyCreatedKey}` },
    },
  },
}, null, 2)}</pre>
              </div>
              <button
                className="text-xs text-emerald-600 hover:text-emerald-800 mt-2"
                onClick={() => setNewlyCreatedKey(null)}
              >
                Dismiss
              </button>
            </div>
          )}

          {loadingKeys ? (
            <div className="flex items-center gap-2 text-sm text-slate-400 py-4 justify-center">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading keys...
            </div>
          ) : (
            <>
              {apiKeys.length > 0 && (
                <div className="space-y-2 mb-4">
                  {apiKeys.map((key) => (
                    <div key={key.id} className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 bg-white">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700">{key.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{key.key_prefix}...</p>
                        <div className="flex gap-3 mt-1">
                          <span className="text-[10px] text-slate-400">
                            Created {new Date(key.created_at).toLocaleDateString()}
                          </span>
                          {key.last_used_at && (
                            <span className="text-[10px] text-slate-400">
                              Last used {new Date(key.last_used_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-slate-400 hover:text-red-600 hover:bg-red-50"
                        onClick={() => handleDeleteApiKey(key.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateApiKey();
                    }}
                    placeholder="Key name (e.g. My Claude Code key)"
                  />
                </div>
                <Button size="sm" onClick={handleCreateApiKey} disabled={creatingKey}>
                  {creatingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Generate
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        {/* Site name */}
        <Field
          label="Site / Brand Name"
          description="Displayed in the sidebar and login screen"
          value={values.siteName}
          onChange={(v) => handleChange('siteName', v)}
        />

        {/* CMS title */}
        <Field
          label="CMS Title"
          description="The name shown in the header bar"
          value={values.cmsTitle}
          onChange={(v) => handleChange('cmsTitle', v)}
        />

        {/* Default author */}
        <Field
          label="Default Author"
          description="Used as the default author for new posts"
          value={values.defaultAuthor}
          onChange={(v) => handleChange('defaultAuthor', v)}
        />

        {/* Site URL */}
        <Field
          label="Website URL"
          description="Your public website where blog posts are published"
          value={values.siteUrl}
          onChange={(v) => handleChange('siteUrl', v)}
          placeholder="https://yourdomain.com"
        />

        {/* Blog path prefix */}
        <Field
          label="Blog Path Prefix"
          description="The URL path where posts live on your site (e.g. /blog)"
          value={values.blogPathPrefix}
          onChange={(v) => handleChange('blogPathPrefix', v)}
          placeholder="/blog"
        />

        {/* Categories */}
        <div>
          <Label className="text-sm text-slate-700 mb-1">
            Blog Categories
          </Label>
          <p className="text-xs text-slate-400 mb-1.5">
            Comma-separated list of categories for blog posts
          </p>
          <Input
            type="text"
            value={(values.categories || []).join(', ')}
            onChange={(e) =>
              handleChange(
                'categories',
                e.target.value.split(',').map((s) => s.trim()).filter(Boolean)
              )
            }
            placeholder="General, How-To, Guide, Review"
          />
        </div>

        {/* SEO Page Types */}
        <div>
          <Label className="text-sm text-slate-700 mb-1">
            SEO Page Types
          </Label>
          <p className="text-xs text-slate-400 mb-1.5">
            One per line, format: <code className="bg-slate-100 px-1 rounded">slug: Display Name</code>
          </p>
          <Textarea
            value={(values.pageTypes || []).map((t) => `${t.value}: ${t.label}`).join('\n')}
            onChange={(e) => {
              const colors = [
                'bg-blue-50 text-blue-700',
                'bg-purple-50 text-purple-700',
                'bg-amber-50 text-amber-700',
                'bg-emerald-50 text-emerald-700',
                'bg-rose-50 text-rose-700',
                'bg-cyan-50 text-cyan-700',
              ];
              const types = e.target.value
                .split('\n')
                .map((line) => line.trim())
                .filter(Boolean)
                .map((line, i) => {
                  const [value, ...rest] = line.split(':');
                  const label = rest.join(':').trim() || value.trim();
                  return {
                    value: value.trim().toLowerCase().replace(/\s+/g, '-'),
                    label,
                    color: colors[i % colors.length],
                  };
                });
              handleChange('pageTypes', types);
            }}
            rows={5}
            placeholder={"landing: Landing Page\ncomparison: Comparison\nguide: Guide"}
            className="font-mono resize-none"
          />
        </div>

        {/* YouTube channel */}
        <Field
          label="YouTube Channel URL"
          description="Optional. Link to your YouTube channel for reference."
          value={values.youtubeChannel}
          onChange={(v) => handleChange('youtubeChannel', v)}
          placeholder="https://youtube.com/@yourchannel"
        />

        {/* Integrations divider */}
        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
            Integrations
          </p>
        </div>

        {/* Pexels API Key */}
        <div>
          <Label className="text-sm text-slate-700 mb-1">
            Pexels API Key
          </Label>
          <p className="text-xs text-slate-400 mb-1.5">
            Enables stock image search in the post editor.{' '}
            <a
              href="https://www.pexels.com/api/new/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-600"
            >
              Get a free key
            </a>
          </p>
          <Input
            type="password"
            value={values.pexelsApiKey || ''}
            onChange={(e) => handleChange('pexelsApiKey', e.target.value)}
            placeholder="Enter your Pexels API key"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
          <Button onClick={handleSave}>
            <Save className="w-4 h-4" />
            Save Settings
          </Button>
          <Button variant="outline" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
            Reset to Defaults
          </Button>
        </div>
      </div>

      {/* Current config preview */}
      <div className="mt-6">
        <details className="group">
          <summary className="text-xs font-medium text-slate-400 cursor-pointer hover:text-slate-600 transition-colors">
            View current configuration (JSON)
          </summary>
          <pre className="mt-2 bg-slate-800 text-slate-200 p-4 rounded-lg text-xs leading-relaxed overflow-x-auto">
            {JSON.stringify(values, null, 2)}
          </pre>
        </details>
      </div>
    </div>
  );
}

function Field({ label, description, value, onChange, placeholder }) {
  return (
    <div>
      <Label className="text-sm text-slate-700 mb-1">
        {label}
      </Label>
      {description && (
        <p className="text-xs text-slate-400 mb-1.5">{description}</p>
      )}
      <Input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}
