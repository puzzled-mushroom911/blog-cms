import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchSeoPageById, updateSeoPage, deleteSeoPage, approveSeoPage } from '../lib/seoPages';
import ContentRenderer from '../components/ContentRenderer';
import StatusBadge from '../components/StatusBadge';
import {
  ArrowLeft, Save, Trash2, CheckCircle, Loader2, Globe,
  Calendar, Eye, PanelRight, PanelRightClose,
} from 'lucide-react';

const PAGE_TYPES = ['moving-from', 'compare', 'zip-code', 'neighborhood', 'schools'];
const STATUS_OPTIONS = ['draft', 'needs-review', 'published'];

export default function SeoPageEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [showSidebar, setShowSidebar] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadPage();
  }, [id]);

  async function loadPage() {
    setLoading(true);
    try {
      const data = await fetchSeoPageById(id);
      setPage(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function updateField(field, value) {
    setPage(prev => ({ ...prev, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const { id: _, created_at, updated_at, ...updates } = page;
      await updateSeoPage(id, updates);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleApprove() {
    setSaving(true);
    try {
      const updated = await approveSeoPage(id, page.scheduled_date);
      setPage(updated);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteSeoPage(id);
      navigate('/seo-pages');
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex items-center justify-center min-h-screen text-slate-500">
        Page not found.
      </div>
    );
  }

  const previewUrl = page.page_type === 'moving-from'
    ? `/moving-from/${page.slug}`
    : `/${page.page_type}/${page.slug}`;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/seo-pages')} className="text-slate-400 hover:text-slate-600">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <StatusBadge status={page.status} />
          <span className="text-sm text-slate-500 truncate max-w-xs">{page.title}</span>
        </div>
        <div className="flex items-center gap-2">
          {page.status === 'needs-review' && (
            <button
              onClick={handleApprove}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Approve
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowSidebar(!showSidebar)}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            {showSidebar ? <PanelRightClose className="w-4 h-4" /> : <PanelRight className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-4 mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-lg">{error}</div>
      )}

      <div className="flex">
        {/* Content preview */}
        <div className={`flex-1 p-6 ${showSidebar ? 'mr-80' : ''} transition-all`}>
          <div className="max-w-3xl mx-auto bg-white rounded-xl border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-900 mb-2">{page.h1 || page.title}</h1>
            {page.meta_description && (
              <p className="text-sm text-slate-500 mb-6 italic">{page.meta_description}</p>
            )}
            {Array.isArray(page.content) && page.content.length > 0 ? (
              <ContentRenderer content={page.content} />
            ) : (
              <p className="text-slate-400 text-sm italic">No content blocks yet.</p>
            )}

            {/* Structured data summary */}
            {page.data && Object.keys(page.data).length > 0 && (
              <details className="mt-8 border-t border-slate-100 pt-4">
                <summary className="text-sm font-medium text-slate-500 cursor-pointer hover:text-slate-700">
                  Structured Data ({Object.keys(page.data).length} fields)
                </summary>
                <pre className="mt-2 text-xs text-slate-600 bg-slate-50 p-3 rounded-lg overflow-auto max-h-60">
                  {JSON.stringify(page.data, null, 2)}
                </pre>
              </details>
            )}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <aside className="fixed right-0 top-14 bottom-0 w-80 bg-white border-l border-slate-200 overflow-y-auto p-4 space-y-4">
            <h2 className="font-semibold text-sm text-slate-900">Page Settings</h2>

            {/* Status */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Status</span>
              <select
                value={page.status}
                onChange={e => updateField('status', e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {STATUS_OPTIONS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </label>

            {/* Page Type */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Page Type</span>
              <select
                value={page.page_type}
                onChange={e => updateField('page_type', e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              >
                {PAGE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </label>

            {/* Title */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Title</span>
              <input
                type="text"
                value={page.title}
                onChange={e => updateField('title', e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
              <span className="text-xs text-slate-400 mt-0.5 block">{page.title.length}/60</span>
            </label>

            {/* Slug */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Slug</span>
              <input
                type="text"
                value={page.slug}
                onChange={e => updateField('slug', e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono"
              />
            </label>

            {/* H1 */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">H1</span>
              <input
                type="text"
                value={page.h1}
                onChange={e => updateField('h1', e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>

            {/* Scheduled Date */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Scheduled Date</span>
              <input
                type="date"
                value={page.scheduled_date || ''}
                onChange={e => updateField('scheduled_date', e.target.value || null)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
              />
            </label>

            <hr className="border-slate-100" />
            <h2 className="font-semibold text-sm text-slate-900">SEO</h2>

            {/* Meta Description */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Meta Description</span>
              <textarea
                value={page.meta_description}
                onChange={e => updateField('meta_description', e.target.value)}
                rows={3}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none"
              />
              <span className={`text-xs mt-0.5 block ${page.meta_description.length > 160 ? 'text-red-500' : 'text-slate-400'}`}>
                {page.meta_description.length}/160
              </span>
            </label>

            {/* Keywords */}
            <label className="block">
              <span className="text-xs font-medium text-slate-500">Keywords</span>
              <input
                type="text"
                value={page.keywords || ''}
                onChange={e => updateField('keywords', e.target.value)}
                className="mt-1 w-full border border-slate-200 rounded-lg px-3 py-2 text-sm"
                placeholder="comma, separated, keywords"
              />
            </label>

            {/* Preview link */}
            <div className="pt-2">
              <a
                href={`${import.meta.env.VITE_SITE_URL || ''}${previewUrl}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700"
              >
                <Eye className="w-3.5 h-3.5" />
                Preview on site
              </a>
            </div>
          </aside>
        )}
      </div>

      {/* Delete confirmation modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 max-w-sm mx-4">
            <h3 className="font-semibold text-slate-900">Delete this page?</h3>
            <p className="text-sm text-slate-500 mt-1">This action cannot be undone.</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-3 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
