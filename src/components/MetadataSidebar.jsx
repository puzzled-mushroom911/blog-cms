import { useState } from 'react';
import { Save, ExternalLink, Camera } from 'lucide-react';
import { getConfig } from '../config';
import ImageUpload from './ImageUpload';
import PexelsSearch from './PexelsSearch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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
