import { useState, useEffect } from 'react';
import { getConfig, saveConfig } from '../config';
import { toast } from 'sonner';
import { Save, RotateCcw, Database, Unplug, Trash2, Plus, BookOpen, Power, PowerOff, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConnection } from '../contexts/ConnectionContext';
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
  const navigate = useNavigate();
  const connection = getStoredConnection();

  const supabase = useSupabase();
  const [preferences, setPreferences] = useState([]);
  const [loadingPrefs, setLoadingPrefs] = useState(true);
  const [newRule, setNewRule] = useState('');
  const [newCategory, setNewCategory] = useState('tone');
  const [addingRule, setAddingRule] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, []);

  async function loadPreferences() {
    setLoadingPrefs(true);
    const { data } = await supabase
      .from('preferences')
      .select('*')
      .order('created_at', { ascending: true });
    setPreferences(data || []);
    setLoadingPrefs(false);
  }

  async function handleAddRule() {
    const trimmed = newRule.trim();
    if (!trimmed) return;
    setAddingRule(true);
    const { data, error } = await supabase
      .from('preferences')
      .insert({ rule: trimmed, category: newCategory })
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

  function handleChange(field, value) {
    setValues((prev) => ({ ...prev, [field]: value }));
  }

  function handleSave() {
    saveConfig(values);
    toast.success('Settings saved');
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
          Configure your brand and site details. Changes are saved to your browser.
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
            disconnect();
            navigate('/connect');
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
