import { useState } from 'react';
import { Save, ExternalLink } from 'lucide-react';
import { getConfig } from '../config';

const STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'needs-review', label: 'Needs Review' },
  { value: 'published', label: 'Published' },
];

// Default categories -- edit these to match your content topics
const CATEGORY_OPTIONS = [
  'General',
  'How-To',
  'Guide',
  'Review',
  'News',
  'Tips',
  'Case Study',
  'Comparison',
];

export default function MetadataSidebar({ post, onChange, onSave, saving }) {
  const [tagsInput, setTagsInput] = useState(post.tags?.join(', ') || '');
  const config = getConfig();

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
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Status
          </label>
          <select
            value={post.status || 'draft'}
            onChange={(e) => handleChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Title
          </label>
          <input
            type="text"
            value={post.title || ''}
            onChange={(e) => handleChange('title', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
          <p className="text-xs text-slate-400 mt-1">
            {(post.title || '').length}/60 characters
          </p>
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Slug
          </label>
          <input
            type="text"
            value={post.slug || ''}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono text-xs focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>

        {/* Excerpt */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Excerpt
          </label>
          <textarea
            value={post.excerpt || ''}
            onChange={(e) => handleChange('excerpt', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Category
          </label>
          <select
            value={post.category || ''}
            onChange={(e) => handleChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 bg-white"
          >
            <option value="">Select category</option>
            {CATEGORY_OPTIONS.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Tags <span className="text-slate-400">(comma-separated)</span>
          </label>
          <input
            type="text"
            value={tagsInput}
            onChange={(e) => setTagsInput(e.target.value)}
            onBlur={handleTagsBlur}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>

        {/* Author */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Author
          </label>
          <input
            type="text"
            value={post.author || ''}
            onChange={(e) => handleChange('author', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Date
          </label>
          <input
            type="date"
            value={post.date || ''}
            onChange={(e) => handleChange('date', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>

        {/* Read time */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Read Time
          </label>
          <input
            type="text"
            value={post.read_time || ''}
            onChange={(e) => handleChange('read_time', e.target.value)}
            placeholder="8 min read"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
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
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Meta Description
          </label>
          <textarea
            value={post.meta_description || ''}
            onChange={(e) => handleChange('meta_description', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 resize-none"
          />
          <p className="text-xs text-slate-400 mt-1">
            {(post.meta_description || '').length}/160 characters
          </p>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Keywords
          </label>
          <input
            type="text"
            value={post.keywords || ''}
            onChange={(e) => handleChange('keywords', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
        </div>

        {/* Divider -- Media */}
        <div className="pt-2">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
            Media
          </p>
        </div>

        {/* Image URL */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            Featured Image URL
          </label>
          <input
            type="text"
            value={post.image || ''}
            onChange={(e) => handleChange('image', e.target.value)}
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
          />
          {post.image && (
            <img
              src={post.image}
              alt="Preview"
              className="mt-2 w-full h-32 object-cover rounded-lg border border-slate-100"
            />
          )}
        </div>

        {/* YouTube ID */}
        <div>
          <label className="block text-xs font-medium text-slate-500 mb-1.5">
            YouTube Video ID
          </label>
          <input
            type="text"
            value={post.youtube_id || ''}
            onChange={(e) => handleChange('youtube_id', e.target.value)}
            placeholder="e.g. dQw4w9WgXcQ"
            className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300"
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
