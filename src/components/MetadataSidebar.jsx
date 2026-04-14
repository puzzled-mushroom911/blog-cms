import { useState } from 'react';
import { Save, ExternalLink, Camera, Plus, Trash2, ChevronRight, Bot, Globe, BookOpen } from 'lucide-react';
import { getConfig } from '../config';
import ImageUpload from './ImageUpload';
import PexelsSearch from './PexelsSearch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const SOURCE_TYPES = [
  { value: 'reddit', label: 'Reddit', color: 'bg-orange-50 text-orange-700' },
  { value: 'youtube', label: 'YouTube', color: 'bg-red-50 text-red-700' },
  { value: 'government', label: 'Government', color: 'bg-blue-50 text-blue-700' },
  { value: 'news', label: 'News', color: 'bg-slate-100 text-slate-700' },
  { value: 'data', label: 'Data/Stats', color: 'bg-emerald-50 text-emerald-700' },
  { value: 'mls', label: 'MLS', color: 'bg-violet-50 text-violet-700' },
  { value: 'local', label: 'Local Source', color: 'bg-amber-50 text-amber-700' },
  { value: 'other', label: 'Other', color: 'bg-slate-50 text-slate-600' },
];

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'published', label: 'Published' },
];

export default function MetadataSidebar({ post, onChange, onSave, saving }) {
  const [tagsInput, setTagsInput] = useState(post.tags?.join(', ') || '');
  const config = getConfig();
  const { categories } = config;

  function handleChange(field, value) {
    onChange({ ...post, [field]: value });
  }

  function handleTagsBlur() {
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    onChange({ ...post, tags });
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 className="font-semibold text-slate-800 text-sm">Post Settings</h3>
        <a
          href={`${config.siteUrl}${config.blogPathPrefix}/${post.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
        >
          View on site <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Fields */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Status */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Status
          </Label>
          <Select value={post.status || 'draft'} onValueChange={(val) => handleChange('status', val)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Title */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Title
          </Label>
          <Input
            type="text"
            value={post.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
          />
          <p className="text-xs text-slate-400 mt-1">
            {(post.title || '').length}/60 characters
          </p>
        </div>

        {/* Slug */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Slug
          </Label>
          <Input
            type="text"
            value={post.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="font-mono text-xs"
          />
        </div>

        {/* Excerpt */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Excerpt
          </Label>
          <Textarea
            value={post.excerpt || ''}
            onChange={(e) => handleChange('excerpt', e.target.value)}
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Category
          </Label>
          <Select value={post.category || 'none'} onValueChange={(val) => handleChange('category', val === 'none' ? '' : val)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Select category</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Tags */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Tags <span className="text-slate-400 font-normal">(comma-separated)</span>
          </Label>
          <Input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={handleTagsBlur}
          />
        </div>

        {/* Author */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Author
          </Label>
          <Input
            type="text"
            value={post.author || ''}
            onChange={(e) => handleChange('author', e.target.value)}
          />
        </div>

        {/* Date */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Date
          </Label>
          <Input
            type="date"
            value={post.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
          />
        </div>

        {/* Read time */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Read Time
          </Label>
          <Input
            type="text"
            value={post.read_time || ''}
            onChange={(e) => handleChange('read_time', e.target.value)}
            placeholder="8 min read"
          />
        </div>

        {/* Divider -- SEO */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            SEO
          </p>
        </div>

        {/* Meta description */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Meta Description
          </Label>
          <Textarea
            value={post.meta_description || ''}
            onChange={(e) => handleChange('meta_description', e.target.value)}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            {(post.meta_description || '').length}/160 characters
          </p>
        </div>

        {/* Keywords */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Keywords
          </Label>
          <Input
            type="text"
            value={post.keywords || ''}
            onChange={(e) => handleChange('keywords', e.target.value)}
          />
        </div>

        {/* Divider -- Media */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Media
          </p>
        </div>

        {/* Featured Image Upload */}
        <ImageUpload
          label="Featured Image"
          value={post.image || ''}
          slug={post.slug || 'untitled'}
          previewHeight="h-32"
          onUpload={(url) => handleChange('image', url)}
          onRemove={() => handleChange('image', '')}
        />

        {/* Pexels stock image search */}
        {(() => {
          const config = getConfig();
          if (!config.pexelsApiKey) return null;
          return (
            <PexelsButton
              apiKey={config.pexelsApiKey}
              onSelect={(url) => handleChange('image', url)}
            />
          );
        })()}

        {/* Manual image URL fallback */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            Image URL <span className="text-slate-400 font-normal">(or paste)</span>
          </Label>
          <Input
            type="text"
            value={post.image || ''}
            onChange={(e) => handleChange('image', e.target.value)}
            placeholder="https://..."
          />
        </div>

        {/* YouTube ID */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5">
            YouTube Video ID
          </Label>
          <Input
            type="text"
            value={post.youtube_id || ''}
            onChange={(e) => handleChange('youtube_id', e.target.value)}
            placeholder="e.g. dQw4w9WgXcQ"
            className="font-mono"
          />
        </div>

        {/* Divider -- Research & Sources (CMS-only, not shown on public site) */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Research & Sources
          </p>
          <p className="text-[10px] text-slate-400 mb-3">
            Internal only — not displayed on the public website
          </p>
        </div>

        {/* Sources list */}
        <SourcesEditor
          sources={post.sources || []}
          onChange={(sources) => handleChange('sources', sources)}
        />

        {/* AI Reasoning */}
        <div>
          <Label className="text-xs text-slate-500 mb-1.5 flex items-center gap-1.5">
            <Bot className="w-3.5 h-3.5" />
            AI Reasoning
          </Label>
          <Textarea
            value={post.ai_reasoning || ''}
            onChange={(e) => handleChange('ai_reasoning', e.target.value)}
            rows={6}
            className="resize-y text-xs font-mono"
            placeholder="How the AI researched and structured this content..."
          />
        </div>
      </div>

      {/* Save button */}
      <div className="p-4 border-t border-slate-100">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-900 text-white rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}

function SourcesEditor({ sources, onChange }) {
  const [expanded, setExpanded] = useState(true);

  function addSource() {
    onChange([...sources, { url: '', title: '', type: 'other', note: '' }]);
  }

  function removeSource(index) {
    onChange(sources.filter((_, i) => i !== index));
  }

  function updateSource(index, field, value) {
    const updated = sources.map((s, i) => i === index ? { ...s, [field]: value } : s);
    onChange(updated);
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-between w-full mb-2"
      >
        <Label className="text-xs text-slate-500 flex items-center gap-1.5 cursor-pointer">
          <BookOpen className="w-3.5 h-3.5" />
          Sources ({sources.length})
        </Label>
        <ChevronRight className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
      </button>

      {expanded && (
        <div className="space-y-3">
          {sources.map((source, i) => {
            const typeMeta = SOURCE_TYPES.find(t => t.value === source.type) || SOURCE_TYPES[SOURCE_TYPES.length - 1];
            return (
              <div key={i} className="border border-slate-200 rounded-lg p-2.5 space-y-2">
                <div className="flex items-center justify-between">
                  <Select value={source.type || 'other'} onValueChange={(val) => updateSource(i, 'type', val)}>
                    <SelectTrigger className="h-7 w-28 text-[10px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SOURCE_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${t.color}`}>{t.label}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <button
                    type="button"
                    onClick={() => removeSource(i)}
                    className="p-1 text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <Input
                  type="text"
                  value={source.title || ''}
                  onChange={(e) => updateSource(i, 'title', e.target.value)}
                  placeholder="Source title"
                  className="h-7 text-xs"
                />
                <Input
                  type="text"
                  value={source.url || ''}
                  onChange={(e) => updateSource(i, 'url', e.target.value)}
                  placeholder="https://..."
                  className="h-7 text-xs font-mono"
                />
                {source.url && (
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-indigo-500 hover:text-indigo-700 flex items-center gap-1">
                    <Globe className="w-2.5 h-2.5" /> Open link
                  </a>
                )}
                <Input
                  type="text"
                  value={source.note || ''}
                  onChange={(e) => updateSource(i, 'note', e.target.value)}
                  placeholder="Why this source matters..."
                  className="h-7 text-xs"
                />
              </div>
            );
          })}
          <button
            type="button"
            onClick={addSource}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Source
          </button>
        </div>
      )}
    </div>
  );
}

function PexelsButton({ apiKey, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 border border-dashed border-slate-300 rounded-lg text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
      >
        <Camera className="w-3.5 h-3.5" />
        Search Pexels
      </button>
      {open && (
        <PexelsSearch
          apiKey={apiKey}
          onSelect={onSelect}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
